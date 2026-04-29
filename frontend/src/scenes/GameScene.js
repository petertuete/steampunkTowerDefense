import Phaser from 'phaser';
import { Enemy } from '../entities/Enemy.js';
import { Tower } from '../entities/Tower.js';
import { PATHS, getPixelPath } from '../config/paths.js';
import { TOWER_TYPES, STARTING_GOLD } from '../config/towers.js';
import { LEVELS, WAVE_CONFIG, DEFAULT_LEVEL } from '../config/waves.js';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const CLIENT_VERSION = import.meta.env.VITE_CLIENT_VERSION || 'dev-local';

const SCORE_RULES = {
  KILL_POINTS: 10,
  NO_LEAK_WAVE_POINTS: 50,
  LEVEL_CLEAR_BASE_POINTS: 500,
  POINTS_PER_LIFE: 20,
  PERFECTION_MULTIPLIER: 1.5
};

const UI_TITLE_FONT = 'Georgia';
const UI_BODY_FONT = 'Courier';
const UI_BRASS = 0xd0ac74;
const UI_BRASS_SOFT = 0xf3ddb3;
const UI_PANEL_BRASS = 0x2a1e14;
const UI_GLASS = 0x101721;
const UI_OVERLAY = 0x000000;

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
    this.load.image('flamethrower-intro', '/flammenwerfer_intro.png');
    this.load.image('tesla-intro', '/teslaturm_intro.png');
    this.load.audio('gameplay-music', '/victoriana-loop.mp3');
    this.debugLog('GameScene preload');
  }

  init(data) {
    this.restartData = data || {};
    this.debugMode = Boolean(this.restartData.debugMode || this.restartData.carryState?.debugMode);
  }

  debugLog(...args) {
    if (this.debugMode) {
      console.log(...args);
    }
  }

  debugWarn(...args) {
    if (this.debugMode) {
      console.warn(...args);
    }
  }

  create() {
    // Spielzustand zurücksetzen (läuft bei scene.restart() neu)
    const carried = this.restartData?.campaignContinue ? this.restartData.carryState || {} : null;

    // Musik starten (nur einmal beim ersten Load, bei Restart fortsetzen)
    if (!this.sound.get('gameplay-music')) {
      this.sound.play('gameplay-music', { loop: true, volume: 0.25 });
    }

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
    this.finalTotalScoreGold = null;
    this.accumulatedScorePoints = carried ? carried.accumulatedScorePoints || 0 : 0;
    this.levelScorePoints = 0;
    this.finalTotalScorePoints = null;
    this.scoreBreakdown = carried ? {
      killPoints: carried.scoreBreakdown?.killPoints || 0,
      noLeakWavePoints: carried.scoreBreakdown?.noLeakWavePoints || 0,
      levelClearPoints: carried.scoreBreakdown?.levelClearPoints || 0,
      goldPoints: carried.scoreBreakdown?.goldPoints || 0
    } : {
      killPoints: 0,
      noLeakWavePoints: 0,
      levelClearPoints: 0,
      goldPoints: 0
    };
    this.totalNoLeakWaves = carried ? carried.totalNoLeakWaves || 0 : 0;
    this.waveLeakCountAtStart = this.totalLeaks;
    this.runHasSoldTower = carried ? Boolean(carried.runHasSoldTower) : false;
    this.hasSubmittedRun = false;
    this.isSubmittingRun = false;
    this.scoreSubmitStatusText = null;
    this.scoreSubmitButton = null;
    this.topScoresTitleText = null;
    this.topScoresText = null;
    this.levelSplashVisible = false;
    this.levelSplashElements = [];
    this.consumeNextPointerDown = false;
    this.clientVersion = CLIENT_VERSION;
    const allowedTowers = this.currentLevel.allowedTowers;
    this.towerSelectionOrder = ['steamCannon', 'generator', 'flamethrower', 'highPressure', 'Tesla'];
    const allTowerKeys = Object.keys(TOWER_TYPES);
    this.towerTypeKeys = this.towerSelectionOrder.filter((k) => {
      if (!allTowerKeys.includes(k)) return false;
      return !allowedTowers || allowedTowers.includes(k);
    });
    this.selectedTowerIndex = this.towerTypeKeys.indexOf('steamCannon');
    if (this.selectedTowerIndex < 0) {
      this.selectedTowerIndex = 0;
    }
    this.selectedTowerType = TOWER_TYPES[this.towerTypeKeys[this.selectedTowerIndex]];
    
    // Wave-Preview Tracking
    this.waveSpawnSequence = null;
    this.waveSpawnIndex = 0;
    this.defeatedInWaveMap = new Map(); // Map von Enemy-ID zu true wenn besiegt
    this.wavePreviewGraphics = null;
    
    // Manuales Wave-Spawn-Timing (mit deltaTime-Tracking, skaliert mit Speed)
    this.waveSpawning = false;
    this.waveSpawnSequenceIndex = 0;  // Wo wir im spawnSequence-Array sind
    this.remainingSpawnDelay = 0;  // Verbleibende Zeit bis zum nächsten Spawn (wird mit Speed skaliert)

    // Zeitachsen seit Levelbeginn
    this.levelStartRealMs = performance.now();
    this.levelElapsedGameMs = 0;

    // Zeitachsen seit Wave-Beginn (werden in startWave gesetzt)
    this.waveStartRealMs = this.levelStartRealMs;
    this.waveStartGameMs = 0;
    
    this.ensureLevelUsageBucket(this.selectedLevelKey);

    // Basis-Konfiguration
    const GRID_WIDTH = 32;  // 1280 / 40
    const GRID_HEIGHT = 24; // 960 / 40
    const FIELD_TOP = this.HUD_HEIGHT; // Spielfeld fängt nach HUD an
    const levelPathKey = `level${this.currentLevel.levelNumber}`;
    const gridPath = PATHS[levelPathKey] || PATHS.level1;
    const pathTileSet = new Set(gridPath.map((node) => `${node.gridX},${node.gridY}`));
    const gridTextureKey = `grid-${levelPathKey}`;

    // Bei Scene-Restarts alte Texture entfernen, damit Marker wirklich neu berechnet werden.
    if (this.textures.exists(gridTextureKey)) {
      this.textures.remove(gridTextureKey);
    }

    // Grid-Marker zeichnen (X-Positionen statt Linien)
    const gridGraphics = this.make.graphics({ x: 0, y: FIELD_TOP, add: false });
    gridGraphics.lineStyle(1, 0x666666, 0.7);

    // X-Marker auf echten Platzierungszentren (gleiches Grid wie Tower-Snapping)
    // Ausblenden nur dort, wo ein 40x40 Turm mit Pfad-Tiles überlappen würde.
    const X_SIZE = 6;
    const isCenterBlockedByPath = (gx, gy) => {
      return (
        pathTileSet.has(`${gx - 1},${gy - 1}`) ||
        pathTileSet.has(`${gx},${gy - 1}`) ||
        pathTileSet.has(`${gx - 1},${gy}`) ||
        pathTileSet.has(`${gx},${gy}`)
      );
    };

    for (let gx = 0; gx <= GRID_WIDTH; gx += 1) {
      for (let gy = 0; gy <= GRID_HEIGHT; gy += 1) {
        if (isCenterBlockedByPath(gx, gy)) {
          continue;
        }

        const x = gx * this.TILE_SIZE;
        const y = gy * this.TILE_SIZE;

        // Kleines X zeichnen
        gridGraphics.beginPath();
        gridGraphics.moveTo(x - X_SIZE / 2, y - X_SIZE / 2);
        gridGraphics.lineTo(x + X_SIZE / 2, y + X_SIZE / 2);
        gridGraphics.strokePath();
        
        gridGraphics.beginPath();
        gridGraphics.moveTo(x + X_SIZE / 2, y - X_SIZE / 2);
        gridGraphics.lineTo(x - X_SIZE / 2, y + X_SIZE / 2);
        gridGraphics.strokePath();
      }
    }

    gridGraphics.generateTexture(gridTextureKey, this.scale.width, this.scale.height - FIELD_TOP);
    gridGraphics.destroy();

    // Grid als Bild anzeigen (mit Offset)
    this.add.image(0, FIELD_TOP, gridTextureKey).setOrigin(0, 0);

    // Hoverfield-Highlight für Zielposition
    this.hoverFieldGraphics = this.make.graphics({ x: 0, y: FIELD_TOP, add: true });
    this.hoverFieldGraphics.setDepth(99);

    // Pfad visualisieren (als Felder, nicht als Linien, mit Offset)
    const pathGraphics = this.make.graphics({ x: 0, y: FIELD_TOP, add: true });
    
    // Alle Pfad-Felder zeichnen mit Doppelkontrast (dunkler Rand + hellerer Kern)
    const outerColor = 0x2a2f3a;
    const outerAlpha = 0.9;
    const innerColor = 0x5b6474;
    const innerAlpha = 0.75;
    const inset = 4;

    for (let i = 0; i < gridPath.length; i += 1) {
      const gridCoord = gridPath[i];
      const px = gridCoord.gridX * this.TILE_SIZE;
      const py = gridCoord.gridY * this.TILE_SIZE;
      const prev = i > 0 ? gridPath[i - 1] : null;
      const next = i < gridPath.length - 1 ? gridPath[i + 1] : null;

      // Innenkanten zwischen direkt verbundenen Pfad-Tiles entfernen
      let leftInset = inset;
      let rightInset = inset;
      let topInset = inset;
      let bottomInset = inset;

      const neighbors = [prev, next];
      for (const neighbor of neighbors) {
        if (!neighbor) continue;
        const dx = neighbor.gridX - gridCoord.gridX;
        const dy = neighbor.gridY - gridCoord.gridY;
        if (dx === -1 && dy === 0) leftInset = 0;
        if (dx === 1 && dy === 0) rightInset = 0;
        if (dx === 0 && dy === -1) topInset = 0;
        if (dx === 0 && dy === 1) bottomInset = 0;
      }

      pathGraphics.fillStyle(outerColor, outerAlpha);
      pathGraphics.fillRect(px, py, this.TILE_SIZE, this.TILE_SIZE);

      pathGraphics.fillStyle(innerColor, innerAlpha);
      pathGraphics.fillRect(
        px + leftInset,
        py + topInset,
        this.TILE_SIZE - leftInset - rightInset,
        this.TILE_SIZE - topInset - bottomInset
      );
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
    hudBackground.fillStyle(UI_PANEL_BRASS, 0.94);
    hudBackground.fillRect(0, 0, this.scale.width, this.HUD_HEIGHT);
    hudBackground.lineStyle(2, UI_BRASS, 0.55);
    hudBackground.beginPath();
    hudBackground.moveTo(0, this.HUD_HEIGHT - 1);
    hudBackground.lineTo(this.scale.width, this.HUD_HEIGHT - 1);
    hudBackground.strokePath();
    hudBackground.fillStyle(UI_GLASS, 0.36);
    hudBackground.fillRect(8, 8, this.scale.width - 16, this.HUD_HEIGHT - 16);
    hudBackground.lineStyle(1, UI_BRASS_SOFT, 0.14);
    hudBackground.strokeRect(8, 8, this.scale.width - 16, this.HUD_HEIGHT - 16);

    // Wave-Preview Graphic (rechts neben Wellen-Info)
    this.wavePreviewGraphics = this.make.graphics({ x: 0, y: 0, add: true });
    this.wavePreviewGraphics.setDepth(100);

    this.infoText = this.add.text(10, 8, 'Gegner: 0', {
      fontSize: '12px',
      fill: '#d8cab6',
      fontFamily: UI_BODY_FONT
    });

    this.goldText = this.add.text(300, 8, `Gold: ${this.gold}`, {
      fontSize: '14px',
      fill: '#f3d289',
      fontFamily: UI_BODY_FONT,
      fontStyle: 'bold'
    });

    this.scoreText = this.add.text(300, 24, `Score: ${this.getTotalScorePoints()} pts`, {
      fontSize: '13px',
      fill: '#eed5a7',
      fontFamily: UI_BODY_FONT,
      fontStyle: 'bold'
    });

    this.towerText = this.add.text(10, 24, `Türme: 0 | ${this.selectedTowerType.name} (${this.selectedTowerType.cost}g)`, {
      fontSize: '12px',
      fill: '#e6d4c1',
      fontFamily: UI_BODY_FONT
    });

    this.towerSwitchFxText = this.add.text(10, 40, '', {
      fontSize: '11px',
      fill: '#f0e4cf',
      fontFamily: UI_BODY_FONT,
      fontStyle: 'bold'
    }).setAlpha(0);

    this.towerTypeButtons = [];
    this.hoveredTowerButtonKey = null;
    this.createTowerTypeButtons(760, 74);

    this.isSellMode = false;
    this.modeVisualSellRatio = 0;
    this.modeIndicatorTween = null;
    this.createModeToggleControl(320, 56);

    // Tower-Cursor-Preview Graphics
    this.towerPreviewGraphics = this.make.graphics({ x: 0, y: 0, add: true });
    this.towerPreviewGraphics.setDepth(999);

    this.add.text(10, 96, 'Click je nach Modus | 1/2/3/4 Turmwahl | T wechseln | Shift = Verkauf | S Speed', {
      fontSize: '11px',
      fill: '#b7ad9c',
      fontFamily: UI_BODY_FONT
    });

    // Leben-Anzeige
    this.livesText = this.add.text(600, 8, `Leben: ${this.lives}`, {
      fontSize: '14px',
      fill: '#df9b85',
      fontFamily: UI_BODY_FONT,
      fontStyle: 'bold'
    });

    // Wellen-Anzeige
    this.waveText = this.add.text(600, 24, `Welle: ${this.currentWaveIndex + 1}/${this.currentLevel.totalWaves}`, {
      fontSize: '14px',
      fill: '#d8cab6',
      fontFamily: UI_BODY_FONT,
      fontStyle: 'bold'
    });

    // Wellen-Timer
    this.waveTimerText = this.add.text(600, 40, 'Welle läuft...', {
      fontSize: '12px',
      fill: '#e7ddcc',
      fontFamily: UI_BODY_FONT
    });

    this.speedText = this.add.text(600, 56, 'Speed: 1x [S]', {
      fontSize: '12px',
      fill: '#d8cab6',
      fontFamily: UI_BODY_FONT,
      fontStyle: 'bold'
    });

    // Level-Auswahl (nur im Debug-Modus sichtbar)
    const levelLabelX = 760;
    this.levelButtons = {};
    if (this.debugMode) {
      this.add.text(levelLabelX, 10, 'Level:', {
        fontSize: '12px',
        fill: '#d8d2c6',
        fontFamily: UI_BODY_FONT
      });

      const availableLevelKeys = Object.keys(LEVELS).sort((a, b) => LEVELS[a].levelNumber - LEVELS[b].levelNumber);
      let nextLevelButtonX = levelLabelX + 52;
      availableLevelKeys.forEach((levelKey) => {
        const levelName = LEVELS[levelKey].displayName || `Level ${LEVELS[levelKey].levelNumber}`;
        const btn = this.add.text(nextLevelButtonX, 10, `[${levelName}]`, {
          fontSize: '12px',
          fill: '#b8ab93',
          fontFamily: UI_BODY_FONT,
          fontStyle: 'bold'
        }).setInteractive({ useHandCursor: true });

        btn.on('pointerdown', () => this.switchLevel(levelKey));
        this.levelButtons[levelKey] = btn;
        nextLevelButtonX += btn.width + 16;
      });
      this.updateLevelSelectorUI();
    }

    // Skip-Button (nur während wave-pause sichtbar)
    this.skipWaveBtn = this.add.text(950, 40, '[ ▶ JETZT STARTEN ] [Space]', {
      fontSize: '13px',
      fill: '#fff3d8',
      fontFamily: UI_BODY_FONT,
      fontStyle: 'bold',
      backgroundColor: '#5a3d24',
      padding: { x: 10, y: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setVisible(false);

    this.skipWaveBtn.on('pointerover', () => this.skipWaveBtn.setStyle({ fill: '#fff8e6', backgroundColor: '#6d4a2b' }));
    this.skipWaveBtn.on('pointerout', () => this.skipWaveBtn.setStyle({ fill: '#fff3d8', backgroundColor: '#5a3d24' }));
    this.skipWaveBtn.on('pointerdown', () => {
      if (!this.isPaused && this.gameState === 'wave-pause') {
        this.wavePauseTimer = 0;
      }
    });

    // Leertaste als Tastenkürzel für Skip
    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.levelSplashVisible) {
        this.closeLevelSplash();
      } else if (this.isPaused) {
        this.togglePause();
      } else if (this.gameState === 'wave-pause') {
        this.wavePauseTimer = 0;
      }
    });

    // Taste T: Turm-Typ zyklisch wechseln
    this.input.keyboard.on('keydown-T', () => {
      if (this.isPaused || this.levelSplashVisible) return;
      this.cycleTowerType();
    });

    this.input.keyboard.on('keydown-ONE', () => {
      if (this.isPaused || this.levelSplashVisible) return;
      this.selectTowerTypeByNumber(1);
    });
    this.input.keyboard.on('keydown-TWO', () => {
      if (this.isPaused || this.levelSplashVisible) return;
      this.selectTowerTypeByNumber(2);
    });
    this.input.keyboard.on('keydown-THREE', () => {
      if (this.isPaused || this.levelSplashVisible) return;
      this.selectTowerTypeByNumber(3);
    });
    this.input.keyboard.on('keydown-FOUR', () => {
      if (this.isPaused || this.levelSplashVisible) return;
      this.selectTowerTypeByNumber(4);
    });

    // Taste S: Spielgeschwindigkeit 1x/2x/3x
    this.input.keyboard.on('keydown-S', () => {
      if (this.isPaused || this.levelSplashVisible) return;
      this.toggleGameSpeed();
    });

    // Taste P: Pause/Resume
    this.isPaused = false;
    this.pauseOverlay = null;
    this.pauseTextTitle = null;
    this.pauseTextHint = null;
    this.input.keyboard.on('keydown-P', () => {
      if (this.levelSplashVisible) return;
      this.togglePause();
    });

    this.isShiftPressed = false;
    this.input.keyboard.on('keydown-SHIFT', () => {
      this.isShiftPressed = true;
      this.animateModeIndicator(120);
    });
    this.input.keyboard.on('keyup-SHIFT', () => {
      this.isShiftPressed = false;
      this.animateModeIndicator(120);
    });
    this.game.events.on('blur', () => {
      this.isShiftPressed = false;
      this.animateModeIndicator(120);
      if (this.game && this.game.canvas) {
        this.game.canvas.style.cursor = 'auto';
      }
    });

    // Click-Event für Turm-Platzierung oder -Verkauf
    this.input.on('pointerdown', (pointer) => {
      if (this.consumeNextPointerDown) {
        this.consumeNextPointerDown = false;
        return;
      }

      if (this.isPaused || this.levelSplashVisible) {
        return;
      }

      if (pointer.y < this.HUD_HEIGHT) {
        return;
      }

      // Native Event-Modifikator ist für Safari stabiler als globaler Keyboard-State
      const isShiftPressed = Boolean(pointer.event && pointer.event.shiftKey);
      const isSellAction = this.isSellMode || isShiftPressed;

      if (isSellAction) {
        // Verkaufsmodus oder Shift + Click: Turm verkaufen
        this.tryRemoveTower(pointer.x, pointer.y);
      } else {
        // Normal Click: Turm platzieren
        this.tryPlaceTower(pointer.x, pointer.y);
      }
    });

    // Mouse-Move: Cursor ändern bei Hover über Turm oder nicht genug Gold
    this.input.on('pointermove', (pointer) => {
      if (this.isPaused) {
        this.game.canvas.style.cursor = 'auto';
        return;
      }

      const fieldY = pointer.y - this.HUD_HEIGHT;
      if (fieldY >= 0) {
        const isShiftPressed = Boolean(this.isShiftPressed);
        const isSellModeActive = this.isSellMode || isShiftPressed;
        const tower = this.getTowerAtPosition(pointer.x, pointer.y);
        const hasEnoughGold = this.gold >= this.selectedTowerType.cost;

        if (isSellModeActive && tower) {
          this.game.canvas.style.cursor = 'not-allowed'; // Rotes Verbotszeichen simulieren
        } else if (isSellModeActive) {
          this.game.canvas.style.cursor = 'pointer'; // Verkaufsmodus aktiv
        } else if (!hasEnoughGold) {
          this.game.canvas.style.cursor = 'not-allowed'; // Nicht genug Gold
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

    // Splash für neue Turm-Freischaltungen (auch bei direkter Levelwahl)
    if (this.selectedLevelKey === 'level2') {
      this.showLevel2Splash();
    } else if (this.selectedLevelKey === 'level3') {
      this.showLevel3Splash();
    }
  }

  switchLevel(levelKey) {
    if (!LEVELS[levelKey] || this.selectedLevelKey === levelKey) {
      return;
    }

    this.selectedLevelKey = levelKey;
    this.scene.restart({ debugMode: this.debugMode });
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
    return this.finalTotalScoreGold ?? (this.accumulatedScoreGold + this.gold);
  }

  getTotalScorePoints() {
    return this.finalTotalScorePoints ?? (this.accumulatedScorePoints + this.levelScorePoints);
  }

  finalizeRunScorePoints({ includeCurrentGold = false, applyPerfection = false } = {}) {
    let totalPoints = this.accumulatedScorePoints + this.levelScorePoints;
    if (includeCurrentGold) {
      totalPoints += this.gold;
    }

    if (applyPerfection && !this.runHasSoldTower) {
      totalPoints = Math.round(totalPoints * SCORE_RULES.PERFECTION_MULTIPLIER);
    }

    this.finalTotalScorePoints = Math.max(0, Math.round(totalPoints));
    return this.finalTotalScorePoints;
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
      accumulatedScoreGold: this.accumulatedScoreGold + this.gold,
      accumulatedScorePoints: this.accumulatedScorePoints + this.levelScorePoints,
      scoreBreakdown: { ...this.scoreBreakdown },
      totalNoLeakWaves: this.totalNoLeakWaves,
      runHasSoldTower: this.runHasSoldTower,
      debugMode: this.debugMode
    };

    this.scene.restart({
      campaignContinue: true,
      debugMode: this.debugMode,
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
      button.setStyle({ fill: isActive ? '#f3d289' : '#b8ab93' });
    });
  }

  createModeToggleControl(x, y) {
    const WIDTH = 210;
    const HEIGHT = 28;
    const HALF = WIDTH / 2;
    const PADDING_X = 10;

    this.modeToggleBg = this.add.graphics();
    this.modeToggleBg.setDepth(120);

    this.modeBuildButton = this.add.rectangle(x - HALF / 2, y, HALF, HEIGHT, 0xffffff, 0.001)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(121);

    this.modeSellButton = this.add.rectangle(x + HALF / 2, y, HALF, HEIGHT, 0xffffff, 0.001)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(121);

    this.modeBuildLabel = this.add.text(x - HALF + PADDING_X, y, '+ Bauen', {
      fontSize: '12px',
      fill: '#e8dcc8',
      fontFamily: UI_BODY_FONT,
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(122);

    this.modeSellLabel = this.add.text(x + PADDING_X, y, '$ Verkaufen', {
      fontSize: '12px',
      fill: '#e8dcc8',
      fontFamily: UI_BODY_FONT,
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setDepth(122);

    this.modeBuildButton.on('pointerdown', () => {
      this.setSellMode(false);
    });
    this.modeSellButton.on('pointerdown', () => {
      this.setSellMode(true);
    });

    this.modeBuildButton.on('pointerover', () => this.updateModeToggleButton('build'));
    this.modeBuildButton.on('pointerout', () => this.updateModeToggleButton());
    this.modeSellButton.on('pointerover', () => this.updateModeToggleButton('sell'));
    this.modeSellButton.on('pointerout', () => this.updateModeToggleButton());

    this.updateModeToggleButton();
  }

  setSellMode(nextIsSellMode) {
    const changed = this.isSellMode !== nextIsSellMode;
    this.isSellMode = nextIsSellMode;
    if (changed) {
      this.animateModeIndicator(120);
    } else {
      this.updateModeToggleButton();
    }
  }

  animateModeIndicator(durationMs = 120) {
    const target = (this.isSellMode || this.isShiftPressed) ? 1 : 0;
    if (this.modeIndicatorTween) {
      this.modeIndicatorTween.stop();
      this.modeIndicatorTween = null;
    }
    this.modeIndicatorTween = this.tweens.add({
      targets: this,
      modeVisualSellRatio: target,
      duration: durationMs,
      ease: 'Sine.easeInOut',
      onUpdate: () => this.updateModeToggleButton(),
      onComplete: () => {
        this.modeIndicatorTween = null;
      }
    });
  }

  mixColor(from, to, t) {
    const clamped = Phaser.Math.Clamp(t, 0, 1);
    const fr = (from >> 16) & 0xff;
    const fg = (from >> 8) & 0xff;
    const fb = from & 0xff;
    const tr = (to >> 16) & 0xff;
    const tg = (to >> 8) & 0xff;
    const tb = to & 0xff;

    const r = Math.round(fr + (tr - fr) * clamped);
    const g = Math.round(fg + (tg - fg) * clamped);
    const b = Math.round(fb + (tb - fb) * clamped);
    return (r << 16) | (g << 8) | b;
  }

  updateModeToggleButton(hoveredSegment = null) {
    if (!this.modeToggleBg) {
      return;
    }

    const x = 320;
    const y = 56;
    const width = 210;
    const height = 28;
    const half = width / 2;
    const leftX = x - half;
    const rightX = x;

    const isShiftOverride = this.isShiftPressed && !this.isSellMode;
    const targetRatio = (this.isSellMode || this.isShiftPressed) ? 1 : 0;
    if (!this.modeIndicatorTween) {
      this.modeVisualSellRatio = targetRatio;
    }

    const leftActiveBlend = 1 - this.modeVisualSellRatio;
    const rightActiveBlend = this.modeVisualSellRatio;

    const leftColor = this.mixColor(0x1f1a16, 0x5b6a4c, leftActiveBlend);
    const rightActiveColor = isShiftOverride ? 0xaa6633 : 0x8a3d3d;
    const rightColor = this.mixColor(0x1f1a16, rightActiveColor, rightActiveBlend);

    const leftAlpha = hoveredSegment === 'build' && leftActiveBlend < 0.95 ? 0.9 : 1;
    const rightAlpha = hoveredSegment === 'sell' && rightActiveBlend < 0.95 ? 0.9 : 1;

    this.modeToggleBg.clear();
    this.modeToggleBg.fillStyle(0x2a1e14, 1);
    this.modeToggleBg.fillRoundedRect(leftX, y - height / 2, width, height, 6);
    this.modeToggleBg.fillStyle(leftColor, leftAlpha);
    this.modeToggleBg.fillRoundedRect(leftX + 2, y - height / 2 + 2, half - 3, height - 4, 4);
    this.modeToggleBg.fillStyle(rightColor, rightAlpha);
    this.modeToggleBg.fillRoundedRect(rightX + 1, y - height / 2 + 2, half - 3, height - 4, 4);
    this.modeToggleBg.lineStyle(2, UI_BRASS, 0.85);
    this.modeToggleBg.strokeRoundedRect(leftX, y - height / 2, width, height, 6);
    this.modeToggleBg.lineStyle(1, UI_BRASS_SOFT, 0.28);
    this.modeToggleBg.beginPath();
    this.modeToggleBg.moveTo(x, y - height / 2 + 2);
    this.modeToggleBg.lineTo(x, y + height / 2 - 2);
    this.modeToggleBg.strokePath();

    this.modeBuildLabel.setStyle({ fill: leftActiveBlend > 0.5 ? '#fff3d8' : '#d6c8b1' });
    this.modeSellLabel.setStyle({ fill: rightActiveBlend > 0.5 ? '#fff3d8' : '#d6c8b1' });
    if (isShiftOverride) {
      this.modeSellLabel.setText('$ Verkaufen*');
    } else {
      this.modeSellLabel.setText('$ Verkaufen');
    }
  }

  toggleGameSpeed() {
    // Zyklisch: 1x -> 2x -> 3x -> 1x
    if (this.gameSpeedMultiplier === 1) {
      this.gameSpeedMultiplier = 2;
    } else if (this.gameSpeedMultiplier === 2) {
      this.gameSpeedMultiplier = 3;
    } else {
      this.gameSpeedMultiplier = 1;
    }

    if (this.speedText) {
      this.speedText.setText(`Speed: ${this.gameSpeedMultiplier}x [S]`);
      let speedColor = '#d8cab6'; // 1x
      if (this.gameSpeedMultiplier === 2) speedColor = '#f3d289'; // 2x
      if (this.gameSpeedMultiplier === 3) speedColor = '#e58b6f'; // 3x
      this.speedText.setStyle({ fill: speedColor });
    }

    this.debugLog(`⏩ Spielgeschwindigkeit: ${this.gameSpeedMultiplier}x`);
  }

  cycleTowerType() {
    if (!this.towerTypeKeys || this.towerTypeKeys.length === 0) {
      return;
    }

    const nextIndex = (this.selectedTowerIndex + 1) % this.towerTypeKeys.length;
    this.selectTowerTypeByKey(this.towerTypeKeys[nextIndex]);
  }

  getTowerButtonLabel(towerKey) {
    const shortLabels = {
      steamCannon: 'DK',
      highPressure: 'HD',
      flamethrower: 'FW',
      Tesla: 'TS',
      generator: 'GEN'
    };
    return shortLabels[towerKey] || towerKey.slice(0, 3).toUpperCase();
  }

  createTowerTypeButtons(startX, y) {
    const BTN_WIDTH = 58;
    const BTN_HEIGHT = 26;
    const GAP = 6;

    this.towerTypeButtons.forEach((btn) => {
      btn.bg.destroy();
      btn.swatch.destroy();
      btn.label.destroy();
      btn.cost.destroy();
    });
    this.towerTypeButtons = [];

    let visibleSlotIndex = 0;
    this.towerSelectionOrder.forEach((towerKey) => {
      if (!this.towerTypeKeys.includes(towerKey)) {
        return;
      }

      const towerType = TOWER_TYPES[towerKey];
      const x = startX + visibleSlotIndex * (BTN_WIDTH + GAP) + BTN_WIDTH / 2;
      visibleSlotIndex++;

      const bg = this.add.rectangle(x, y, BTN_WIDTH, BTN_HEIGHT, 0x1f2430, 1)
        .setOrigin(0.5)
        .setStrokeStyle(1, 0x7c6647, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(121);

      const swatch = this.add.rectangle(x - BTN_WIDTH / 2 + 8, y, 8, 8, towerType.color, 1)
        .setOrigin(0.5)
        .setDepth(122);

      const label = this.add.text(x - BTN_WIDTH / 2 + 14, y - 5, this.getTowerButtonLabel(towerKey), {
        fontSize: '10px',
        fill: '#e9ddc8',
        fontFamily: UI_BODY_FONT,
        fontStyle: 'bold'
      }).setOrigin(0, 0.5).setDepth(122);

      const cost = this.add.text(x - BTN_WIDTH / 2 + 14, y + 6, `${towerType.cost}g`, {
        fontSize: '9px',
        fill: '#c7b79f',
        fontFamily: UI_BODY_FONT
      }).setOrigin(0, 0.5).setDepth(122);

      bg.on('pointerdown', () => {
        this.selectTowerTypeByKey(towerKey);
      });
      bg.on('pointerover', () => {
        this.hoveredTowerButtonKey = towerKey;
        this.updateTowerTypeButtons();
      });
      bg.on('pointerout', () => {
        this.hoveredTowerButtonKey = null;
        this.updateTowerTypeButtons();
      });

      this.towerTypeButtons.push({ towerKey, bg, swatch, label, cost });
    });

    this.updateTowerTypeButtons();
  }

  updateTowerTypeButtons() {
    if (!this.towerTypeButtons) {
      return;
    }

    this.towerTypeButtons.forEach((btn) => {
      const isSelected = this.towerTypeKeys[this.selectedTowerIndex] === btn.towerKey;
      const isHovered = this.hoveredTowerButtonKey === btn.towerKey;

      const fillColor = isSelected ? 0x5a3d24 : (isHovered ? 0x3a2b1f : 0x241c17);
      const borderColor = isSelected ? UI_BRASS : 0x7c6647;
      btn.bg.setFillStyle(fillColor, 1);
      btn.bg.setStrokeStyle(isSelected ? 2 : 1, borderColor, 1);

      btn.label.setStyle({ fill: isSelected ? '#fff3d8' : '#e9ddc8' });
      btn.cost.setStyle({ fill: isSelected ? '#f2ddb5' : '#c7b79f' });
    });
  }

  selectTowerTypeByNumber(slotNumber) {
    const numberToTower = {
      1: 'steamCannon',
      2: 'generator',
      3: 'flamethrower',
      4: 'Tesla'
    };

    const towerKey = numberToTower[slotNumber];
    if (!towerKey || !this.towerTypeKeys.includes(towerKey)) {
      return;
    }

    this.selectTowerTypeByKey(towerKey);
  }

  selectTowerTypeByKey(towerKey) {
    const index = this.towerTypeKeys.indexOf(towerKey);
    if (index < 0) {
      return;
    }

    this.selectedTowerIndex = index;
    this.selectedTowerType = TOWER_TYPES[towerKey];
    this.updateTowerTypeButtons();

    if (this.towerText) {
      this.towerText.setText(`Türme: ${this.towers.length} | ${this.selectedTowerType.name} (${this.selectedTowerType.cost}g)`);
    }

    this.showTowerSwitchFeedback();
    this.debugLog(`Turm gewechselt: ${this.selectedTowerType.name} (${this.selectedTowerType.cost}g)`);
  }

  showTowerSwitchFeedback() {
    if (this.towerSwitchPulseTween) {
      this.towerSwitchPulseTween.stop();
    }
    if (this.towerSwitchFadeTween) {
      this.towerSwitchFadeTween.stop();
    }

    if (this.towerText) {
      this.towerText.setStyle({ fill: '#f3d289' });
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
            this.towerText.setStyle({ fill: '#e6d4c1' });
          }
        }
      });
    }

    if (this.towerSwitchFxText) {
      this.towerSwitchFxText.setText(`>> ${this.selectedTowerType.name} aktiv`);
      this.towerSwitchFxText.setY(40);
      this.towerSwitchFxText.setAlpha(1);

      this.towerSwitchFadeTween = this.tweens.add({
        targets: this.towerSwitchFxText,
        y: 34,
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
      if (this.hoverFieldGraphics) {
        this.hoverFieldGraphics.clear();
      }
      return;
    }

    // Maus-Position holen
    const pointer = this.input.activePointer;
    const x = pointer.x;
    const y = pointer.y;

    // Nur im Spielfeld zeigen (y >= HUD_HEIGHT)
    if (y < this.HUD_HEIGHT) {
      this.towerPreviewGraphics.clear();
      if (this.hoverFieldGraphics) {
        this.hoverFieldGraphics.clear();
      }
      return;
    }

    this.towerPreviewGraphics.clear();
    if (this.hoverFieldGraphics) {
      this.hoverFieldGraphics.clear();
    }

    // Prüfen ob genug Gold für Turm-Platzierung
    const hasEnoughGold = this.gold >= this.selectedTowerType.cost;

    // Zielfeld auf Grid snappen und hervorheben
    const gridX = Math.round(x / this.TILE_SIZE) * this.TILE_SIZE;
    const gridY = Math.round((y - this.HUD_HEIGHT) / this.TILE_SIZE) * this.TILE_SIZE;
    
    if (this.hoverFieldGraphics) {
      // Zielfeld-Farbe: Messing bei genug Gold, Kupferrot bei zu wenig Gold
      const fieldColor = hasEnoughGold ? UI_BRASS_SOFT : 0xb36549;
      const fieldAlpha = hasEnoughGold ? 0.13 : 0.2;
      this.hoverFieldGraphics.fillStyle(fieldColor, fieldAlpha);
      this.hoverFieldGraphics.fillRect(gridX - this.TILE_SIZE / 2, gridY - this.TILE_SIZE / 2, this.TILE_SIZE, this.TILE_SIZE);
    }

    // Tower-Preview als durchsichtiges Quadrat (40x40) mit Range-Kreis
    const TOWER_WIDTH = 40;
    const TOWER_HEIGHT = 40;
    const previewAlpha = hasEnoughGold ? 0.34 : 0.14;
    const rangeAlpha = hasEnoughGold ? 0.045 : 0.02;

    // Reichweiten-Vorschau zeichnen (Generator: 3x3-Feld, sonst Kreis)
    this.towerPreviewGraphics.fillStyle(this.selectedTowerType.color, rangeAlpha);
    this.towerPreviewGraphics.lineStyle(1, this.selectedTowerType.color, hasEnoughGold ? 0.3 : 0.15);
    if (this.selectedTowerType.isBuff) {
      const areaSize = this.TILE_SIZE * 3;
      this.towerPreviewGraphics.fillRect(
        x - areaSize / 2,
        y - areaSize / 2,
        areaSize,
        areaSize
      );
      this.towerPreviewGraphics.strokeRect(
        x - areaSize / 2,
        y - areaSize / 2,
        areaSize,
        areaSize
      );
    } else {
      this.towerPreviewGraphics.fillCircle(x, y, this.selectedTowerType.range);
      this.towerPreviewGraphics.strokeCircle(x, y, this.selectedTowerType.range);
    }

    // Tower-Quadrat zeichnen (semi-transparent zur Farbe des Turms)
    this.towerPreviewGraphics.fillStyle(this.selectedTowerType.color, previewAlpha);
    this.towerPreviewGraphics.fillRect(
      x - TOWER_WIDTH / 2,
      y - TOWER_HEIGHT / 2,
      TOWER_WIDTH,
      TOWER_HEIGHT
    );

    // Outline
    this.towerPreviewGraphics.lineStyle(2, this.selectedTowerType.color, hasEnoughGold ? 0.7 : 0.35);
    this.towerPreviewGraphics.strokeRect(
      x - TOWER_WIDTH / 2,
      y - TOWER_HEIGHT / 2,
      TOWER_WIDTH,
      TOWER_HEIGHT
    );
  }

  updateWaveSpawning(deltaTime) {
    // Wave-Spawning in Game-Time:
    // remainingSpawnDelay bleibt in Basis-ms (z.B. 1000),
    // scaledDeltaTime bringt den Speed-Faktor rein.
    if (!this.waveSpawning) {
      return;
    }

    const scaledDeltaTime = deltaTime * this.gameSpeedMultiplier;
    
    // Verbleibende Zeit abzählen
    this.remainingSpawnDelay -= scaledDeltaTime;

    // Gegner spawnen wenn Zeit abgelaufen
    if (this.remainingSpawnDelay <= 0) {
      const ENEMY_TYPE_MAP = { n: 'normal', s: 'fast', a: 'armored' };
      
      // Durch spawnSequence gehen bis nächster Gegner/Aktion
      while (this.waveSpawnSequenceIndex < this.waveSpawnSequence.length) {
        const char = this.waveSpawnSequence[this.waveSpawnSequenceIndex];

        if (char === '.') {
          // Pause
          // Overshoot beibehalten, damit kein Timing-Drift entsteht
          this.remainingSpawnDelay += WAVE_CONFIG.EXTRA_PAUSE_MS;
          this.waveSpawnSequenceIndex++;
          const elapsedRealMs = Math.floor(performance.now() - this.waveStartRealMs);
          const elapsedGameMs = Math.floor(this.levelElapsedGameMs - this.waveStartGameMs);
          const nextRealMs = Math.floor(this.remainingSpawnDelay / this.gameSpeedMultiplier);
          this.debugLog(`[SPAWN tRealWave=${elapsedRealMs}ms tGameWave=${elapsedGameMs}ms] Pause: next in game=${this.remainingSpawnDelay.toFixed(0)}ms real~=${nextRealMs}ms (Speed=${this.gameSpeedMultiplier}x)`);
          return;
        } else if (ENEMY_TYPE_MAP[char]) {
          // Gegner spawnen
          const enemy = new Enemy(this, this.currentPath, { type: ENEMY_TYPE_MAP[char] });
          enemy.waveSpawnIndex = this.waveSpawnIndex;
          this.enemies.push(enemy);
          this.enemiesInCurrentWave.push(enemy);
          this.waveSpawnIndex++;
          
          // Verbleibende Dauer für nächsten Spawn (wird mit Speed skaliert)
          // Overshoot beibehalten, damit kein Timing-Drift entsteht
          this.remainingSpawnDelay += WAVE_CONFIG.SPAWN_INTERVAL;
          this.waveSpawnSequenceIndex++;
          const elapsedRealMs = Math.floor(performance.now() - this.waveStartRealMs);
          const elapsedGameMs = Math.floor(this.levelElapsedGameMs - this.waveStartGameMs);
          const nextRealMs = Math.floor(this.remainingSpawnDelay / this.gameSpeedMultiplier);
          this.debugLog(`[SPAWN tRealWave=${elapsedRealMs}ms tGameWave=${elapsedGameMs}ms] ${ENEMY_TYPE_MAP[char]} spawned, next in game=${this.remainingSpawnDelay.toFixed(0)}ms real~=${nextRealMs}ms (Speed=${this.gameSpeedMultiplier}x)`);
          return;
        } else {
          // Unbekanntes Zeichen überspringen
          this.waveSpawnSequenceIndex++;
          continue;
        }
      }

      // Alle Gegner gespawned
      this.debugLog(`   ✅ Wave-Spawning abgeschlossen`);
      this.waveSpawnComplete = true;
      this.waveSpawning = false;
    }
  }

  updateWavePreview() {
    if (!this.wavePreviewGraphics || !this.waveSpawnSequence) {
      return;
    }

    this.wavePreviewGraphics.clear();

    // Wave-Gegner visualisieren (unten links im HUD, auf gleicher Höhe wie Modus-Anzeiger)
    const PREVIEW_START_X = 10;
    const PREVIEW_START_Y = 70;
    const CIRCLE_RADIUS = 5;
    const CIRCLE_SPACING = 12;

    // Farb-Map für Gegner-Typen
    const ENEMY_TYPE_MAP = { n: 'normal', s: 'fast', a: 'armored' };
    const coreColorMap = {
      normal: 0x00ff00,
      fast: 0xff6600,
      armored: 0xffff00
    };
    const frameColorMap = {
      normal: 0xbfa685,
      fast: 0xd18b63,
      armored: 0xe1c27f
    };

    let circleX = PREVIEW_START_X;
    let circleY = PREVIEW_START_Y;
    let enemyIndex = 0;

    // Durch alle Zeichen durchgehen
    for (let i = 0; i < this.waveSpawnSequence.length; i++) {
      const char = this.waveSpawnSequence[i];

      if (char === '.') {
        // Pause-Zeichen überspringen
        continue;
      }

      if (ENEMY_TYPE_MAP[char]) {
        const enemyType = ENEMY_TYPE_MAP[char];
        const baseCoreColor = coreColorMap[enemyType];
        const baseFrameColor = frameColorMap[enemyType];
        
        // Bestimme Status
        const isDefeated = this.defeatedInWaveMap.has(enemyIndex);
        const isNotSpawned = enemyIndex >= this.waveSpawnIndex;

        let frameColor = baseFrameColor;
        let coreColor = baseCoreColor;
        let alpha = 1;
        
        if (isDefeated) {
          frameColor = 0x5c4f43;
          alpha = 0.4;
        } else if (isNotSpawned) {
          frameColor = 0x9f927d;
          alpha = 0.6;
        }

        // Kreis zeichnen: gedämpfter Rahmen + Gegner-Originalfarbe im Kern
        this.wavePreviewGraphics.fillStyle(frameColor, alpha);
        this.wavePreviewGraphics.fillCircle(circleX, circleY, CIRCLE_RADIUS);
        this.wavePreviewGraphics.fillStyle(coreColor, alpha);
        this.wavePreviewGraphics.fillCircle(circleX, circleY, Math.max(2, CIRCLE_RADIUS - 2));

        // Outline
        this.wavePreviewGraphics.lineStyle(1, frameColor, alpha * 0.8);
        this.wavePreviewGraphics.strokeCircle(circleX, circleY, CIRCLE_RADIUS);

        // Wenn dieser Gegner gerade spawnet, Pfeil oben drüber
        if (enemyIndex === this.waveSpawnIndex && !isDefeated && !isNotSpawned) {
          this.wavePreviewGraphics.fillStyle(0xf3d289, 1);
          this.wavePreviewGraphics.fillTriangleShape([
            { x: circleX, y: circleY - CIRCLE_RADIUS - 6 },
            { x: circleX - 4, y: circleY - CIRCLE_RADIUS },
            { x: circleX + 4, y: circleY - CIRCLE_RADIUS }
          ]);
        }

        circleX += CIRCLE_SPACING;

        // Auf Zeilenwechsel prüfen (max 12 pro Reihe)
        if ((enemyIndex + 1) % 12 === 0) {
          circleX = PREVIEW_START_X;
          circleY += CIRCLE_SPACING;
        }

        enemyIndex++;
      }
    }
  }

  update(time, deltaTime) {
    const scaledDeltaTime = deltaTime * this.gameSpeedMultiplier;

    if (this.levelSplashVisible) {
      if (this.towerPreviewGraphics) {
        this.towerPreviewGraphics.clear();
      }
      return;
    }

    if (this.isPaused) {
      if (this.towerPreviewGraphics) {
        this.towerPreviewGraphics.clear();
      }
      return;
    }

    this.levelElapsedGameMs += scaledDeltaTime;

    // Cursor-Preview zeichnen und aktualisieren
    this.updateCursorPreview();
    this.updateWaveSpawning(deltaTime);  // Mit deltaTime - skaliert mit Speed
    this.updateWavePreview();

    // **HUD immer aktualisieren, egal welcher State**
    if (this.infoText) {
      this.infoText.setText(`Gegner: ${this.enemies.length}`);
    }
    if (this.goldText) {
      this.goldText.setText(`Gold: ${this.gold}`);
    }
    if (this.scoreText) {
      this.scoreText.setText(`Score: ${this.getTotalScorePoints()} pts`);
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
          this.levelScorePoints += SCORE_RULES.KILL_POINTS;
          this.scoreBreakdown.killPoints += SCORE_RULES.KILL_POINTS;
          this.totalGoldEarned += actualReward;
          this.debugLog(`Kill! +${actualReward}g (Total: ${this.gold})`);
        }

        // Leben verlieren wenn Gegner durchkommt
        if (enemy.reachedEnd) {
          this.lives -= 1;
          this.totalLeaks += 1;
          this.debugLog(`Gegner durchgekommen! Leben: ${this.lives}`);
          if (this.lives <= 0) {
            this.finalTotalScoreGold = this.accumulatedScoreGold + this.gold;
            this.scoreBreakdown.goldPoints += this.gold;
            this.finalizeRunScorePoints({ includeCurrentGold: true, applyPerfection: true });
            this.gameState = 'lost';
            return;
          }
        } else if (!enemy.isAlive && typeof enemy.waveSpawnIndex !== 'undefined') {
          // Gegner wurde besiegt - in Wave-Preview tracken
          this.defeatedInWaveMap.set(enemy.waveSpawnIndex, true);
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
      this.debugLog(`✅ Welle ${this.currentWaveIndex + 1} fertig!`);

      const leakedInWave = this.totalLeaks > this.waveLeakCountAtStart;
      if (!leakedInWave) {
        this.levelScorePoints += SCORE_RULES.NO_LEAK_WAVE_POINTS;
        this.scoreBreakdown.noLeakWavePoints += SCORE_RULES.NO_LEAK_WAVE_POINTS;
        this.totalNoLeakWaves += 1;
      }

      // Alle Gegner der Welle besiegt
      if (this.currentWaveIndex >= this.currentLevel.totalWaves - 1) {
        const clearPoints = SCORE_RULES.LEVEL_CLEAR_BASE_POINTS + (SCORE_RULES.POINTS_PER_LIFE * this.lives);
        this.levelScorePoints += clearPoints;
        this.scoreBreakdown.levelClearPoints += clearPoints;
        this.levelScorePoints += this.gold;
        this.scoreBreakdown.goldPoints += this.gold;

        const nextLevelKey = this.getNextLevelKey(this.selectedLevelKey);
        if (nextLevelKey) {
          this.advanceToNextLevel(nextLevelKey);
          return;
        }

        // Letztes verfügbares Level geschafft
        this.finalTotalScoreGold = this.accumulatedScoreGold + this.gold;
        this.finalizeRunScorePoints({ includeCurrentGold: false, applyPerfection: true });
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

    // Auf Grid-Position snappen (wie beim Platzieren!)
    const gridX = Math.round(screenX / this.TILE_SIZE) * this.TILE_SIZE;
    const gridY = Math.round(fieldY / this.TILE_SIZE) * this.TILE_SIZE;
    const absoluteY = gridY + this.HUD_HEIGHT;

    const tower = this.getTowerAtPosition(gridX, absoluteY);
    
    if (!tower) {
      return; // Kein Turm getroffen
    }

    // Turm verkaufen: 75% des Kaufpreises zurück
    const refund = Math.floor(tower.type.cost * 0.75);
    this.gold += refund;
    this.totalGoldSpent -= tower.type.cost; // Vom Ausgaben-Tracker abziehen
    this.runHasSoldTower = true;
    
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
    
    this.debugLog(`Turm verkauft! +${refund}g (75% von ${tower.type.cost}g). Gold jetzt: ${this.gold}`);
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
      this.debugLog('Nicht genug Gold!');
      return;
    }

    const absoluteY = gridY + this.HUD_HEIGHT;

    // 3. Pfad-Kollisions-Check (keine Türme auf Pfad)
    if (this.isPositionOnPath(gridX, absoluteY)) {
      this.debugLog('Kann nicht auf den Pfad setzen!');
      return;
    }

    // 4. Türm-Kollisions-Check (keine Türme übereinander)
    if (this.isTowerAtPosition(gridX, absoluteY)) {
      this.debugLog('Da steht schon ein Turm!');
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

    this.debugLog(`Turm platziert bei Grid (${gridX}, ${gridY})! Gold übrig: ${this.gold}`);
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
      scorePoints: this.getTotalScorePoints(),
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
      scoreMeta: {
        scoreBreakdown: {
          killPoints: this.scoreBreakdown.killPoints,
          noLeakWavePoints: this.scoreBreakdown.noLeakWavePoints,
          levelClearPoints: this.scoreBreakdown.levelClearPoints,
          goldPoints: this.scoreBreakdown.goldPoints
        },
        totalNoLeakWaves: this.totalNoLeakWaves,
        runHasSoldTower: this.runHasSoldTower
      },
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
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:radial-gradient(circle at 50% 20%, rgba(36,25,15,0.5), rgba(0,0,0,0.82));display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;box-sizing:border-box;';

      const box = document.createElement('div');
      box.style.cssText = 'background:linear-gradient(180deg,#2d2015 0%,#1b1714 24%,#131922 100%);border:3px solid #d4ae74;border-radius:12px;padding:24px;display:flex;flex-direction:column;gap:12px;min-width:320px;box-shadow:0 18px 50px rgba(0,0,0,0.55), inset 0 0 0 2px rgba(243,216,170,0.16);font-family:Courier,monospace;';

      const label = document.createElement('div');
      label.textContent = 'Dein Name für die Highscore (3–10 Zeichen):';
      label.style.cssText = 'color:#f1d09a;font-size:18px;font-family:Georgia,"Times New Roman",serif;font-weight:700;letter-spacing:0.4px;';

      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 10;
      input.value = defaultValue.slice(0, 10);
      input.style.cssText = 'background:rgba(16,23,33,0.92);color:#f4efe5;border:1px solid rgba(212,174,116,0.55);border-radius:8px;padding:10px 12px;font-size:16px;outline:none;font-family:Courier,monospace;';

      const counter = document.createElement('div');
      counter.textContent = `${input.value.length}/10`;
      counter.style.cssText = 'color:#c4b59b;font-size:12px;text-align:right;';

      input.addEventListener('input', () => {
        counter.textContent = `${input.value.length}/10`;
      });

      const buttons = document.createElement('div');
      buttons.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;';

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Abbrechen';
      cancelBtn.style.cssText = 'background:linear-gradient(180deg,#4c3520,#352417);color:#e9dcc3;border:2px solid #b5905d;border-radius:8px;padding:8px 14px;cursor:pointer;font-family:Courier,monospace;font-weight:bold;';

      const submitBtn = document.createElement('button');
      submitBtn.textContent = 'Speichern';
      submitBtn.style.cssText = 'background:linear-gradient(180deg,#6d4a2b,#4d3520);color:#fff3d8;border:2px solid #d4ae74;border-radius:8px;padding:8px 14px;cursor:pointer;font-family:Courier,monospace;font-weight:bold;';

      const cleanup = (value) => {
        document.body.removeChild(overlay);
        resolve(value);
      };

      cancelBtn.addEventListener('click', () => cleanup(null));
      submitBtn.addEventListener('click', () => cleanup(input.value));
      cancelBtn.addEventListener('mouseover', () => {
        cancelBtn.style.borderColor = '#d5b17a';
        cancelBtn.style.background = 'linear-gradient(180deg,#5c4127,#402b1b)';
      });
      cancelBtn.addEventListener('mouseout', () => {
        cancelBtn.style.borderColor = '#b5905d';
        cancelBtn.style.background = 'linear-gradient(180deg,#4c3520,#352417)';
      });
      submitBtn.addEventListener('mouseover', () => {
        submitBtn.style.borderColor = '#f4d8a4';
        submitBtn.style.background = 'linear-gradient(180deg,#7b5531,#593d24)';
      });
      submitBtn.addEventListener('mouseout', () => {
        submitBtn.style.borderColor = '#d4ae74';
        submitBtn.style.background = 'linear-gradient(180deg,#6d4a2b,#4d3520)';
      });
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
    const name = String(item.player_name || 'Unknown').slice(0, 9);
    const score = String(item.score_points ?? 0);
    const level = item.selected_level_number ? `L${item.selected_level_number}` : 'L?';
    return `${rank}. ${name} ${score}p ${level}`;
  }

  async fetchAndShowTopScores() {
    if (!this.topScoresText) {
      return;
    }

    this.setTopScoresStatus('Top 20 werden geladen ...', '#ffff88');

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/scores?limit=20`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Top 20 konnten nicht geladen werden.');
      }

      const items = Array.isArray(data.items) ? data.items : [];
      if (!items.length) {
        this.setTopScoresStatus('Noch keine Einträge in der Top 20.', '#cccccc');
        return;
      }

      const lines = items.map((item, index) => this.formatTopScoreLine(item, index));
      this.setTopScoresStatus(lines.join('\n'), '#dde6ff');
    } catch (error) {
      console.error('Top10 fetch failed:', error);
      const message = error?.message === 'Failed to fetch' || error?.message === 'Load failed'
        ? 'API nicht erreichbar oder CORS blockiert.'
        : error.message;
      this.setTopScoresStatus(`Fehler: ${message}`, '#ff6666');
    }
  }

  async requestRunAuthToken() {
    let response;
    try {
      response = await fetch(`${API_BASE_URL}/api/v1/auth/challenge`);
    } catch (error) {
      throw new Error('API nicht erreichbar oder CORS blockiert. Pruefe Backend-URL und ALLOWED_ORIGINS.');
    }
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Run-Auth-Token konnte nicht geholt werden.');
    }

    if (!data.token || typeof data.token !== 'string') {
      throw new Error('Backend lieferte keinen gültigen Run-Auth-Token.');
    }

    return data.token;
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
    this.setScoreSubmitStatus('Hole Sicherheits-Token ...', '#ffff88');

    try {
      const runAuthToken = await this.requestRunAuthToken();

      this.setScoreSubmitStatus('Speichere Run und Nutzungsstatistik ...', '#ffff88');
      const payload = {
        ...this.buildRunSubmissionPayload(playerName),
        runAuthToken
      };

      const response = await fetch(`${API_BASE_URL}/api/v1/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Run-Auth-Token': runAuthToken
        },
        body: JSON.stringify(payload)
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
      const message = error?.message === 'Failed to fetch' || error?.message === 'Load failed'
        ? 'API nicht erreichbar oder CORS blockiert.'
        : error.message;
      this.setScoreSubmitStatus(`Fehler: ${message}`, '#ff6666');
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
      noLeakWaves: this.totalNoLeakWaves,
      goldEarned: this.totalGoldEarned,
      goldSpent: this.totalGoldSpent,
      goldRemaining: this.gold,
      totalScoreGold: this.getTotalScoreGold(),
      totalScorePoints: this.getTotalScorePoints(),
      perfectionBonusActive: !this.runHasSoldTower,
      towersPlaced: this.towers.length,
      towerUsage: this.towerPlacementStats
    };

    this.debugLog('=== RUN SUMMARY ===');
    this.debugLog(summary);
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
      if (candidate.length > 40 && currentLine !== 'Nutzung: ') {
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
    
    this.debugLog(`🌊 Welle ${this.currentWaveIndex + 1} startet:`, waveConfig);
    this.debugLog(`   (Index: ${this.currentWaveIndex}, Level: ${this.currentLevel.levelNumber}, Total Waves: ${this.currentLevel.totalWaves})`);
    this.debugLog(`   (Aktuelle Gegner im Spiel: ${this.enemies.length})`);

    // **WICHTIG**: Gegner-Leak prüfen - sollte leer sein
    if (this.enemies.length > 0) {
      this.debugWarn(`⚠️ GEGNER-LEAK! Es sind noch ${this.enemies.length} alte Gegner da!`);
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

    this.debugLog(`   → Wave-String: '${waveString}' (${totalInWave} Gegner)`);

    // Spawn-Flag zurücksetzen für neues Zeit-basiertes System (mit deltaTime-Tracking)
    this.debugLog(`   🔧 NEW SPAWN SYSTEM: Starting with deltaTime tracking`);
    this.waveStartRealMs = performance.now();
    this.waveStartGameMs = this.levelElapsedGameMs;
    this.waveSpawnComplete = false;
    this.enemiesInCurrentWave = [];
    this.waveSpawnSequence = spawnSequence;
    this.waveSpawnIndex = 0;
    this.defeatedInWaveMap.clear();
    this.waveSpawning = true;
    this.remainingSpawnDelay = 0;  // Erste Gegner spawnen sofort
    this.waveSpawnSequenceIndex = 0;
    this.waveLeakCountAtStart = this.totalLeaks;

    this.waveTimerText.setText('Welle läuft...');
  }

  startNextWave() {
    this.currentWaveIndex++;
    if (this.currentWaveIndex >= this.currentLevel.totalWaves) {
      const clearPoints = SCORE_RULES.LEVEL_CLEAR_BASE_POINTS + (SCORE_RULES.POINTS_PER_LIFE * this.lives);
      this.levelScorePoints += clearPoints;
      this.scoreBreakdown.levelClearPoints += clearPoints;
      this.levelScorePoints += this.gold;
      this.scoreBreakdown.goldPoints += this.gold;
      this.finalTotalScoreGold = this.accumulatedScoreGold + this.gold;
      this.finalizeRunScorePoints({ includeCurrentGold: false, applyPerfection: true });
      this.gameState = 'won';
      return;
    }
    this.startWave();
  }

  showGameOverScreen() {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    const uiBaseDepth = 12000;
    const panelWidth = 300;
    const panelHeight = 340;
    const panelTop = cy - panelHeight / 2;
    const panelGap = 18;
    const centerPanelLeft = cx - panelWidth / 2;
    const infoPanelLeft = centerPanelLeft - panelWidth - panelGap;
    const topPanelLeft = centerPanelLeft + panelWidth + panelGap;

    // Dunkles Overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(UI_OVERLAY, 0.78);
    overlay.fillRect(0, 0, this.scale.width, this.scale.height);
    overlay.setDepth(uiBaseDepth);

    // Panel
    const panel = this.add.graphics();
    panel.fillStyle(UI_PANEL_BRASS, 0.96);
    panel.lineStyle(3, UI_BRASS, 0.98);
    panel.fillRect(centerPanelLeft, panelTop, panelWidth, panelHeight);
    panel.strokeRect(centerPanelLeft, panelTop, panelWidth, panelHeight);
    panel.fillStyle(UI_GLASS, 0.4);
    panel.fillRect(centerPanelLeft + 10, panelTop + 10, panelWidth - 20, panelHeight - 20);
    panel.setDepth(uiBaseDepth + 1);

    const infoPanel = this.add.graphics();
    infoPanel.fillStyle(UI_PANEL_BRASS, 0.96);
    infoPanel.lineStyle(2, UI_BRASS, 0.9);
    infoPanel.fillRect(infoPanelLeft, panelTop, panelWidth, panelHeight);
    infoPanel.strokeRect(infoPanelLeft, panelTop, panelWidth, panelHeight);
    infoPanel.fillStyle(UI_GLASS, 0.42);
    infoPanel.fillRect(infoPanelLeft + 10, panelTop + 10, panelWidth - 20, panelHeight - 20);
    infoPanel.setDepth(uiBaseDepth + 1);

    this.add.text(infoPanelLeft + 150, cy - 152, 'PUNKTE-RECHNUNG', {
      fontSize: '16px',
      fill: '#f1d09a',
      fontFamily: UI_TITLE_FONT,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(uiBaseDepth + 2);

    const breakdownBase =
      this.scoreBreakdown.killPoints +
      this.scoreBreakdown.noLeakWavePoints +
      this.scoreBreakdown.levelClearPoints +
      this.scoreBreakdown.goldPoints;
    const multiplier = this.runHasSoldTower ? 1.0 : SCORE_RULES.PERFECTION_MULTIPLIER;

    this.add.text(
      infoPanelLeft + 14,
      cy - 130,
      'Dieser Run:\n' +
      `Kills: ${this.totalKills} => ${this.scoreBreakdown.killPoints}p\n` +
      `NoLeak-Wellen: ${this.totalNoLeakWaves} => ${this.scoreBreakdown.noLeakWavePoints}p\n` +
      `Clear-Bonus: ${this.scoreBreakdown.levelClearPoints}p\n` +
      `Gold-Bonus: ${this.scoreBreakdown.goldPoints}p\n\n` +
      `Basis: ${breakdownBase}p\n` +
      `Perfection: x${multiplier.toFixed(1)}\n` +
      `Final: ${this.getTotalScorePoints()} pts`,
      {
        fontSize: '12px',
        fill: '#eadfcd',
        fontFamily: UI_BODY_FONT,
        lineSpacing: 3,
        wordWrap: { width: 272, useAdvancedWrap: true }
      }
    ).setOrigin(0, 0).setDepth(uiBaseDepth + 2);

    this.add.text(cx, cy - 70, 'GAME OVER', {
      fontSize: '36px',
      fill: '#ff2222',
      fontFamily: UI_TITLE_FONT,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(uiBaseDepth + 2);

    this.add.text(cx, cy - 20, `Erreicht: Welle ${this.currentWaveIndex + 1}/${this.currentLevel.totalWaves}`, {
      fontSize: '16px',
      fill: '#e6d4c1',
      fontFamily: UI_BODY_FONT
    }).setOrigin(0.5).setDepth(uiBaseDepth + 2);

    this.add.text(cx, cy + 15, `Gold übrig: ${this.gold}`, {
      fontSize: '16px',
      fill: '#f3d289',
      fontFamily: UI_BODY_FONT
    }).setOrigin(0.5).setDepth(uiBaseDepth + 2);

    this.add.text(cx, cy + 32, `Gesamt-Score: ${this.getTotalScorePoints()} pts`, {
      fontSize: '14px',
      fill: '#ffd966',
      fontFamily: UI_BODY_FONT,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(uiBaseDepth + 2);

    this.add.text(cx, cy + 50, `Kills:${this.totalKills} | Leaks:${this.totalLeaks} | Ausgaben:${this.totalGoldSpent}g`, {
      fontSize: '11px',
      fill: '#d8cab6',
      fontFamily: UI_BODY_FONT
    }).setOrigin(0.5).setDepth(uiBaseDepth + 2);

    const usageLines = this.buildTowerUsageLines();
    this.add.text(cx, cy + 72, usageLines[0], {
      fontSize: '12px',
      fill: '#ffd9c8',
      fontFamily: UI_BODY_FONT
    }).setOrigin(0.5).setDepth(uiBaseDepth + 2);

    if (usageLines[1]) {
      this.add.text(cx, cy + 90, usageLines[1], {
        fontSize: '12px',
        fill: '#ffd9c8',
        fontFamily: UI_BODY_FONT
      }).setOrigin(0.5).setDepth(uiBaseDepth + 2);
    }

    this.scoreSubmitButton = this.add.text(cx, cy + 116, '[ SCORE SPEICHERN ]', {
      fontSize: '16px',
      fill: '#fff3d8',
      fontFamily: UI_BODY_FONT,
      fontStyle: 'bold',
      backgroundColor: '#5a3d24',
      padding: { x: 12, y: 7 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(uiBaseDepth + 3);

    this.scoreSubmitStatusText = this.add.text(cx, cy + 142, 'Noch nicht gespeichert', {
      fontSize: '12px',
      fill: '#d7d0c4',
      fontFamily: UI_BODY_FONT
    }).setOrigin(0.5).setDepth(uiBaseDepth + 3);

    this.scoreSubmitButton.on('pointerover', () => this.scoreSubmitButton.setStyle({ fill: '#fff8e6', backgroundColor: '#6d4a2b' }));
    this.scoreSubmitButton.on('pointerout', () => this.scoreSubmitButton.setStyle({ fill: '#fff3d8', backgroundColor: '#5a3d24' }));
    this.scoreSubmitButton.on('pointerdown', () => {
      this.requestAndSubmitRun();
    });

    const topPanel = this.add.graphics();
    topPanel.fillStyle(UI_PANEL_BRASS, 0.96);
    topPanel.lineStyle(2, UI_BRASS, 0.9);
    topPanel.fillRect(topPanelLeft, cy - 170, 300, 340);
    topPanel.strokeRect(topPanelLeft, cy - 170, 300, 340);
    topPanel.fillStyle(UI_GLASS, 0.42);
    topPanel.fillRect(topPanelLeft + 10, cy - 160, 280, 320);
    topPanel.setDepth(uiBaseDepth + 1);

    this.topScoresTitleText = this.add.text(topPanelLeft + 150, cy - 152, 'TOP 20 (nach Upload)', {
      fontSize: '16px',
      fill: '#f1d09a',
      fontFamily: UI_TITLE_FONT,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(uiBaseDepth + 2);

    this.topScoresText = this.add.text(topPanelLeft + 14, cy - 130, 'Score speichern,\ndann wird die Top 20 geladen.', {
      fontSize: '10px',
      fill: '#d8d2c6',
      fontFamily: UI_BODY_FONT,
      lineSpacing: 1
    }).setOrigin(0, 0).setDepth(uiBaseDepth + 2);

    // Neustart-Button
    const btn = this.add.text(cx, cy + 182, '[ NOCHMAL ]', {
      fontSize: '20px',
      fill: '#fff3d8',
      fontFamily: UI_BODY_FONT,
      fontStyle: 'bold',
      backgroundColor: '#5a3d24',
      padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(uiBaseDepth + 3);

    btn.on('pointerover', () => btn.setStyle({ fill: '#fff8e6', backgroundColor: '#6d4a2b' }));
    btn.on('pointerout', () => btn.setStyle({ fill: '#fff3d8', backgroundColor: '#5a3d24' }));
    btn.on('pointerdown', () => this.scene.restart({ debugMode: this.debugMode }));
  }

  showWinScreen() {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    const uiBaseDepth = 12000;
    const panelWidth = 300;
    const panelHeight = 340;
    const panelTop = cy - panelHeight / 2;
    const panelGap = 18;
    const centerPanelLeft = cx - panelWidth / 2;
    const infoPanelLeft = centerPanelLeft - panelWidth - panelGap;
    const topPanelLeft = centerPanelLeft + panelWidth + panelGap;

    // Dunkles Overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(UI_OVERLAY, 0.78);
    overlay.fillRect(0, 0, this.scale.width, this.scale.height);
    overlay.setDepth(uiBaseDepth);

    // Panel
    const panel = this.add.graphics();
    panel.fillStyle(UI_PANEL_BRASS, 0.96);
    panel.lineStyle(3, UI_BRASS, 0.98);
    panel.fillRect(centerPanelLeft, panelTop, panelWidth, panelHeight);
    panel.strokeRect(centerPanelLeft, panelTop, panelWidth, panelHeight);
    panel.fillStyle(UI_GLASS, 0.4);
    panel.fillRect(centerPanelLeft + 10, panelTop + 10, panelWidth - 20, panelHeight - 20);
    panel.setDepth(uiBaseDepth + 1);

    const infoPanel = this.add.graphics();
    infoPanel.fillStyle(UI_PANEL_BRASS, 0.96);
    infoPanel.lineStyle(2, UI_BRASS, 0.9);
    infoPanel.fillRect(infoPanelLeft, panelTop, panelWidth, panelHeight);
    infoPanel.strokeRect(infoPanelLeft, panelTop, panelWidth, panelHeight);
    infoPanel.fillStyle(UI_GLASS, 0.42);
    infoPanel.fillRect(infoPanelLeft + 10, panelTop + 10, panelWidth - 20, panelHeight - 20);
    infoPanel.setDepth(uiBaseDepth + 1);

    this.add.text(infoPanelLeft + 150, cy - 152, 'PUNKTE-RECHNUNG', {
      fontSize: '16px',
      fill: '#f1d09a',
      fontFamily: UI_TITLE_FONT,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(uiBaseDepth + 2);

    const breakdownBase =
      this.scoreBreakdown.killPoints +
      this.scoreBreakdown.noLeakWavePoints +
      this.scoreBreakdown.levelClearPoints +
      this.scoreBreakdown.goldPoints;
    const multiplier = this.runHasSoldTower ? 1.0 : SCORE_RULES.PERFECTION_MULTIPLIER;

    this.add.text(
      infoPanelLeft + 14,
      cy - 130,
      'Dieser Run:\n' +
      `Kills: ${this.totalKills} => ${this.scoreBreakdown.killPoints}p\n` +
      `NoLeak-Wellen: ${this.totalNoLeakWaves} => ${this.scoreBreakdown.noLeakWavePoints}p\n` +
      `Clear-Bonus: ${this.scoreBreakdown.levelClearPoints}p\n` +
      `Gold-Bonus: ${this.scoreBreakdown.goldPoints}p\n\n` +
      `Basis: ${breakdownBase}p\n` +
      `Perfection: x${multiplier.toFixed(1)}\n` +
      `Final: ${this.getTotalScorePoints()} pts`,
      {
        fontSize: '12px',
        fill: '#eadfcd',
        fontFamily: UI_BODY_FONT,
        lineSpacing: 3,
        wordWrap: { width: 272, useAdvancedWrap: true }
      }
    ).setOrigin(0, 0).setDepth(uiBaseDepth + 2);

    this.add.text(cx, cy - 70, 'GEWONNEN! 🎉', {
      fontSize: '32px',
      fill: '#22ff22',
      fontFamily: UI_TITLE_FONT,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(uiBaseDepth + 2);

    this.add.text(cx, cy - 20, 'Alle Wellen besiegt!', {
      fontSize: '16px',
      fill: '#e6d4c1',
      fontFamily: UI_BODY_FONT
    }).setOrigin(0.5).setDepth(uiBaseDepth + 2);

    this.add.text(cx, cy + 15, `Restgold: ${this.gold}`, {
      fontSize: '16px',
      fill: '#f3d289',
      fontFamily: UI_BODY_FONT
    }).setOrigin(0.5).setDepth(uiBaseDepth + 2);

    this.add.text(cx, cy + 32, `Gesamt-Score: ${this.getTotalScorePoints()} pts`, {
      fontSize: '14px',
      fill: '#ffff66',
      fontFamily: UI_BODY_FONT,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(uiBaseDepth + 2);

    this.add.text(cx, cy + 50, `Kills:${this.totalKills} | Leaks:${this.totalLeaks} | Ausgaben:${this.totalGoldSpent}g`, {
      fontSize: '11px',
      fill: '#d8cab6',
      fontFamily: UI_BODY_FONT
    }).setOrigin(0.5).setDepth(uiBaseDepth + 2);

    const usageLines = this.buildTowerUsageLines();
    this.add.text(cx, cy + 72, usageLines[0], {
      fontSize: '12px',
      fill: '#d8ffd8',
      fontFamily: UI_BODY_FONT
    }).setOrigin(0.5).setDepth(uiBaseDepth + 2);

    if (usageLines[1]) {
      this.add.text(cx, cy + 90, usageLines[1], {
        fontSize: '12px',
        fill: '#d8ffd8',
        fontFamily: UI_BODY_FONT
      }).setOrigin(0.5).setDepth(uiBaseDepth + 2);
    }

    this.scoreSubmitButton = this.add.text(cx, cy + 116, '[ SCORE SPEICHERN ]', {
      fontSize: '16px',
      fill: '#fff3d8',
      fontFamily: UI_BODY_FONT,
      fontStyle: 'bold',
      backgroundColor: '#5a3d24',
      padding: { x: 12, y: 7 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(uiBaseDepth + 3);

    this.scoreSubmitStatusText = this.add.text(cx, cy + 142, 'Noch nicht gespeichert', {
      fontSize: '12px',
      fill: '#d7d0c4',
      fontFamily: UI_BODY_FONT
    }).setOrigin(0.5).setDepth(uiBaseDepth + 3);

    this.scoreSubmitButton.on('pointerover', () => this.scoreSubmitButton.setStyle({ fill: '#fff8e6', backgroundColor: '#6d4a2b' }));
    this.scoreSubmitButton.on('pointerout', () => this.scoreSubmitButton.setStyle({ fill: '#fff3d8', backgroundColor: '#5a3d24' }));
    this.scoreSubmitButton.on('pointerdown', () => {
      this.requestAndSubmitRun();
    });

    const topPanel = this.add.graphics();
    topPanel.fillStyle(UI_PANEL_BRASS, 0.96);
    topPanel.lineStyle(2, UI_BRASS, 0.9);
    topPanel.fillRect(topPanelLeft, cy - 170, 300, 340);
    topPanel.strokeRect(topPanelLeft, cy - 170, 300, 340);
    topPanel.fillStyle(UI_GLASS, 0.42);
    topPanel.fillRect(topPanelLeft + 10, cy - 160, 280, 320);
    topPanel.setDepth(uiBaseDepth + 1);

    this.topScoresTitleText = this.add.text(topPanelLeft + 150, cy - 152, 'TOP 20 (nach Upload)', {
      fontSize: '16px',
      fill: '#f1d09a',
      fontFamily: UI_TITLE_FONT,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(uiBaseDepth + 2);

    this.topScoresText = this.add.text(topPanelLeft + 14, cy - 130, 'Score speichern,\ndann wird die Top 20 geladen.', {
      fontSize: '10px',
      fill: '#d8d2c6',
      fontFamily: UI_BODY_FONT,
      lineSpacing: 1
    }).setOrigin(0, 0).setDepth(uiBaseDepth + 2);

    // Neustart-Button
    const btn = this.add.text(cx, cy + 182, '[ NOCHMAL ]', {
      fontSize: '20px',
      fill: '#fff3d8',
      fontFamily: UI_BODY_FONT,
      fontStyle: 'bold',
      backgroundColor: '#5a3d24',
      padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(uiBaseDepth + 3);

    btn.on('pointerover', () => btn.setStyle({ fill: '#fff8e6', backgroundColor: '#6d4a2b' }));
    btn.on('pointerout', () => btn.setStyle({ fill: '#fff3d8', backgroundColor: '#5a3d24' }));
    btn.on('pointerdown', () => this.scene.restart({ debugMode: this.debugMode }));
  }

  togglePause() {
    if (this.isPaused) {
      // Resume
      this.isPaused = false;
      if (this.pauseOverlay) {
        this.pauseOverlay.destroy();
        this.pauseOverlay = null;
      }
      if (this.pausePanel) {
        this.pausePanel.destroy();
        this.pausePanel = null;
      }
      if (this.pausePanelInner) {
        this.pausePanelInner.destroy();
        this.pausePanelInner = null;
      }
      if (this.pauseTextTitle) {
        this.pauseTextTitle.destroy();
        this.pauseTextTitle = null;
      }
      if (this.pauseTextHint) {
        this.pauseTextHint.destroy();
        this.pauseTextHint = null;
      }
      this.debugLog('▶️ Game resumed');
    } else {
      // Pause
      this.isPaused = true;
      this.showPauseScreen();
      this.debugLog('⏸ Game paused');
    }
  }

  showPauseScreen() {
    const width = this.scale.width;
    const height = this.scale.height;

    // Overlay mit dezentem Panel statt blankem Schwarz
    this.pauseOverlay = this.add.rectangle(width / 2, height / 2, width, height, UI_OVERLAY, 0.9);
    this.pauseOverlay.setOrigin(0.5);
    this.pauseOverlay.setDepth(9999);
    this.pauseOverlay.setInteractive();  // Klicks blockieren

    this.pausePanel = this.add.rectangle(width / 2, height / 2, 540, 220, UI_PANEL_BRASS, 0.96)
      .setOrigin(0.5)
      .setDepth(10000)
      .setStrokeStyle(3, UI_BRASS, 0.96);
    this.pausePanelInner = this.add.rectangle(width / 2, height / 2, 510, 188, UI_GLASS, 0.42)
      .setOrigin(0.5)
      .setDepth(10000)
      .setStrokeStyle(1, UI_BRASS_SOFT, 0.16);

    // "PAUSED" Text
    this.pauseTextTitle = this.add.text(width / 2, height / 2 - 60, 'PAUSED', {
      fontSize: '48px',
      fill: '#f3d289',
      fontFamily: UI_TITLE_FONT,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(10000);

    // Hinweis
    this.pauseTextHint = this.add.text(width / 2, height / 2 + 60, 'Drücke P oder LEERTASTE zum Fortfahren', {
      fontSize: '16px',
      fill: '#d8d2c6',
      fontFamily: UI_BODY_FONT
    }).setOrigin(0.5).setDepth(10000);
  }

  showLevel2Splash() {
    this.levelSplashVisible = true;

    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const overlay = this.add.rectangle(centerX, centerY, width, height, UI_OVERLAY, 0.85)
      .setDepth(11000)
      .setInteractive();

    const panelShadow = this.add.rectangle(centerX, centerY + 6, 932, 628, 0x000000, 0.28)
      .setDepth(11000);

    const panel = this.add.rectangle(centerX, centerY, 920, 620, UI_PANEL_BRASS, 0.96)
      .setStrokeStyle(3, UI_BRASS, 0.98)
      .setDepth(11001);

    const panelInner = this.add.rectangle(centerX, centerY, 892, 592, UI_GLASS, 0.42)
      .setStrokeStyle(1, UI_BRASS_SOFT, 0.16)
      .setDepth(11001);

    const panelTitleRule = this.add.rectangle(centerX, centerY - 230, 760, 1, UI_BRASS, 0.26)
      .setDepth(11002);

    const title = this.add.text(centerX, centerY - 255, 'NEUER TURM FREIGESCHALTET', {
      fontSize: '28px',
      fill: '#f3d289',
      fontFamily: UI_TITLE_FONT,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11002);

    const towerName = this.add.text(centerX, centerY - 215, 'FLAMMENWERFER', {
      fontSize: '36px',
      fill: '#ef8f62',
      fontFamily: UI_TITLE_FONT,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11002);

    const image = this.add.image(centerX, centerY - 25, 'flamethrower-intro')
      .setDepth(11002)
      .setDisplaySize(360, 260);

    const desc = this.add.text(centerX, centerY + 165,
      'Kurze Reichweite, aber brutaler Dauerschaden.\n' +
      'Trifft ein Ziel kontinuierlich mit dem Beam\n' +
      'und hinterlässt Nachbrennen (DoT), wenn es entkommt.', {
      fontSize: '18px',
      fill: '#e7dfd2',
      fontFamily: UI_BODY_FONT,
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5).setDepth(11002);

    const hintPlate = this.add.rectangle(centerX, centerY + 262, 530, 34, UI_PANEL_BRASS, 0.9)
      .setStrokeStyle(1, UI_BRASS, 0.4)
      .setDepth(11002);
    const hint = this.add.text(centerX, centerY + 260, '[ LEERTASTE oder KLICK zum Fortfahren | Taste 3 = Flammenwerfer ]', {
      fontSize: '14px',
      fill: '#f0e4cf',
      fontFamily: UI_BODY_FONT,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11002);

    overlay.on('pointerdown', () => this.closeLevelSplash(true));

    this.levelSplashElements = [overlay, panelShadow, panel, panelInner, panelTitleRule, title, towerName, image, desc, hintPlate, hint];
  }

  showLevel3Splash() {
    this.levelSplashVisible = true;

    const width = this.scale.width;
    const height = this.scale.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const overlay = this.add.rectangle(centerX, centerY, width, height, UI_OVERLAY, 0.85)
      .setDepth(11000)
      .setInteractive();

    const panelShadow = this.add.rectangle(centerX, centerY + 6, 932, 628, 0x000000, 0.28)
      .setDepth(11000);

    const panel = this.add.rectangle(centerX, centerY, 920, 620, UI_PANEL_BRASS, 0.96)
      .setStrokeStyle(3, UI_BRASS, 0.98)
      .setDepth(11001);

    const panelInner = this.add.rectangle(centerX, centerY, 892, 592, UI_GLASS, 0.42)
      .setStrokeStyle(1, UI_BRASS_SOFT, 0.16)
      .setDepth(11001);

    const panelTitleRule = this.add.rectangle(centerX, centerY - 230, 760, 1, UI_BRASS, 0.26)
      .setDepth(11002);

    const title = this.add.text(centerX, centerY - 255, 'NEUER TURM FREIGESCHALTET', {
      fontSize: '28px',
      fill: '#f3d289',
      fontFamily: UI_TITLE_FONT,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11002);

    const towerName = this.add.text(centerX, centerY - 215, 'TESLA-TURM', {
      fontSize: '36px',
      fill: '#c7d9ef',
      fontFamily: UI_TITLE_FONT,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11002);

    const image = this.add.image(centerX, centerY - 25, 'tesla-intro')
      .setDepth(11002)
      .setDisplaySize(360, 260);

    const desc = this.add.text(centerX, centerY + 165,
      'Elektrischer Kettenangriff fuer Gruppen.\n' +
      'Trifft das Hauptziel und springt danach\n' +
      'auf weitere Gegner in Reichweite ueber.', {
      fontSize: '18px',
      fill: '#e7dfd2',
      fontFamily: UI_BODY_FONT,
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5).setDepth(11002);

    const hintPlate = this.add.rectangle(centerX, centerY + 262, 480, 34, UI_PANEL_BRASS, 0.9)
      .setStrokeStyle(1, UI_BRASS, 0.4)
      .setDepth(11002);
    const hint = this.add.text(centerX, centerY + 260, '[ LEERTASTE oder KLICK zum Fortfahren | Taste 4 = Tesla ]', {
      fontSize: '14px',
      fill: '#f0e4cf',
      fontFamily: UI_BODY_FONT,
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(11002);

    overlay.on('pointerdown', () => this.closeLevelSplash(true));

    this.levelSplashElements = [overlay, panelShadow, panel, panelInner, panelTitleRule, title, towerName, image, desc, hintPlate, hint];
  }

  closeLevelSplash(fromPointer = false) {
    if (!this.levelSplashVisible) {
      return;
    }

    this.levelSplashVisible = false;
    for (const element of this.levelSplashElements) {
      if (element && element.destroy) {
        element.destroy();
      }
    }
    this.levelSplashElements = [];

    if (fromPointer) {
      this.consumeNextPointerDown = true;
    }
  }

}
