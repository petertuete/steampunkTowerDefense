/**
 * Tower Entity
 * 
 * Repräsentiert einen Turm auf dem Spielfeld
 * 
 * TODO:
 * - Upgrade-System
 * - Buff-Effekte für Generator
 */

import { Projectile } from './Projectile.js';

export class Tower {
  constructor(scene, x, y, towerType, config = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.type = towerType;
    this.config = config;
    
    // Stats aus Config
    this.name = towerType.name;
    this.range = towerType.range;
    this.damage = towerType.damage;
    this.fireRate = towerType.fireRate;
    this.color = towerType.color;
    this.isAoE = towerType.isAoE || false;
    this.splashRadius = towerType.splashRadius || 0;
    this.splashDamageMultiplier = towerType.splashDamageMultiplier || 0;
    this.isDoT = towerType.isDoT || false;
    this.dotDurationMs = towerType.dotDurationMs || 0;
    this.dotTickIntervalMs = towerType.dotTickIntervalMs || 0;
    this.dotDamageMultiplier = towerType.dotDamageMultiplier || 0;
    this.isChain = towerType.isChain || false;
    this.chainCount = towerType.chainCount || 0;
    this.chainRange = towerType.chainRange || 0;
    this.chainDamageMultiplier = towerType.chainDamageMultiplier || 0;
    this.shotFlashMsRemaining = 0;
    this.shotFlashColor = 0xffffff;
    this.shotFlashWidth = 4;
    this.shotFlashFullLength = false;
    this.isFlamethrowerFiring = false;
    this.flamethrowerDamageCarry = 0;
    
    // Zustand
    this.level = 0; // 0 = Basis, 1-3 upgragegrad, 4 = Ult
    this.timeSinceLastShot = 0;
    this.width = 40; // Vollständiges Feld (Grid-Größe)
    this.height = 40;
    this.currentTarget = null;
    this.isGenerator = towerType.isBuff || false;
    this.buffMultiplier = 1.0; // Wird aktualisiert basierend auf Generator-Nähe
    this.isDestroyed = false;
    
    // Visuals
    this.graphics = scene.make.graphics({ add: true });
    
    // Damage-Label auf dem Turm (Generators zeigen "B" für Buff)
    const labelText = this.isGenerator ? 'B' : `${this.damage}d`;
    this.damageLabel = scene.add.text(x, y, labelText, {
      fontSize: '11px',
      fill: '#ffff00',
      fontFamily: 'Courier',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(100);
    
    // Debug: Range-Anzeige
    this.rangeGraphics = scene.make.graphics({ add: true });
    this.targetLineGraphics = scene.make.graphics({ add: true });
  }

  update(deltaTime, enemies = []) {
    if (this.shotFlashMsRemaining > 0) {
      this.shotFlashMsRemaining = Math.max(0, this.shotFlashMsRemaining - deltaTime);
    }
    this.isFlamethrowerFiring = false;

    if (!this.isGenerator) {
      this.updateTarget(enemies);
    } else {
      this.currentTarget = null;
    }

    // Buff von Generatoren berechnen
    this.calculateBuffMultiplier();

    // Flammwerfer: kontinuierlicher Schaden solange Ziel im Radius ist
    if (this.isDoT && this.isValidTarget(this.currentTarget) && this.isEnemyInRange(this.currentTarget)) {
      this.applyFlamethrowerBeamDamage(deltaTime, this.currentTarget);
      this.isFlamethrowerFiring = true;
    } else if (this.isDoT) {
      this.flamethrowerDamageCarry = 0;
    }

    // Visuals updaten
    this.draw();
    
    if (this.fireRate > 0 && !this.isDoT) {
      this.timeSinceLastShot += deltaTime / 1000; // In Sekunden konvertieren

      const shotInterval = 1 / this.fireRate;
      if (this.timeSinceLastShot >= shotInterval && this.isValidTarget(this.currentTarget)) {
        this.shoot(this.currentTarget);
        this.timeSinceLastShot = 0;
      }
    }
  }

  updateTarget(enemies) {
    const previousTarget = this.currentTarget;
    const previousTargetWasValid = this.isValidTarget(previousTarget);
    const previousTargetInRange = this.isEnemyInRange(previousTarget);

    // Aktuelles Ziel behalten, solange es noch gültig und in Reichweite ist
    if (previousTargetWasValid && previousTargetInRange) {
      return;
    }

    // Flammwerfer-Nachbrennen: Nur wenn das Ziel den Radius verlässt
    if (this.isDoT && previousTargetWasValid && !previousTargetInRange) {
      this.applyFlamethrowerAfterburn(previousTarget);
    }

    const targetsInRange = this.findTargets(enemies);
    if (targetsInRange.length === 0) {
      this.currentTarget = null;
      return;
    }

    // "First"-Targeting: Gegner mit größtem Pfad-Fortschritt priorisieren
    this.currentTarget = targetsInRange.reduce((best, enemy) => {
      if (!best) return enemy;
      return this.getEnemyProgress(enemy) > this.getEnemyProgress(best) ? enemy : best;
    }, null);
  }

  isValidTarget(enemy) {
    return !!enemy && enemy.isAlive && !enemy.reachedEnd;
  }

  isEnemyInRange(enemy) {
    if (!this.isValidTarget(enemy)) {
      return false;
    }

    const dx = enemy.x - this.x;
    const dy = enemy.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= this.range;
  }

  getEnemyProgress(enemy) {
    // Höherer Wert bedeutet weiter Richtung Ausgang/Zielfeld
    return enemy.pathIndex + enemy.distanceAlongSegment;
  }

  draw() {
    // Reichweite: Generator grün, Tesla blau, sonst orange
    const rangeColor = this.isGenerator ? 0x00ff00 : (this.isChain ? 0x3399ff : 0xff6600);

    this.rangeGraphics.clear();
    this.rangeGraphics.fillStyle(rangeColor, 0.1);
    this.rangeGraphics.fillCircle(this.x, this.y, this.range);
    this.rangeGraphics.lineStyle(1, rangeColor, 0.5);
    this.rangeGraphics.strokeCircle(this.x, this.y, this.range);

    // Aktuelles Ziel visuell markieren
    this.targetLineGraphics.clear();
    if (!this.isGenerator && this.isValidTarget(this.currentTarget)) {
      const lineColor = 0xffaa00;
      const isFlashActive = this.shotFlashMsRemaining > 0;
      const isBeamActive = this.isDoT && this.isFlamethrowerFiring;
      const lineWidth = isBeamActive ? 6 : (isFlashActive ? this.shotFlashWidth : 2);
      const lineAlpha = isBeamActive ? 0.95 : (isFlashActive ? 1 : 0.9);
      const activeColor = isBeamActive ? 0xff3333 : (isFlashActive ? this.shotFlashColor : lineColor);
      const dx = this.currentTarget.x - this.x;
      const dy = this.currentTarget.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const lineLength = (isBeamActive || (isFlashActive && this.shotFlashFullLength)) ? distance : 40;
      const endX = distance > 0 ? this.x + (dx / distance) * lineLength : this.x;
      const endY = distance > 0 ? this.y + (dy / distance) * lineLength : this.y;

      this.targetLineGraphics.lineStyle(lineWidth, activeColor, lineAlpha);
      this.targetLineGraphics.beginPath();
      this.targetLineGraphics.moveTo(this.x, this.y);
      this.targetLineGraphics.lineTo(endX, endY);
      this.targetLineGraphics.strokePath();
    }

    // Turm zeichnen (Rechteck)
    this.graphics.clear();
    this.graphics.fillStyle(this.color, 1);
    this.graphics.fillRect(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    );

    // Outline
    this.graphics.lineStyle(2, 0xffffff);
    this.graphics.strokeRect(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    );

    // Level-Text
    if (this.level > 0) {
      this.graphics.fillStyle(0xffff00, 1);
      this.graphics.fillText(`L${this.level}`, this.x - 8, this.y);
    }

    // Damage-Label aktualisieren (mit Buff-Anzeige)
    if (this.damageLabel) {
      if (this.isGenerator) {
        this.damageLabel.setText('B');
      } else {
        const buffedDamage = Math.round(this.damage * this.buffMultiplier);
        if (this.buffMultiplier > 1.0) {
          // Mit Buff: Zeige original→gepuffert
          this.damageLabel.setText(`${this.damage}→${buffedDamage}d`);
          this.damageLabel.setStyle({ fill: '#00ff00' }); // Grün für Buff
        } else {
          // Kein Buff
          this.damageLabel.setText(`${this.damage}d`);
          this.damageLabel.setStyle({ fill: '#ffff00' }); // Normal gelb
        }
      }
    }
  }

  findTargets(enemies) {
    // Alle Gegner in Reichweite filtern
    return enemies.filter(enemy => {
      if (!enemy.isAlive || enemy.reachedEnd) return false;
      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= this.range;
    });
  }

  calculateBuffMultiplier() {
    // Generator-Buff berechnen (nicht für Generatoren selbst)
    if (this.isGenerator) {
      this.buffMultiplier = 1.0;
      return;
    }

    const GENERATOR_BUFF_RANGE = 150;
    const BUFF_AMOUNT = 0.15; // +15% Damage, nicht stapelbar

    let hasNearbyGenerator = false;
    if (this.scene.towers) {
      for (const tower of this.scene.towers) {
        if (tower.isGenerator) {
          const dx = tower.x - this.x;
          const dy = tower.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance <= GENERATOR_BUFF_RANGE) {
            hasNearbyGenerator = true;
            break;
          }
        }
      }
    }

    this.buffMultiplier = hasNearbyGenerator ? (1.0 + BUFF_AMOUNT) : 1.0;
  }

  shoot(target) {
    if (!this.isValidTarget(target)) {
      return;
    }
    
    // Damage mit Buff-Multiplikator berechnen
    const buffedDamage = Math.round(this.damage * this.buffMultiplier);

    // Tesla: Kein Projektil, stattdessen Instant-Blitz + Linien-Flash
    if (this.isChain) {
      const shouldFlashPrimary = this.fireChainLightning(target, buffedDamage);
      if (shouldFlashPrimary) {
        this.setShotFlash(100, 0x66ccff, 4, true);
      }
      return;
    }

    // Projektil-Geschwindigkeit (schneller als Gegner)
    const projectileSpeed = 300;
    
    const projectile = new Projectile(
      this.scene,
      this.x,
      this.y,
      target,
      buffedDamage,
      projectileSpeed,
      {
        sourceTower: this,
        isAoE: this.isAoE,
        splashRadius: this.splashRadius,
        splashDamageMultiplier: this.splashDamageMultiplier,
        isDoT: this.isDoT,
        dotDurationMs: this.dotDurationMs,
        dotTickIntervalMs: this.dotTickIntervalMs,
        dotDamageMultiplier: this.dotDamageMultiplier,
        isChain: this.isChain,
        chainCount: this.chainCount,
        chainRange: this.chainRange,
        chainDamageMultiplier: this.chainDamageMultiplier
      }
    );
    
    // Zur Scene's Projektil-Liste hinzufügen
    if (!this.scene.projectiles) {
      this.scene.projectiles = [];
    }
    this.scene.projectiles.push(projectile);
  }

  setShotFlash(durationMs, color, width, fullLength) {
    this.shotFlashMsRemaining = durationMs;
    this.shotFlashColor = color;
    this.shotFlashWidth = width;
    this.shotFlashFullLength = fullLength;
  }

  applyFlamethrowerBeamDamage(deltaTime, target) {
    const buffedDamage = Math.round(this.damage * this.buffMultiplier);
    const damageThisFrame = (buffedDamage * deltaTime) / 1000;
    const totalDamage = damageThisFrame + this.flamethrowerDamageCarry;
    const wholeDamage = Math.floor(totalDamage);
    this.flamethrowerDamageCarry = totalDamage - wholeDamage;

    if (wholeDamage > 0 && this.isValidTarget(target) && this.isEnemyInRange(target)) {
      target.takeDamage(wholeDamage, {
        source: 'flamethrower-beam',
        hitX: target.x,
        hitY: target.y,
        towerX: this.x,
        towerY: this.y,
        towerName: this.name
      });
    }
  }

  applyFlamethrowerAfterburn(target) {
    if (!this.isValidTarget(target)) {
      return;
    }

    const now = this.scene?.time?.now || 0;
    const AFTERBURN_COOLDOWN_MS = 2500;
    const lastAfterburnAt = target.lastAfterburnAtMs || 0;
    if (now - lastAfterburnAt < AFTERBURN_COOLDOWN_MS) {
      return;
    }
    target.lastAfterburnAtMs = now;

    const buffedDamage = Math.round(this.damage * this.buffMultiplier);
    const dotDamagePerTick = Math.max(1, Math.round(buffedDamage * this.dotDamageMultiplier));
    if (target.applyDoT) {
      target.applyDoT(dotDamagePerTick, this.dotDurationMs, this.dotTickIntervalMs);
    }
  }

  fireChainLightning(primaryTarget, baseDamage) {
    const hitEnemies = [primaryTarget];
    primaryTarget.takeDamage(baseDamage, {
      source: 'tesla-primary',
      hitX: primaryTarget.x,
      hitY: primaryTarget.y,
      towerX: this.x,
      towerY: this.y,
      towerName: this.name
    });

    // Primärblitz nur zeigen/fortsetzen, wenn Primärziel den Treffer überlebt.
    if (!primaryTarget.isAlive) {
      return false;
    }

    let currentSource = primaryTarget;
    let chainDamage = baseDamage;

    for (let hop = 0; hop < this.chainCount; hop++) {
      chainDamage = Math.max(1, Math.round(chainDamage * this.chainDamageMultiplier));
      const nextTarget = this.findNextChainTarget(currentSource, hitEnemies);
      if (!nextTarget) {
        break;
      }

      nextTarget.takeDamage(chainDamage, {
        source: `tesla-hop-${hop + 1}`,
        hitX: nextTarget.x,
        hitY: nextTarget.y,
        fromX: currentSource.x,
        fromY: currentSource.y,
        towerX: this.x,
        towerY: this.y,
        towerName: this.name
      });
      hitEnemies.push(nextTarget);
      // Kein Blitz auf bereits besiegte Ziele zeichnen
      if (currentSource.isAlive && nextTarget.isAlive) {
        this.showChainEffect(currentSource, nextTarget);
      }
      currentSource = nextTarget;
    }

    return true;
  }

  findNextChainTarget(sourceEnemy, alreadyHit) {
    if (!this.scene.enemies) {
      return null;
    }

    let closest = null;
    let closestDistance = Infinity;

    for (const enemy of this.scene.enemies) {
      if (!enemy.isAlive || enemy.reachedEnd || alreadyHit.includes(enemy)) {
        continue;
      }

      const dx = enemy.x - sourceEnemy.x;
      const dy = enemy.y - sourceEnemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= this.chainRange && distance < closestDistance) {
        closest = enemy;
        closestDistance = distance;
      }
    }

    return closest;
  }

  showChainEffect(fromEnemy, toEnemy) {
    const chainGraphics = this.scene.make.graphics({ add: true });
    chainGraphics.lineStyle(2, 0x66ccff, 0.95);
    chainGraphics.beginPath();
    chainGraphics.moveTo(fromEnemy.x, fromEnemy.y);
    chainGraphics.lineTo(toEnemy.x, toEnemy.y);
    chainGraphics.strokePath();

    this.scene.time.delayedCall(80, () => {
      chainGraphics.destroy();
    });
  }

  destroy() {
    if (this.isDestroyed) {
      return;
    }
    this.isDestroyed = true;

    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = null;
    }
    if (this.rangeGraphics) {
      this.rangeGraphics.destroy();
      this.rangeGraphics = null;
    }
    if (this.targetLineGraphics) {
      this.targetLineGraphics.destroy();
      this.targetLineGraphics = null;
    }
    if (this.damageLabel) {
      this.damageLabel.destroy();
      this.damageLabel = null;
    }

    this.currentTarget = null;
  }
}
