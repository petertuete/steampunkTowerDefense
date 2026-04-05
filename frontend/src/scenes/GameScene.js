import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy.js';
import { Tower } from '../entities/Tower.js';
import { PATHS, getPixelPath } from '../config/paths.js';
import { TOWER_TYPES, STARTING_GOLD } from '../config/towers.js';
import { LEVELS, WAVE_CONFIG, DEFAULT_LEVEL } from '../config/waves.js';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const CLIENT_VERSION = import.meta.env.VITE_CLIENT_VERSION || 'dev-local';

/**
 * GameScene - Hauptszene des Spiels
 * 
 * Dies ist die Basis-Scene für das Tower Defense Spiel.
 * Aktuell: Grid + Gegner-Bewegung + Click-to-Place Türme
 * 
 * Meilenstein 1: Basis GameLoop, Gegner, Türme, HUD
 */

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    // Nur echte Konstanten hier - werden vom Constructor nicht bei restart() neu gesetzt
    this.TILE_SIZE = 40;
    this.HUD_HEIGHT = 110;
    this.selectedTowerType = TOWER_TYPES.steamCannon;
    this.selectedLevelKey = DEFAULT_LEVEL;
  }

  preload() {
    // Hier werden später Assets geladen (Sprites, Tilesets, etc.)
    console.log('GameScene preload');
  }

  init(data) {
    this.restartData = data || {};
  }

  create() {
    // Spielzustand zurücksetzen (läuft bei scene.restart() neu)
    const carried = this.restartData?.campaignContinue ? this.restartData.carryState || {} : null;

    this.enemies = [];
    this.towers = [];
    this.projectiles = [];
    this.gold = carried ? carried.gold : STARTING_GOLD;
    if (this.restartData?.campaignContinue && this.restartData.selectedLevelKey) {
      this.selectedLevelKey = this.restartData.selectedLevelKey;
    }
    if (!this.selectedLevelKey || !LEVELS[this.selectedLevelKey]) {
      this.selectedLevelKey = DEFAULT_LEVEL;
    }
    this.currentLevel = LEVELS[this.selectedLevelKey];
    this.currentWaveIndex = 0;
    this.lives = carried ? carried.lives : WAVE_CONFIG.MAX_LIVES;
    this.waveTimer = null;
    this.waveSpawnTimer = null;
    this.wavePauseTimer = 0;
    this.gameSpeedMultiplier = 1;
    this.gameState = 'playing';
    this.hasStartedFirstWave = false;
    this.enemiesInCurrentWave = [];
    this.waveSpawnComplete = false;
    this.endScreenShown = false;
    this.runSummaryLogged = false;
    this.totalKills = carried ? carried.totalKills : 0;
    this.totalLeaks = carried ? carried.totalLeaks : 0;
    this.totalGoldEarned = carried ? carried.totalGoldEarned : 0;
    this.totalGoldSpent = carried ? carried.totalGoldSpent : 0;
    this.towerPlacementStats = carried ? carried.towerPlacementStats || {} : {};
    this.towerUsageByLevel = carried ? carried.towerUsageByLevel || {} : {};
    this.nextTowerPlacementId = carried ? carried.nextTowerPlacementId || 1 : 1;
    this.completedLevelKeys = carried ? carried.completedLevelKeys || [] : [];
    this.accumulatedScoreGold = carried ? carried.accumulatedScoreGold || 0 : 0;
    this.finalTotalScoreGold = this.accumulatedScoreGold + this.gold;
    this.hasSubmittedRun = false;
    this.isSubmittingRun = false;
    this.scoreSubmitStatusText = null;
    this.scoreSubmitButton = null;
    this.topScoresTitleText = null;
    this.topScoresText = null;
    this.clientVersion = CLIENT_VERSION;
    this.towerTypeKeys = Object.keys(TOWER_TYPES);
    this.selectedTowerIndex = this.towerTypeKeys.indexOf('steamCannon');
    if (this.selectedTowerIndex < 0) {
      this.selectedTowerIndex = 0;
    }
    this.selectedTowerType = TOWER_TYPES[this.towerTypeKeys[this.selectedTowerIndex]];
    this.ensureLevelUsageBucket(this.selectedLevelKey);

    // Basis-Konfiguration
    const GRID_WIDTH = 32;  // 1280 / 40
    const GRID_HEIGHT = 24; // 960 / 40
    const FIELD_TOP = this.HUD_HEIGHT; // Spielfeld fängt nach HUD an

    // Gitter zeichnen zum Visualisieren (nur im Spielfeld-Bereich)
    const graphics = this.make.graphics({ x: 0, y: FIELD_TOP, add: false });
    graphics.lineStyle(1, 0x444444, 1);

    // Vertikale Linien
    for (let x = 0; x <= this.scale.width; x += this.TILE_SIZE) {
      graphics.beginPath();
      graphics.moveTo(x, 0);
      graphics.lineTo(x, this.scale.height - FIELD_TOP);
      graphics.strokePath();
    }

    // Horizontale Linien
    for (let y = 0; y <= this.scale.height - FIELD_TOP; y += this.TILE_SIZE) {
      graphics.beginPath();
      graphics.moveTo(0, y);
      graphics.lineTo(this.scale.width, y);
      graphics.strokePath();
    }

    graphics.generateTexture('grid', this.scale.width, this.scale.height - FIELD_TOP);
    graphics.destroy();

    // Grid als Bild anzeigen (mit Offset)
    this.add.image(0, FIELD_TOP, 'grid').setOrigin(0, 0);

    // Pfad visualisieren (als Felder, nicht als Linien, mit Offset)
    const levelPathKey = `level${this.currentLevel.levelNumber}`;
    const gridPath = PATHS[levelPathKey] || PATHS.level1;
    const pathGraphics = this.make.graphics({ x: 0, y: FIELD_TOP, add: true });
    
    // Alle Pfad-Felder zeichnen (grau)
    pathGraphics.fillStyle(0x888888, 0.35);
    pathGraphics.lineStyle(2, 0xaaaaaa, 0.6);
    
    for (const gridCoord of gridPath) {
      const px = gridCoord.gridX * this.TILE_SIZE;
      const py = gridCoord.gridY * this.TILE_SIZE;
      pathGraphics.fillRect(px, py, this.TILE_SIZE, this.TILE_SIZE);
      pathGraphics.strokeRect(px, py, this.TILE_SIZE, this.TILE_SIZE);
    }

    // Startfeld grün markieren
    const startCoord = gridPath[0];
    pathGraphics.fillStyle(0x00ff00, 0.5);
    pathGraphics.lineStyle(3, 0x00ff00, 1);
    const startPx = startCoord.gridX * this.TILE_SIZE;
    const startPy = startCoord.gridY * this.TILE_SIZE;
    pathGraphics.fillRect(startPx, startPy, this.TILE_SIZE, this.TILE_SIZE);
    pathGraphics.strokeRect(startPx, startPy, this.TILE_SIZE, this.TILE_SIZE);

    // Zielfeld rot markieren
    const endCoord = gridPath[gridPath.length - 1];
    pathGraphics.fillStyle(0xff0000, 0.5);
    pathGraphics.lineStyle(3, 0xff0000, 1);
    const endPx = endCoord.gridX * this.TILE_SIZE;
    const endPy = endCoord.gridY * this.TILE_SIZE;
    pathGraphics.fillRect(endPx, endPy, this.TILE_SIZE, this.TILE_SIZE);
    pathGraphics.strokeRect(endPx, endPy, this.TILE_SIZE, this.TILE_SIZE);

    // Pfad speichern für Gegner-Spawning + Kollisionen
    const pixelPath = getPixelPath(gridPath);
    
    // Pfad-Offset für HUD hinzufügen (Gegner brauchen absolute Screen-Koordinaten)
    this.currentPath = pixelPath.map(p => ({
      x: p.x,
      y: p.y + this.HUD_HEIGHT
    }));
    this.gridPath = gridPath; // Speichere auch Grid-Koordinaten für Kollisions-Check

    // Text-Info (HUD, oben außerhalb des Spielfelds)
    // Hintergrund für bessere Lesbarkeit
    const hudBackground = this.make.graphics({ x: 0, y: 0, add: true });
    hudBackground.fillStyle(0x000000, 0.7);
    hudBackground.fillRect(0, 0, this.scale.width, this.HUD_HEIGHT);

    this.infoText = this.add.text(10, 10, 'Gegner: 0', {
      fontSize: '12px',
      fill: '#00ff00',
      fontFamily: 'Courier'
    });

    this.goldText = this.add.text(10, 30, `Gold: ${this.gold}`, {
      fontSize: '14px',
      fill: '#ffff00',
      fontFamily: 'Courier',
      fontStyle: 'bold'
    });

    this.towerText = this.add.text(10, 50, `Türme: 0 | ${this.selectedTowerType.name} (${this.selectedTowerType.cost}g)`, {
      fontSize: '12px',
      fill: '#ff88ff',
      fontFamily: 'Courier'
    });

    this.towerSwitchFxText = this.add.text(10, 88, '', {
      fontSize: '11px',
      fill: '#00ffff',
      fontFamily: 'Courier',
      fontStyle: 'bold'
    }).setAlpha(0);

    this.sellModeText = this.add.text(320, 70, 'MODUS: BAUEN', {
      fontSize: '11px',
      fill: '#66ff66',
      fontFamily: 'Courier',
      fontStyle: 'bold'
    });

    // Tower-Cursor-Preview Graphics
    this.towerPreviewGraphics = this.make.graphics({ x: 0, y: 0, add: true });
    this.towerPreviewGraphics.setDepth(999);

    this.add.text(10, 92, 'Click platzieren | Shift+Click verkaufen | T wechseln | S Speed', {
      fontSize: '11px',
      fill: '#888888',
      fontFamily: 'Courier'
    });

    // Leben-Anzeige
    this.livesText = this.add.text(600, 10, `Leben: ${this.lives}`, {
      fontSize: '14px',
      fill: '#ff4444',
      fontFamily: 'Courier',
      fontStyle: 'bold'
    });

    // Wellen-Anzeige
    this.waveText = this.add.text(600, 30, `Welle: ${this.currentWaveIndex + 1}/${this.currentLevel.totalWaves}`, {
      fontSize: '14px',
      fill: '#44ff44',
      fontFamily: 'Courier',
      fontStyle: 'bold'
    });

    // Wellen-Timer
    this.waveTimerText = this.add.text(600, 50, 'Welle läuft...', {
      fontSize: '12px',
      fill: '#ffff44',
      fontFamily: 'Courier'
    });

    this.speedText = this.add.text(600, 70, 'Speed: 1x [S]', {
      fontSize: '12px',
      fill: '#66ccff',
      fontFamily: 'Courier',
      fontStyle: 'bold'
    });

    // Level-Auswahl (HUD)
    const levelLabelX = 760;
    this.add.text(levelLabelX, 10, 'Level:', {
      fontSize: '12px',
      fill: '#cccccc',
      fontFamily: 'Courier'
    });

    this.levelButtons = {};
    const availableLevelKeys = Object.keys(LEVELS).sort((a, b) => LEVELS[a].levelNumber - LEVELS[b].levelNumber);
    let nextLevelButtonX = levelLabelX + 52;
    availableLevelKeys.forEach((levelKey) => {
      const levelName = LEVELS[levelKey].displayName || `Level ${LEVELS[levelKey].levelNumber}`;
      const btn = this.add.text(nextLevelButtonX, 10, `[${levelName}]`, {
        fontSize: '12px',
        fill: '#999999',
        fontFamily: 'Courier',
        fontStyle: 'bold'
      }).setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => this.switchLevel(levelKey));
      this.levelButtons[levelKey] = btn;
      nextLevelButtonX += btn.width + 16;
    });
    this.updateLevelSelectorUI();

    // Skip-Button (nur während wave-pause sichtbar)
    this.skipWaveBtn = this.add.text(950, 40, '[ ▶ JETZT STARTEN ] [Space]', {
      fontSize: '13px',
      fill: '#ffffff',
      fontFamily: 'Courier',
      fontStyle: 'bold',
      backgroundColor: '#005500',
      padding: { x: 10, y: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setVisible(false);

    this.skipWaveBtn.on('pointerover', () => this.skipWaveBtn.setStyle({ fill: '#ffff00' }));
    this.skipWaveBtn.on('pointerout', () => this.skipWaveBtn.setStyle({ fill: '#ffffff' }));
    this.skipWaveBtn.on('pointerdown', () => {
      if (this.gameState === 'wave-pause') {
        this.wavePauseTimer = 0;
      }
    });

    // Leertaste als Tastenkürzel für Skip
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.gameState === 'wave-pause') {
        this.wavePauseTimer = 0;
      }
    });

    // Taste T: Turm-Typ zyklisch wechseln
    this.input.keyboard.on('keydown-T', () => {
      this.cycleTowerType();
    });

    // Taste S: Spielgeschwindigkeit 1x/2x
    this.input.keyboard.on('keydown-S', () => {
      this.toggleGameSpeed();
    });

    this.isShiftPressed = false;
    this.input.keyboard.on('keydown-SHIFT', () => {
      this.isShiftPressed = true;
    });
    this.input.keyboard.on('keyup-SHIFT', () => {
      this.isShiftPressed = false;
    });
    this.game.events.on('blur', () => {
      this.isShiftPressed = false;
      if (this.game && this.game.canvas) {
        this.game.canvas.style.cursor = 'auto';
      }
    });

    // Click-Event für Turm-Platzierung oder -Verkauf
    this.input.on('pointerdown', (pointer) => {
      // Native Event-Modifikator ist für Safari stabiler als globaler Keyboard-State
      const isShiftPressed = Boolean(pointer.event && pointer.event.shiftKey);
      
      if (isShiftPressed) {
        // Shift + Click: Turm verkaufen
        this.tryRemoveTower(pointer.x, pointer.y);
      } else {
        // Normal Click: Turm platzieren
        this.tryPlaceTower(pointer.x, pointer.y);
      }
    });

    // Mouse-Move: Cursor ändern bei Hover über Turm
    this.input.on('pointermove', (pointer) => {
      const fieldY = pointer.y - this.HUD_HEIGHT;
      if (fieldY >= 0) {
        const isShiftPressed = Boolean(this.isShiftPressed);
        const tower = this.getTowerAtPosition(pointer.x, pointer.y);
        if (isShiftPressed && tower) {
          this.game.canvas.style.cursor = 'not-allowed'; // Rotes Verbotszeichen simulieren
        } else if (isShiftPressed) {
          this.game.canvas.style.cursor = 'pointer'; // Verkaufsmodus aktiv
        } else {
          this.game.canvas.style.cursor = 'crosshair'; // Crosshair zum Platzieren
        }
      } else {
        this.game.canvas.style.cursor = 'auto';
      }
    });

    // Initiale Bauphase vor der ersten Welle
    this.gameState = 'wave-pause';
    this.wavePauseTimer = WAVE_CONFIG.INITIAL_BUILD_PAUSE;
    this.waveTimerText.setText(`Erste Welle in: ${Math.ceil(this.wavePauseTimer / 1000)}s`);
  }

  switchLevel(levelKey) {
    if (!LEVELS[levelKey] || this.selectedLevelKey === levelKey) {
      return;
    }

    this.selectedLevelKey = levelKey;
    this.scene.restart();
  }

  getOrderedLevelKeys() {
    return Object.keys(LEVELS).sort((a, b) => LEVELS[a].levelNumber - LEVELS[b].levelNumber);
  }

  getNextLevelKey(currentLevelKey) {
    const keys = this.getOrderedLevelKeys();
    const index = keys.indexOf(currentLevelKey);
    if (index < 0 || index >= keys.length - 1) {
      return null;
    }
    return keys[index + 1];
  }

  getTotalScoreGold() {
    return this.finalTotalScoreGold || (this.accumulatedScoreGold + this.gold);
  }

  advanceToNextLevel(nextLevelKey) {
    const carryState = {
      gold: STARTING_GOLD,
      lives: this.lives,
      totalKills: this.totalKills,
      totalLeaks: this.totalLeaks,
      totalGoldEarned: this.totalGoldEarned,
      totalGoldSpent: this.totalGoldSpent,
      towerPlacementStats: { ...this.towerPlacementStats },
      towerUsageByLevel: JSON.parse(JSON.stringify(this.towerUsageByLevel)),
      nextTowerPlacementId: this.nextTowerPlacementId,
      completedLevelKeys: [...this.completedLevelKeys, this.selectedLevelKey],
      accumulatedScoreGold: this.accumulatedScoreGold + this.gold
    };

    this.scene.restart({
      campaignContinue: true,
      selectedLevelKey: nextLevelKey,
      carryState
    });
  }

  updateLevelSelectorUI() {
    if (!this.levelButtons) {
      return;
    }

    Object.entries(this.levelButtons).forEach(([levelKey, button]) => {
      const isActive = levelKey === this.selectedLevelKey;
      button.setStyle({ fill: isActive ? '#ffff66' : '#999999' });
    });
  }

  toggleGameSpeed() {
    this.gameSpeedMultiplier = this.gameSpeedMultiplier === 1 ? 2 : 1;

    if (this.waveSpawnTimer) {
      this.waveSpawnTimer.timeScale = this.gameSpeedMultiplier;
    }

    if (this.speedText) {
      this.speedText.setText(`Speed: ${this.gameSpeedMultiplier}x [S]`);
      this.speedText.setStyle({ fill: this.gameSpeedMultiplier > 1 ? '#ffaa66' : '#66ccff' });
    }

    console.log(`⏩ Spielgeschwindigkeit: ${this.gameSpeedMultiplier}x`);
  }

  cycleTowerType() {
    if (!this.towerTypeKeys || this.towerTypeKeys.length === 0) {
      return;
    }

    this.selectedTowerIndex = (this.selectedTowerIndex + 1) % this.towerTypeKeys.length;
    const nextKey = this.towerTypeKeys[this.selectedTowerIndex];
    this.selectedTowerType = TOWER_TYPES[nextKey];

    if (this.towerText) {
      this.towerText.setText(`Türme: ${this.towers.length} | ${this.selectedTowerType.name} (${this.selectedTowerType.cost}g)`);
    }

    this.showTowerSwitchFeedback();

    console.log(`Turm gewechselt: ${this.selectedTowerType.name} (${this.selectedTowerType.cost}g)`);
  }

  showTowerSwitchFeedback() {
    if (this.towerSwitchPulseTween) {
      this.towerSwitchPulseTween.stop();
    }
    if (this.towerSwitchFadeTween) {
      this.towerSwitchFadeTween.stop();
    }

    if (this.towerText) {
      this.towerText.setStyle({ fill: '#00ffff' });
      this.towerSwitchPulseTween = this.tweens.add({
        targets: this.towerText,
        scaleX: 1.07,
        scaleY: 1.07,
        duration: 90,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          if (this.towerText) {
            this.towerText.setScale(1);
            this.towerText.setStyle({ fill: '#ff88ff' });
          }
        }
      });
    }

    if (this.towerSwitchFxText) {
      this.towerSwitchFxText.setText(`>> ${this.selectedTowerType.name} aktiv`);
      this.towerSwitchFxText.setY(88);
      this.towerSwitchFxText.setAlpha(1);

      this.towerSwitchFadeTween = this.tweens.add({
        targets: this.towerSwitchFxText,
        y: 82,
        alpha: 0,
        duration: 700,
        ease: 'Quad.easeOut'
      });
    }
  }

  updateCursorPreview() {
    if (!this.towerPreviewGraphics) {
      return;
    }

    // Nur im Spielfeld anzeigen (nicht im HUD oder Endscreen)
    if (this.gameState === 'won' || this.gameState === 'lost') {
      this.towerPreviewGraphics.clear();
      return;
    }

    // Maus-Position holen
    const pointer = this.input.activePointer;
    const x = pointer.x;
    const y = pointer.y;

    // Nur im Spielfeld zeigen (y >= HUD_HEIGHT)
    if (y < this.HUD_HEIGHT) {
      this.towerPreviewGraphics.clear();
      return;
    }

    this.towerPreviewGraphics.clear();

    // Tower-Preview als durchsichtiges Quadrat (40x40) mit Range-Kreis
    const TOWER_WIDTH = 40;
    const TOWER_HEIGHT = 40;

    // Range-Kreis zeichnen (sehr transparent)
    this.towerPreviewGraphics.fillStyle(this.selectedTowerType.color, 0.05);
    this.towerPreviewGraphics.fillCircle(x, y, this.selectedTowerType.range);
    this.towerPreviewGraphics.lineStyle(1, this.selectedTowerType.color, 0.3);
    this.towerPreviewGraphics.strokeCircle(x, y, this.selectedTowerType.range);

    // Tower-Quadrat zeichnen (semi-transparent zur Farbe des Turms)
    this.towerPreviewGraphics.fillStyle(this.selectedTowerType.color, 0.4);
    this.towerPreviewGraphics.fillRect(
      x - TOWER_WIDTH / 2,
      y - TOWER_HEIGHT / 2,
      TOWER_WIDTH,
      TOWER_HEIGHT
    );

    // Outline
    this.towerPreviewGraphics.lineStyle(2, this.selectedTowerType.color, 0.7);
    this.towerPreviewGraphics.strokeRect(
      x - TOWER_WIDTH / 2,
      y - TOWER_HEIGHT / 2,
      TOWER_WIDTH,
      TOWER_HEIGHT
    );
  }

  update(time, deltaTime) {
    const scaledDeltaTime = deltaTime * this.gameSpeedMultiplier;

    // Cursor-Preview zeichnen und aktualisieren
    this.updateCursorPreview();

    // **HUD immer aktualisieren, egal welcher State**
    if (this.infoText) {
      this.infoText.setText(`Gegner: ${this.enemies.length}`);
    }
    if (this.goldText) {
      this.goldText.setText(`Gold: ${this.gold}`);
    }
    if (this.towerText) {
      this.towerText.setText(`Türme: ${this.towers.length} | ${this.selectedTowerType.name} (${this.selectedTowerType.cost}g)`);
    }
    if (this.livesText) {
      this.livesText.setText(`Leben: ${this.lives}`);
    }
    if (this.waveText) {
      this.waveText.setText(`Welle: ${this.currentWaveIndex + 1}/${this.currentLevel.totalWaves}`);
    }
    if (this.speedText) {
      this.speedText.setText(`Speed: ${this.gameSpeedMultiplier}x [S]`);
    }
    if (this.sellModeText) {
      if (this.isShiftPressed) {
        this.sellModeText.setText('MODUS: VERKAUF (Shift gehalten)');
        this.sellModeText.setStyle({ fill: '#ff6666' });
      } else {
        this.sellModeText.setText('MODUS: BAUEN');
        this.sellModeText.setStyle({ fill: '#66ff66' });
      }
    }

    // Game-State Checks (nach HUD-Update!)
    if (this.gameState === 'won' || this.gameState === 'lost') {
      if (!this.endScreenShown) {
        this.endScreenShown = true;
        this.logRunSummary();
        if (this.gameState === 'won') this.showWinScreen();
        else this.showGameOverScreen();
      }
      return;
    }

    // Wave-Pause abziehen
    if (this.gameState === 'wave-pause') {
      this.skipWaveBtn.setVisible(true);
      this.wavePauseTimer -= scaledDeltaTime;
      const secondsLeft = Math.max(0, Math.ceil(this.wavePauseTimer / 1000));
      if (!this.hasStartedFirstWave) {
        this.waveTimerText.setText(`Erste Welle in: ${secondsLeft}s`);
      } else {
        this.waveTimerText.setText(`Nächste Welle in: ${secondsLeft}s`);
      }

      // Türme auch in der Pause rendern
      for (const tower of this.towers) {
        tower.draw();
      }

      if (this.wavePauseTimer <= 0) {
        this.skipWaveBtn.setVisible(false);
        if (!this.hasStartedFirstWave) {
          this.startWave();
        } else {
          this.startNextWave();
        }
      }
      return;
    }

    // Gegner updaten
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(scaledDeltaTime);
      enemy.draw();

      // Gegner entfernen wenn tot oder am Ende
      if (!enemy.isAlive || enemy.reachedEnd) {
        // Gold-Reward wenn Gegner gestorben
        if (!enemy.isAlive && enemy.reward) {
          const rewardMultiplier = this.selectedLevelKey === 'level2' ? 2 : 1;
          const actualReward = enemy.reward * rewardMultiplier;
          this.gold += actualReward;
          this.totalKills += 1;
          this.totalGoldEarned += actualReward;
          console.log(`Kill! +${actualReward}g (Total: ${this.gold})`);
        }

        // Leben verlieren wenn Gegner durchkommt
        if (enemy.reachedEnd) {
          this.lives -= 1;
          this.totalLeaks += 1;
          console.log(`Gegner durchgekommen! Leben: ${this.lives}`);
          if (this.lives <= 0) {
            this.finalTotalScoreGold = this.accumulatedScoreGold + this.gold;
            this.gameState = 'lost';
            return;
          }
        }

        enemy.destroy();
        this.enemies.splice(i, 1);
        
        // Auch aus Wave-Liste entfernen
        const waveIndex = this.enemiesInCurrentWave.indexOf(enemy);
        if (waveIndex > -1) {
          this.enemiesInCurrentWave.splice(waveIndex, 1);
        }
      }
    }

    // Prüfe ob aktuelle Welle fertig ist (nur wenn Spawn abgeschlossen!)
    if (this.waveSpawnComplete && this.enemiesInCurrentWave.length === 0 && this.enemies.length === 0) {
      console.log(`✅ Welle ${this.currentWaveIndex + 1} fertig!`);
      // Alle Gegner der Welle besiegt
      if (this.currentWaveIndex >= this.currentLevel.totalWaves - 1) {
        const nextLevelKey = this.getNextLevelKey(this.selectedLevelKey);
        if (nextLevelKey) {
          this.advanceToNextLevel(nextLevelKey);
          return;
        }

        // Letztes verfügbares Level geschafft
        this.finalTotalScoreGold = this.accumulatedScoreGold + this.gold;
        this.gameState = 'won';
        return;
      } else {
        // Nächste Welle mit Pause
        this.gameState = 'wave-pause';
        this.wavePauseTimer = WAVE_CONFIG.PAUSE_BETWEEN_WAVES;
      }
    }

    // Türme updaten
    for (const tower of this.towers) {
      tower.update(scaledDeltaTime, this.enemies);
    }

    // Projektile updaten
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      projectile.update(scaledDeltaTime);
      projectile.draw();

      // Inaktive Projektile entfernen
      if (!projectile.isActive) {
        projectile.destroy();
        this.projectiles.splice(i, 1);
      }
    }

    // (HUD-Updates sind jetzt am Anfang der update()-Methode!)
  }


  tryRemoveTower(screenX, screenY) {
    // Offset für HUD abziehen
    const fieldY = screenY - this.HUD_HEIGHT;
    
    // Nur im Spielfeld
    if (fieldY < 0) {
      return;
    }

    const absoluteY = screenY;
    const tower = this.getTowerAtPosition(screenX, absoluteY);
    
    if (!tower) {
      return; // Kein Turm getroffen
    }

    // Turm verkaufen: 75% des Kaufpreises zurück
    const refund = Math.floor(tower.type.cost * 0.75);
    this.gold += refund;
    this.totalGoldSpent -= tower.type.cost; // Vom Ausgaben-Tracker abziehen
    
    // Turm aus Array entfernen
    const index = this.towers.indexOf(tower);
    if (index > -1) {
      this.towers.splice(index, 1);
    }

    this.markTowerSoldInAnalytics(tower);
    
    // Visuelles sauber entfernen (inkl. Reichweitenring + Ziellinie)
    if (tower.destroy) {
      tower.destroy();
    }
    
    console.log(`Turm verkauft! +${refund}g (75% von ${tower.type.cost}g). Gold jetzt: ${this.gold}`);
  }

  tryPlaceTower(screenX, screenY) {
    // Offset für HUD abziehen
    const fieldY = screenY - this.HUD_HEIGHT;
    
    // Türme nur im Spielfeld platzierbar
    if (fieldY < 0) {
      return;
    }

    // 1. Auf Grid-Position snappen
    const gridX = Math.round(screenX / this.TILE_SIZE) * this.TILE_SIZE;
    const gridY = Math.round(fieldY / this.TILE_SIZE) * this.TILE_SIZE;

    // 2. Kosten checken
    if (this.gold < this.selectedTowerType.cost) {
      console.log('Nicht genug Gold!');
      return;
    }

    const absoluteY = gridY + this.HUD_HEIGHT;

    // 3. Pfad-Kollisions-Check (keine Türme auf Pfad)
    if (this.isPositionOnPath(gridX, absoluteY)) {
      console.log('Kann nicht auf den Pfad setzen!');
      return;
    }

    // 4. Türm-Kollisions-Check (keine Türme übereinander)
    if (this.isTowerAtPosition(gridX, absoluteY)) {
      console.log('Da steht schon ein Turm!');
      return;
    }

    // 5. Turm platzieren (mit Offset speichern)
    const tower = new Tower(this, gridX, absoluteY, this.selectedTowerType);
    this.towers.push(tower);

    // 6. Gold abziehen
    this.gold -= this.selectedTowerType.cost;
    this.totalGoldSpent += this.selectedTowerType.cost;

    const towerKey = this.towerTypeKeys[this.selectedTowerIndex];
    this.towerPlacementStats[towerKey] = (this.towerPlacementStats[towerKey] || 0) + 1;
    this.recordTowerPlacement(tower, towerKey, gridX, gridY, absoluteY);

    console.log(`Turm platziert bei Grid (${gridX}, ${gridY})! Gold übrig: ${this.gold}`);
  }

  ensureLevelUsageBucket(levelKey) {
    if (!this.towerUsageByLevel[levelKey]) {
      this.towerUsageByLevel[levelKey] = {
        levelKey,
        levelNumber: this.currentLevel?.levelNumber || null,
        levelName: this.currentLevel?.displayName || levelKey,
        placements: []
      };
      return;
    }

    this.towerUsageByLevel[levelKey].levelNumber = this.currentLevel?.levelNumber || this.towerUsageByLevel[levelKey].levelNumber || null;
    this.towerUsageByLevel[levelKey].levelName = this.currentLevel?.displayName || this.towerUsageByLevel[levelKey].levelName || levelKey;
    if (!Array.isArray(this.towerUsageByLevel[levelKey].placements)) {
      this.towerUsageByLevel[levelKey].placements = [];
    }
  }

  recordTowerPlacement(tower, towerTypeKey, screenX, fieldY, screenY) {
    this.ensureLevelUsageBucket(this.selectedLevelKey);
    const levelUsage = this.towerUsageByLevel[this.selectedLevelKey];

    const placementId = this.nextTowerPlacementId;
    this.nextTowerPlacementId += 1;

    const entry = {
      placementId,
      towerTypeKey,
      towerName: this.selectedTowerType.name,
      gridX: Math.round(screenX / this.TILE_SIZE),
      gridY: Math.round(fieldY / this.TILE_SIZE),
      screenX,
      screenY,
      placedAtWave: this.currentWaveIndex + 1,
      placedAtMs: this.time.now,
      sold: false,
      soldAtWave: null,
      soldAtMs: null
    };

    levelUsage.placements.push(entry);
    tower.analyticsPlacementId = placementId;
    tower.analyticsLevelKey = this.selectedLevelKey;
  }

  markTowerSoldInAnalytics(tower) {
    const levelKey = tower.analyticsLevelKey || this.selectedLevelKey;
    const placementId = tower.analyticsPlacementId;
    const levelUsage = this.towerUsageByLevel[levelKey];

    if (!levelUsage || !Array.isArray(levelUsage.placements) || !placementId) {
      return;
    }

    const match = levelUsage.placements.find((item) => item.placementId === placementId);
    if (!match || match.sold) {
      return;
    }

    match.sold = true;
    match.soldAtWave = this.currentWaveIndex + 1;
    match.soldAtMs = this.time.now;
  }

  buildRunSubmissionPayload(playerName) {
    return {
      playerName,
      result: this.gameState,
      scoreGold: this.getTotalScoreGold(),
      selectedLevelKey: this.selectedLevelKey,
      selectedLevelNumber: this.currentLevel?.levelNumber || null,
      waveReached: this.currentWaveIndex + 1,
      totalWaves: this.currentLevel?.totalWaves || null,
      totalKills: this.totalKills,
      totalLeaks: this.totalLeaks,
      totalGoldEarned: this.totalGoldEarned,
      totalGoldSpent: this.totalGoldSpent,
      totalGoldRemaining: this.gold,
      livesRemaining: this.lives,
      clientVersion: this.clientVersion,
      towerUsageByLevel: this.towerUsageByLevel
    };
  }

  setScoreSubmitStatus(message, color = '#cccccc') {
    if (!this.scoreSubmitStatusText) {
      return;
    }
    this.scoreSubmitStatusText.setText(message);
    this.scoreSubmitStatusText.setStyle({ fill: color });
  }

  _promptPlayerName(defaultValue = '') {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;';

      const box = document.createElement('div');
      box.style.cssText = 'background:#1a1a2e;border:2px solid #4488ff;border-radius:8px;padding:24px;display:flex;flex-direction:column;gap:12px;min-width:280px;font-family:sans-serif;';

      const label = document.createElement('div');
      label.textContent = 'Dein Name für die Highscore (3–10 Zeichen):';
      label.style.cssText = 'color:#ccccff;font-size:14px;';

      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 10;
      input.value = defaultValue.slice(0, 10);
      input.style.cssText = 'background:#0d0d1a;color:#ffffff;border:1px solid #4488ff;border-radius:4px;padding:8px;font-size:16px;outline:none;';

      const counter = document.createElement('div');
      counter.textContent = `${input.value.length}/10`;
      counter.style.cssText = 'color:#888888;font-size:12px;text-align:right;';

      input.addEventListener('input', () => {
        counter.textContent = `${input.value.length}/10`;
      });

      const buttons = document.createElement('div');
      buttons.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;';

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Abbrechen';
      cancelBtn.style.cssText = 'background:#333;color:#aaa;border:1px solid #555;border-radius:4px;padding:8px 14px;cursor:pointer;';

      const submitBtn = document.createElement('button');
      submitBtn.textContent = 'Speichern';
      submitBtn.style.cssText = 'background:#224488;color:#fff;border:1px solid #4488ff;border-radius:4px;padding:8px 14px;cursor:pointer;';

      const cleanup = (value) => {
        document.body.removeChild(overlay);
        resolve(value);
      };

      cancelBtn.addEventListener('click', () => cleanup(null));
      submitBtn.addEventListener('click', () => cleanup(input.value));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') cleanup(input.value);
        if (e.key === 'Escape') cleanup(null);
      });

      buttons.appendChild(cancelBtn);
      buttons.appendChild(submitBtn);
      box.appendChild(label);
      box.appendChild(input);
      box.appendChild(counter);
      box.appendChild(buttons);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
      input.focus();
      input.select();
    });
  }

  setTopScoresStatus(message, color = '#aaaaaa') {
    if (!this.topScoresText) {
      return;
    }
    this.topScoresText.setText(message);
    this.topScoresText.setStyle({ fill: color });
  }

  formatTopScoreLine(item, index) {
    const rank = String(index + 1).padStart(2, ' ');
    const name = String(item.player_name || 'Unknown').slice(0, 12).padEnd(12, ' ');
    const score = String(item.score_gold ?? 0).padStart(5, ' ');
    const level = item.selected_level_number ? `L${item.selected_level_number}` : 'L?';
    return `${rank}. ${name} ${score}g ${level}`;
  }

  async fetchAndShowTopScores() {
    if (!this.topScoresText) {
      return;
    }

    this.setTopScoresStatus('Top 10 werden geladen ...', '#ffff88');

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/scores?limit=10`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Top 10 konnten nicht geladen werden.');
      }

      const items = Array.isArray(data.items) ? data.items : [];
      if (!items.length) {
        this.setTopScoresStatus('Noch keine Einträge in der Top 10.', '#cccccc');
        return;
      }

      const lines = items.map((item, index) => this.formatTopScoreLine(item, index));
      this.setTopScoresStatus(lines.join('\n'), '#dde6ff');
    } catch (error) {
      console.error('Top10 fetch failed:', error);
      this.setTopScoresStatus(`Fehler: ${error.message}`, '#ff6666');
    }
  }

  async requestAndSubmitRun() {
    if (this.isSubmittingRun) {
      return;
    }

    if (this.hasSubmittedRun) {
      this.setScoreSubmitStatus('Score bereits gespeichert.', '#66ff66');
      return;
    }

    const previousName = localStorage.getItem('browsergame_player_name') || '';
    const rawName = await this._promptPlayerName(previousName);
    if (rawName === null) {
      this.setScoreSubmitStatus('Speichern abgebrochen.', '#aaaaaa');
      return;
    }

    const playerName = rawName.trim().replace(/\s+/g, ' ');
    if (playerName.length < 3 || playerName.length > 10) {
      this.setScoreSubmitStatus('Name ungültig (3-10 Zeichen).', '#ff6666');
      return;
    }

    localStorage.setItem('browsergame_player_name', playerName);
    this.isSubmittingRun = true;
    this.setScoreSubmitStatus('Speichere Run und Nutzungsstatistik ...', '#ffff88');

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.buildRunSubmissionPayload(playerName))
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data.error || 'Score konnte nicht gespeichert werden.';
        throw new Error(message);
      }

      this.hasSubmittedRun = true;
      if (this.scoreSubmitButton) {
        this.scoreSubmitButton.disableInteractive();
        this.scoreSubmitButton.setStyle({ fill: '#88ff88', backgroundColor: '#224422' });
      }
      this.setScoreSubmitStatus(`Gespeichert! Run #${data.run?.id || '?'}`, '#66ff66');
      await this.fetchAndShowTopScores();
    } catch (error) {
      console.error('Score submit failed:', error);
      this.setScoreSubmitStatus(`Fehler: ${error.message}`, '#ff6666');
    } finally {
      this.isSubmittingRun = false;
    }
  }

  logRunSummary() {
    if (this.runSummaryLogged) {
      return;
    }
    this.runSummaryLogged = true;

    const summary = {
      result: this.gameState,
      level: `${this.currentLevel.displayName || this.selectedLevelKey} (${this.selectedLevelKey})`,
      waveReached: `${this.currentWaveIndex + 1}/${this.currentLevel.totalWaves}`,
      kills: this.totalKills,
      leaks: this.totalLeaks,
      goldEarned: this.totalGoldEarned,
      goldSpent: this.totalGoldSpent,
      goldRemaining: this.gold,
      totalScoreGold: this.getTotalScoreGold(),
      towersPlaced: this.towers.length,
      towerUsage: this.towerPlacementStats
    };

    console.log('=== RUN SUMMARY ===');
    console.log(summary);
    console.table(this.towerPlacementStats);
  }

  buildTowerUsageLines() {
    const entries = Object.entries(this.towerPlacementStats)
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    if (entries.length === 0) {
      return ['Nutzung: keine Türme platziert'];
    }

    const parts = entries.map(([towerKey, count]) => {
      const towerName = TOWER_TYPES[towerKey]?.name || towerKey;
      return `${towerName} x${count}`;
    });

    const lines = [];
    let currentLine = 'Nutzung: ';

    for (const part of parts) {
      const candidate = currentLine === 'Nutzung: ' ? `${currentLine}${part}` : `${currentLine}, ${part}`;
      if (candidate.length > 52 && currentLine !== 'Nutzung: ') {
        lines.push(currentLine);
        currentLine = part;
      } else {
        currentLine = candidate;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.slice(0, 2);
  }

  isPositionOnPath(x, y) {
    // y ist absolute Screen-Koordinate, daher erst HUD-Offset entfernen
    const fieldY = y - this.HUD_HEIGHT;

    // Turm ist 40x40, zentriert auf (x, y), also Bounding-Box:
    const TOWER_WIDTH = 40;
    const TOWER_HEIGHT = 40;
    const towerLeft = x - TOWER_WIDTH / 2;
    const towerRight = x + TOWER_WIDTH / 2;
    const towerTop = y - TOWER_HEIGHT / 2;
    const towerBottom = y + TOWER_HEIGHT / 2;

    // Prüfe AABB-Überlappung gegen alle Pfad-Tiles
    for (const pathTile of this.gridPath) {
      // Pfad-Tile Koordinaten in Pixel
      const pathLeft = pathTile.gridX * this.TILE_SIZE;
      const pathRight = (pathTile.gridX + 1) * this.TILE_SIZE;
      const pathTop = pathTile.gridY * this.TILE_SIZE + this.HUD_HEIGHT;
      const pathBottom = (pathTile.gridY + 1) * this.TILE_SIZE + this.HUD_HEIGHT;

      // AABB-Überlappung checken
      if (towerLeft < pathRight && towerRight > pathLeft &&
          towerTop < pathBottom && towerBottom > pathTop) {
        return true;
      }
    }
    return false;
  }

  getTowerAtPosition(x, y) {
    // Neue Turm-Bounding-Box
    const TOWER_WIDTH = 40;
    const TOWER_HEIGHT = 40;
    const selectLeft = x - TOWER_WIDTH / 2;
    const selectRight = x + TOWER_WIDTH / 2;
    const selectTop = y - TOWER_HEIGHT / 2;
    const selectBottom = y + TOWER_HEIGHT / 2;

    // Gegen alle bestehenden Türme prüfen
    for (const tower of this.towers) {
      const existingTowerLeft = tower.x - TOWER_WIDTH / 2;
      const existingTowerRight = tower.x + TOWER_WIDTH / 2;
      const existingTowerTop = tower.y - TOWER_HEIGHT / 2;
      const existingTowerBottom = tower.y + TOWER_HEIGHT / 2;

      // AABB-Überlappung
      if (selectLeft < existingTowerRight && selectRight > existingTowerLeft &&
          selectTop < existingTowerBottom && selectBottom > existingTowerTop) {
        return tower;
      }
    }
    return null;
  }

  isTowerAtPosition(x, y) {
    return this.getTowerAtPosition(x, y) !== null;
  }

  spawnEnemy() {
    const enemy = new Enemy(this, this.currentPath, {
      speed: 80,
      type: 'normal',
      maxHealth: 50
    });
    this.enemies.push(enemy);
  }

  startWave() {
    this.gameState = 'playing';
    this.hasStartedFirstWave = true;
    const waveConfig = this.currentLevel.waves[this.currentWaveIndex];
    
    console.log(`🌊 Welle ${this.currentWaveIndex + 1} startet:`, waveConfig);
    console.log(`   (Index: ${this.currentWaveIndex}, Level: ${this.currentLevel.levelNumber}, Total Waves: ${this.currentLevel.totalWaves})`);
    console.log(`   (Aktuelle Gegner im Spiel: ${this.enemies.length})`);

    // **WICHTIG**: Gegner-Leak prüfen - sollte leer sein
    if (this.enemies.length > 0) {
      console.warn(`⚠️ GEGNER-LEAK! Es sind noch ${this.enemies.length} alte Gegner da!`);
    }

    // **ERROR CHECK**: Wave-Config leer?
    if (!waveConfig) {
      console.error(`❌ FEHLER! WaveConfig undefined bei Index ${this.currentWaveIndex}!`);
      return;
    }

    // Wave-String parsen (n=normal, s=schnell, a=gepanzert, .=extra Pause)
    const ENEMY_TYPE_MAP = { n: 'normal', s: 'fast', a: 'armored' };
    const waveString = typeof waveConfig === 'string' ? waveConfig.replace(/[{}]/g, '') : '';
    const spawnSequence = waveString.split('');
    const totalInWave = spawnSequence.filter(c => ENEMY_TYPE_MAP[c]).length;

    if (totalInWave === 0) {
      console.error(`❌ FEHLER! Welle ${this.currentWaveIndex + 1} hat 0 Gegner! (Config: '${waveConfig}')`);
      return;
    }

    console.log(`   → Wave-String: '${waveString}' (${totalInWave} Gegner)`);

    // Spawn-Flag zurücksetzen
    this.waveSpawnComplete = false;
    this.enemiesInCurrentWave = [];

    // Gegner rekursiv mit variablen Delays spawnen
    const processNext = (index) => {
      if (index >= spawnSequence.length) {
        console.log(`   ✅ Alle ${totalInWave} Gegner gespawned`);
        this.waveSpawnComplete = true;
        this.waveSpawnTimer = null;
        return;
      }

      const char = spawnSequence[index];

      if (char === '.') {
        // Extra-Pause: kein Spawn, nur warten
        this.waveSpawnTimer = this.time.delayedCall(
          WAVE_CONFIG.EXTRA_PAUSE_MS,
          () => processNext(index + 1)
        );
      } else if (ENEMY_TYPE_MAP[char]) {
        // Gegner nach Basis-Interval spawnen
        this.waveSpawnTimer = this.time.delayedCall(
          WAVE_CONFIG.SPAWN_INTERVAL,
          () => {
            const enemy = new Enemy(this, this.currentPath, { type: ENEMY_TYPE_MAP[char] });
            this.enemies.push(enemy);
            this.enemiesInCurrentWave.push(enemy);
            processNext(index + 1);
          }
        );
      } else {
        // Unbekanntes Zeichen überspringen
        processNext(index + 1);
      }
    };

    processNext(0);

    this.waveTimerText.setText('Welle läuft...');
  }

  startNextWave() {
    this.currentWaveIndex++;
    if (this.currentWaveIndex >= this.currentLevel.totalWaves) {
      this.gameState = 'won';
      return;
    }
    this.startWave();
  }

  showGameOverScreen() {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    // Dunkles Overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, this.scale.width, this.scale.height);

    // Panel
    const panel = this.add.graphics();
    panel.fillStyle(0x330000, 1);
    panel.lineStyle(3, 0xff2222, 1);
    panel.fillRect(cx - 220, cy - 165, 440, 330);
    panel.strokeRect(cx - 220, cy - 165, 440, 330);

    this.add.text(cx, cy - 70, 'GAME OVER', {
      fontSize: '36px',
      fill: '#ff2222',
      fontFamily: 'Courier',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(cx, cy - 20, `Erreicht: Welle ${this.currentWaveIndex + 1}/${this.currentLevel.totalWaves}`, {
      fontSize: '16px',
      fill: '#ffaaaa',
      fontFamily: 'Courier'
    }).setOrigin(0.5);

    this.add.text(cx, cy + 15, `Gold übrig: ${this.gold}`, {
      fontSize: '16px',
      fill: '#ffff00',
      fontFamily: 'Courier'
    }).setOrigin(0.5);

    this.add.text(cx, cy + 32, `Gesamt-Score: ${this.getTotalScoreGold()}g`, {
      fontSize: '14px',
      fill: '#ffd966',
      fontFamily: 'Courier',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(cx, cy + 50, `Kills: ${this.totalKills} | Leaks: ${this.totalLeaks} | Ausgaben: ${this.totalGoldSpent}g`, {
      fontSize: '13px',
      fill: '#ffccaa',
      fontFamily: 'Courier'
    }).setOrigin(0.5);

    const usageLines = this.buildTowerUsageLines();
    this.add.text(cx, cy + 72, usageLines[0], {
      fontSize: '12px',
      fill: '#ffd9c8',
      fontFamily: 'Courier'
    }).setOrigin(0.5);

    if (usageLines[1]) {
      this.add.text(cx, cy + 90, usageLines[1], {
        fontSize: '12px',
        fill: '#ffd9c8',
        fontFamily: 'Courier'
      }).setOrigin(0.5);
    }

    this.scoreSubmitButton = this.add.text(cx, cy + 116, '[ SCORE SPEICHERN ]', {
      fontSize: '16px',
      fill: '#ffffff',
      fontFamily: 'Courier',
      fontStyle: 'bold',
      backgroundColor: '#444400',
      padding: { x: 12, y: 7 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.scoreSubmitStatusText = this.add.text(cx, cy + 138, 'Noch nicht gespeichert', {
      fontSize: '12px',
      fill: '#dddddd',
      fontFamily: 'Courier'
    }).setOrigin(0.5);

    this.scoreSubmitButton.on('pointerover', () => this.scoreSubmitButton.setStyle({ fill: '#ffff00' }));
    this.scoreSubmitButton.on('pointerout', () => this.scoreSubmitButton.setStyle({ fill: '#ffffff' }));
    this.scoreSubmitButton.on('pointerdown', () => {
      this.requestAndSubmitRun();
    });

    const topPanel = this.add.graphics();
    topPanel.fillStyle(0x101722, 0.95);
    topPanel.lineStyle(2, 0x5577aa, 1);
    topPanel.fillRect(cx + 140, cy - 170, 300, 340);
    topPanel.strokeRect(cx + 140, cy - 170, 300, 340);

    this.topScoresTitleText = this.add.text(cx + 290, cy - 152, 'TOP 10 (nach Upload)', {
      fontSize: '13px',
      fill: '#a8c7ff',
      fontFamily: 'Courier',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.topScoresText = this.add.text(cx + 154, cy - 130, 'Score speichern, dann wird die Top 10 geladen.', {
      fontSize: '12px',
      fill: '#99aabb',
      fontFamily: 'Courier',
      lineSpacing: 3
    }).setOrigin(0, 0);

    // Neustart-Button
    const btn = this.add.text(cx, cy + 160, '[ NOCHMAL ]', {
      fontSize: '20px',
      fill: '#ffffff',
      fontFamily: 'Courier',
      fontStyle: 'bold',
      backgroundColor: '#aa0000',
      padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ fill: '#ffff00' }));
    btn.on('pointerout', () => btn.setStyle({ fill: '#ffffff' }));
    btn.on('pointerdown', () => this.scene.restart());
  }

  showWinScreen() {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    // Dunkles Overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, this.scale.width, this.scale.height);

    // Panel
    const panel = this.add.graphics();
    panel.fillStyle(0x003300, 1);
    panel.lineStyle(3, 0x22ff22, 1);
    panel.fillRect(cx - 220, cy - 165, 440, 330);
    panel.strokeRect(cx - 220, cy - 165, 440, 330);

    this.add.text(cx, cy - 70, 'GEWONNEN! 🎉', {
      fontSize: '32px',
      fill: '#22ff22',
      fontFamily: 'Courier',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(cx, cy - 20, 'Alle Wellen besiegt!', {
      fontSize: '16px',
      fill: '#aaffaa',
      fontFamily: 'Courier'
    }).setOrigin(0.5);

    this.add.text(cx, cy + 15, `Restgold: ${this.gold} (dein Score!)`, {
      fontSize: '16px',
      fill: '#ffff00',
      fontFamily: 'Courier'
    }).setOrigin(0.5);

    this.add.text(cx, cy + 32, `Gesamt-Score: ${this.getTotalScoreGold()}g`, {
      fontSize: '14px',
      fill: '#ffff66',
      fontFamily: 'Courier',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(cx, cy + 50, `Kills: ${this.totalKills} | Leaks: ${this.totalLeaks} | Ausgaben: ${this.totalGoldSpent}g`, {
      fontSize: '13px',
      fill: '#ccffcc',
      fontFamily: 'Courier'
    }).setOrigin(0.5);

    const usageLines = this.buildTowerUsageLines();
    this.add.text(cx, cy + 72, usageLines[0], {
      fontSize: '12px',
      fill: '#d8ffd8',
      fontFamily: 'Courier'
    }).setOrigin(0.5);

    if (usageLines[1]) {
      this.add.text(cx, cy + 90, usageLines[1], {
        fontSize: '12px',
        fill: '#d8ffd8',
        fontFamily: 'Courier'
      }).setOrigin(0.5);
    }

    this.scoreSubmitButton = this.add.text(cx, cy + 116, '[ SCORE SPEICHERN ]', {
      fontSize: '16px',
      fill: '#ffffff',
      fontFamily: 'Courier',
      fontStyle: 'bold',
      backgroundColor: '#444400',
      padding: { x: 12, y: 7 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.scoreSubmitStatusText = this.add.text(cx, cy + 138, 'Noch nicht gespeichert', {
      fontSize: '12px',
      fill: '#dddddd',
      fontFamily: 'Courier'
    }).setOrigin(0.5);

    this.scoreSubmitButton.on('pointerover', () => this.scoreSubmitButton.setStyle({ fill: '#ffff00' }));
    this.scoreSubmitButton.on('pointerout', () => this.scoreSubmitButton.setStyle({ fill: '#ffffff' }));
    this.scoreSubmitButton.on('pointerdown', () => {
      this.requestAndSubmitRun();
    });

    const topPanel = this.add.graphics();
    topPanel.fillStyle(0x101722, 0.95);
    topPanel.lineStyle(2, 0x5577aa, 1);
    topPanel.fillRect(cx + 140, cy - 170, 300, 340);
    topPanel.strokeRect(cx + 140, cy - 170, 300, 340);

    this.topScoresTitleText = this.add.text(cx + 290, cy - 152, 'TOP 10 (nach Upload)', {
      fontSize: '13px',
      fill: '#a8c7ff',
      fontFamily: 'Courier',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.topScoresText = this.add.text(cx + 154, cy - 130, 'Score speichern, dann wird die Top 10 geladen.', {
      fontSize: '12px',
      fill: '#99aabb',
      fontFamily: 'Courier',
      lineSpacing: 3
    }).setOrigin(0, 0);

    // Neustart-Button
    const btn = this.add.text(cx, cy + 160, '[ NOCHMAL ]', {
      fontSize: '20px',
      fill: '#ffffff',
      fontFamily: 'Courier',
      fontStyle: 'bold',
      backgroundColor: '#007700',
      padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ fill: '#ffff00' }));
    btn.on('pointerout', () => btn.setStyle({ fill: '#ffffff' }));
    btn.on('pointerdown', () => this.scene.restart());
  }

}
