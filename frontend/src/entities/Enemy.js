/**
 * Enemy Entity
 * 
 * Repräsentiert einen Gegner, der entlang eines Pfads läuft
 */

import { ENEMY_TYPES, DEFAULT_ENEMY_TYPE } from '../config/enemies.js';

export class Enemy {
  constructor(scene, path, config = {}) {
    this.scene = scene;
    this.path = path;
    this.pathIndex = 0; // Welcher Waypoint wir gerade ansteuern
    this.distanceAlongSegment = 0; // Wie weit entlang des aktuellen Segments (0 bis 1)
    
    // Gegner-Typ laden
    const typeKey = config.type || DEFAULT_ENEMY_TYPE;
    const enemyTypeConfig = ENEMY_TYPES[typeKey] || ENEMY_TYPES[DEFAULT_ENEMY_TYPE];
    
    // Level-Skalierung für Stärke (HP) berechnen (z.B. Level 2 = 1.6x HP)
    const healthScaleFactor = 1 + (scene.currentLevel.levelNumber - 1) * 0.6;

    // Wellen-Skalierung: Jede Welle wird spürbar stärker als die vorherige.
    // currentWaveIndex ist 0-basiert, daher Welle 1 = 1.00x, Welle 2 = 1.14x, ...
    const waveScaleFactor = 1 + (scene.currentWaveIndex || 0) * 0.14;
    const combinedHealthScale = healthScaleFactor * waveScaleFactor;
    
    // Gegner-Parameter: Speed bleibt konstant, HP skaliert nach Level und Welle nach oben
    this.speed = config.speed || enemyTypeConfig.speed;
    this.type = typeKey;
    this.maxHealth = config.maxHealth || Math.round(enemyTypeConfig.maxHealth * combinedHealthScale);
    this.health = this.maxHealth;
    this.reward = enemyTypeConfig.reward; // Gold-Reward wird NICHT skaliert (bleibt knapp)
    this.width = 20;
    this.height = 20;
    
    // Visuals
    this.graphics = scene.make.graphics({ add: true });
    this.healthBarGraphics = scene.make.graphics({ add: true });
    
    // Position initialisieren
    const startPoint = path[0];
    this.x = startPoint.x;
    this.y = startPoint.y;
    
    this.isAlive = true;
    this.reachedEnd = false;
    this.dotEffects = [];
    this.debugId = (scene.nextEnemyDebugId = (scene.nextEnemyDebugId || 0) + 1);
  }

  update(deltaTime) {
    if (!this.isAlive || this.reachedEnd) {
      return;
    }

    this.updateDoTEffects(deltaTime);
    if (!this.isAlive) {
      return;
    }

    // Bewegung in Pixel pro Frame berechnen
    const pixelsToMove = (this.speed * deltaTime) / 1000; // deltaTime in ms
    
    let remainingDistance = pixelsToMove;

    // Solange wir Strecke haben, bewegen wir uns
    while (remainingDistance > 0 && this.pathIndex < this.path.length - 1) {
      const currentPoint = this.path[this.pathIndex];
      const nextPoint = this.path[this.pathIndex + 1];

      // Entfernung zum nächsten Waypoint
      const dx = nextPoint.x - currentPoint.x;
      const dy = nextPoint.y - currentPoint.y;
      const distanceToNext = Math.sqrt(dx * dx + dy * dy);

      // Verbleibende Strecke in diesem Segment
      const distanceInSegment = distanceToNext * (1 - this.distanceAlongSegment);

      if (remainingDistance <= distanceInSegment) {
        // Wir bleiben in diesem Segment
        this.distanceAlongSegment += remainingDistance / distanceToNext;
        remainingDistance = 0;
      } else {
        // Wir gehen zum nächsten Segment
        remainingDistance -= distanceInSegment;
        this.pathIndex++;
        this.distanceAlongSegment = 0;
      }
    }

    // Position aktualisieren basierend auf Pfad
    if (this.pathIndex < this.path.length - 1) {
      const currentPoint = this.path[this.pathIndex];
      const nextPoint = this.path[this.pathIndex + 1];
      
      this.x = currentPoint.x + (nextPoint.x - currentPoint.x) * this.distanceAlongSegment;
      this.y = currentPoint.y + (nextPoint.y - currentPoint.y) * this.distanceAlongSegment;
    } else {
      // Gegner hat das Ende erreicht
      this.reachedEnd = true;
      this.x = this.path[this.path.length - 1].x;
      this.y = this.path[this.path.length - 1].y;
    }
  }

