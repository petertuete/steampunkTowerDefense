/**
 * Projectile Entity
 *
 * Repräsentiert ein fliegendes Projektil, das von Türmen geschossen wird.
 * Unterstützt Single-Target, AoE, DoT und Chain-Hits.
 */

export class Projectile {
  constructor(scene, startX, startY, targetEnemy, damage, speed, options = {}) {
    this.scene = scene;
    this.x = startX;
    this.y = startY;
    this.targetEnemy = targetEnemy;
    this.damage = damage;
    this.speed = speed;
    this.radius = 4;

    this.isAoE = options.isAoE || false;
    this.splashRadius = options.splashRadius || 0;
    this.splashDamageMultiplier = options.splashDamageMultiplier || 0;

    this.isDoT = options.isDoT || false;
    this.dotDurationMs = options.dotDurationMs || 0;
    this.dotTickIntervalMs = options.dotTickIntervalMs || 0;
    this.dotDamageMultiplier = options.dotDamageMultiplier || 0;

    this.isChain = options.isChain || false;
    this.chainCount = options.chainCount || 0;
    this.chainRange = options.chainRange || 0;
    this.chainDamageMultiplier = options.chainDamageMultiplier || 0;

    this.graphics = scene.make.graphics({ add: true });
    this.isActive = true;
  }

  update(deltaTime) {
    if (!this.isActive) {
      return;
    }

    if (!this.targetEnemy || !this.targetEnemy.isAlive || this.targetEnemy.reachedEnd) {
      this.isActive = false;
      return;
    }

    const dx = this.targetEnemy.x - this.x;
    const dy = this.targetEnemy.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const pixelsToMove = (this.speed * deltaTime) / 1000;

    if (distance <= pixelsToMove) {
      this.onHit();
      this.isActive = false;
    } else {
      this.x += (dx / distance) * pixelsToMove;
      this.y += (dy / distance) * pixelsToMove;
    }
  }

  onHit() {
    if (!this.targetEnemy || !this.targetEnemy.isAlive) {
      return;
    }

    if (this.isAoE) {
      this.applyAoEHit();
      return;
    }

    if (this.isChain) {
      this.applyChainHit();
      return;
    }

    if (this.isDoT) {
      this.applyDoTHit();
      return;
    }

    this.targetEnemy.takeDamage(this.damage);
  }

  applyAoEHit() {
    const impactX = this.targetEnemy.x;
    const impactY = this.targetEnemy.y;

    if (this.scene.enemies) {
      for (const enemy of this.scene.enemies) {
        if (!enemy.isAlive || enemy.reachedEnd) {
          continue;
        }

        const dx = enemy.x - impactX;
        const dy = enemy.y - impactY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= this.splashRadius) {
          const appliedDamage = enemy === this.targetEnemy
            ? this.damage
            : Math.round(this.damage * this.splashDamageMultiplier);
          enemy.takeDamage(appliedDamage);
        }
      }
    }

    this.showSplashEffect(impactX, impactY);
  }

  applyDoTHit() {
    this.targetEnemy.takeDamage(this.damage);

    const dotDamagePerTick = Math.max(1, Math.round(this.damage * this.dotDamageMultiplier));
    if (this.targetEnemy.applyDoT) {
      this.targetEnemy.applyDoT(dotDamagePerTick, this.dotDurationMs, this.dotTickIntervalMs);
    }
  }

  applyChainHit() {
    const hitEnemies = [this.targetEnemy];
    this.targetEnemy.takeDamage(this.damage);

    let currentSource = this.targetEnemy;
    let chainDamage = this.damage;

    for (let hop = 0; hop < this.chainCount; hop++) {
      chainDamage = Math.max(1, Math.round(chainDamage * this.chainDamageMultiplier));
      const nextTarget = this.findNextChainTarget(currentSource, hitEnemies);
      if (!nextTarget) {
        break;
      }

      nextTarget.takeDamage(chainDamage);
      hitEnemies.push(nextTarget);
      this.showChainEffect(currentSource, nextTarget);
      currentSource = nextTarget;
    }
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
    chainGraphics.lineStyle(2, 0x66ccff, 0.9);
    chainGraphics.beginPath();
    chainGraphics.moveTo(fromEnemy.x, fromEnemy.y);
    chainGraphics.lineTo(toEnemy.x, toEnemy.y);
    chainGraphics.strokePath();

    this.scene.time.delayedCall(80, () => {
      chainGraphics.destroy();
    });
  }

  showSplashEffect(x, y) {
    const splashGraphics = this.scene.make.graphics({ add: true });
    splashGraphics.fillStyle(0xffaa00, 0.18);
    splashGraphics.fillCircle(x, y, this.splashRadius);
    splashGraphics.lineStyle(2, 0xff6600, 0.8);
    splashGraphics.strokeCircle(x, y, this.splashRadius);

    this.scene.time.delayedCall(120, () => {
      splashGraphics.destroy();
    });
  }

  draw() {
    if (!this.isActive) {
      return;
    }

    this.graphics.clear();
    this.graphics.fillStyle(0xffaa00, 1);
    this.graphics.fillCircle(this.x, this.y, this.radius);
    this.graphics.lineStyle(1, 0xffff00, 0.8);
    this.graphics.strokeCircle(this.x, this.y, this.radius);
  }

  destroy() {
    if (this.graphics) {
      this.graphics.destroy();
    }
  }
}