  draw() {
    if (!this.isAlive) {
      return;
    }

    // Gegner als Rechteck zeichnen
    this.graphics.clear();
    
    // Farbe basierend auf Typ
    let color = 0x00ff00; // Normal: Green
    if (this.type === 'fast') color = 0xff6600;
    if (this.type === 'armored') color = 0xffff00;

    // DoT-Brand-Effekt: Gegner flackern orange/rot solange Burn aktiv ist
    const isBurning = this.dotEffects.length > 0;

    const radius = this.width / 2;

    this.graphics.fillStyle(color, 1);
    this.graphics.fillCircle(this.x, this.y, radius);

    // Outline
    this.graphics.lineStyle(2, 0xffffff);
    this.graphics.strokeCircle(this.x, this.y, radius);

    if (isBurning) {
      const flicker = Math.floor(this.scene.time.now / 120) % 2 === 0;
      this.graphics.lineStyle(2, 0xff2200, flicker ? 0.95 : 0.35);
      this.graphics.strokeCircle(this.x, this.y, radius + 1);
    }

    // Health-Bar zeichnen (über dem Gegner)
    this.healthBarGraphics.clear();
    
    const BAR_WIDTH = this.width;
    const BAR_HEIGHT = 3;
    const BAR_Y = this.y - this.height / 2 - 8; // 8px über dem Gegner
    
    // Hintergrund (dunkelgrau)
    this.healthBarGraphics.fillStyle(0x333333, 1);
    this.healthBarGraphics.fillRect(
      this.x - BAR_WIDTH / 2,
      BAR_Y,
      BAR_WIDTH,
      BAR_HEIGHT
    );

    // Health-Prozentsatz berechnen
    const healthPercent = this.health / this.maxHealth;
    const healthBarWidth = BAR_WIDTH * healthPercent;

    // Farbe basierend auf Health-Prozentsatz
    let barColor = 0x00ff00; // Grün (> 60%)
    if (healthPercent <= 0.6) barColor = 0xffff00; // Gelb (≤ 60%)
    if (healthPercent <= 0.3) barColor = 0xff4444; // Rot (≤ 30%)

    // Health-Bar zeichnen
    this.healthBarGraphics.fillStyle(barColor, 1);
    this.healthBarGraphics.fillRect(
      this.x - BAR_WIDTH / 2,
      BAR_Y,
      healthBarWidth,
      BAR_HEIGHT
    );

    // Outline der Health-Bar
    this.healthBarGraphics.lineStyle(1, 0xffffff, 0.5);
    this.healthBarGraphics.strokeRect(
      this.x - BAR_WIDTH / 2,
      BAR_Y,
      BAR_WIDTH,
      BAR_HEIGHT
    );
  }

  takeDamage(amount, context = {}) {
    if (!this.isAlive || this.reachedEnd) {
      return;
    }

    const rawAmount = Number.isFinite(amount) ? amount : 0;
    const appliedDamage = Math.max(0, Math.round(rawAmount));
    if (appliedDamage <= 0) {
      return;
    }

    const beforeHp = this.health;
    this.health = Math.max(0, this.health - appliedDamage);
    const afterHp = this.health;

    const scene = this.scene;
    const elapsedRealMs = Math.floor(performance.now() - (scene.waveStartRealMs || scene.levelStartRealMs || performance.now()));
    const elapsedGameMs = Math.floor((scene.levelElapsedGameMs || 0) - (scene.waveStartGameMs || 0));
    const hitX = Number.isFinite(context.hitX) ? context.hitX : this.x;
    const hitY = Number.isFinite(context.hitY) ? context.hitY : this.y;
    const source = context.source || 'unknown';

    scene.debugLog(
      `[COMBAT tRealWave=${elapsedRealMs}ms tGameWave=${elapsedGameMs}ms] HIT enemy#${this.debugId} ${this.type} dmg=${appliedDamage} hp=${beforeHp}->${afterHp} at=(${Math.round(hitX)},${Math.round(hitY)}) src=${source} speed=${scene.gameSpeedMultiplier}x`
    );

    if (this.health <= 0) {
      this.isAlive = false;
      scene.debugLog(
        `[COMBAT tRealWave=${elapsedRealMs}ms tGameWave=${elapsedGameMs}ms] DEATH enemy#${this.debugId} ${this.type} at=(${Math.round(this.x)},${Math.round(this.y)}) src=${source} speed=${scene.gameSpeedMultiplier}x`
      );
    }
  }

  applyDoT(damagePerTick, durationMs, tickIntervalMs) {
    if (!this.isAlive || this.reachedEnd) {
      return;
    }

    // Armored Gegner sind robuster gegen Nachbrennen
    const adjustedDamagePerTick = this.type === 'armored'
      ? Math.max(1, Math.round(damagePerTick * 0.5))
      : damagePerTick;

    this.dotEffects.push({
      damagePerTick: adjustedDamagePerTick,
      remainingMs: durationMs,
      tickIntervalMs,
      tickTimerMs: tickIntervalMs
    });
  }

  updateDoTEffects(deltaTime) {
    if (!this.dotEffects.length) {
      return;
    }

    for (let i = this.dotEffects.length - 1; i >= 0; i--) {
      const effect = this.dotEffects[i];
      effect.remainingMs -= deltaTime;
      effect.tickTimerMs -= deltaTime;

      while (effect.tickTimerMs <= 0 && effect.remainingMs > 0 && this.isAlive) {
        this.takeDamage(effect.damagePerTick, {
          source: 'dot',
          hitX: this.x,
          hitY: this.y
        });
        effect.tickTimerMs += effect.tickIntervalMs;
      }

      if (effect.remainingMs <= 0 || !this.isAlive) {
        this.dotEffects.splice(i, 1);
      }
    }
  }

  destroy() {
    if (this.graphics) {
      this.graphics.destroy();
    }
    if (this.healthBarGraphics) {
      this.healthBarGraphics.destroy();
    }
  }
}
