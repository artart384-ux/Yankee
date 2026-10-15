import Phaser from 'phaser';
import { DamageType, StatusEffectType } from '../types/game';
import { Enemy } from '../entities/Enemy';
import { CombatSystem } from './CombatSystem';
import { WorldScene } from '../scenes/WorldScene';

export interface ProjectileOptions {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  range: number;
  damage: number;
  damageType: DamageType;
  projectileType: 'SLING_BALL' | 'PIERCE_BOLT' | 'MOLOTOV' | 'TONIC_BOTTLE' | 'SONIC_WAVE' | 'CALTROPS' | 'CHAIN_WHIP';
  statusEffect?: StatusEffectType;
  pierceCount?: number;
  isAoE?: boolean;
  aoeRadius?: number;
  isGroundTrap?: boolean;
  trapDuration?: number;
}

export class ProjectileManager {
  private scene: WorldScene;
  private projectiles: Array<{
    sprite: Phaser.GameObjects.Graphics | Phaser.GameObjects.Image;
    vx: number;
    vy: number;
    startX: number;
    startY: number;
    currentRange: number;
    maxRange: number;
    damage: number;
    damageType: DamageType;
    projectileType: string;
    statusEffect?: StatusEffectType;
    pierceRemaining: number;
    hitEnemies: Set<Enemy>;
    isGroundTrap?: boolean;
    trapTimer?: number;
    isAoE?: boolean;
    aoeRadius?: number;
  }> = [];

  constructor(scene: WorldScene) {
    this.scene = scene;
  }

  public fire(options: ProjectileOptions) {
    const angle = Phaser.Math.Angle.Between(options.x, options.y, options.targetX, options.targetY);
    const vx = Math.cos(angle) * options.speed;
    const vy = Math.sin(angle) * options.speed;

    let sprite: Phaser.GameObjects.Graphics | Phaser.GameObjects.Image;

    if (options.projectileType === 'SLING_BALL') {
      // Small silver metallic steel ball with motion glow
      const g = this.scene.add.graphics();
      g.fillStyle(0x05d9e8, 0.4);
      g.fillCircle(0, 0, 8);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(0, 0, 4);
      g.setPosition(options.x, options.y);
      g.setDepth(options.y + 10);
      sprite = g;
    } else if (options.projectileType === 'PIERCE_BOLT') {
      // High-speed crossbow bolt with sharp neon trail
      const g = this.scene.add.graphics();
      g.fillStyle(0xff2a6d, 1);
      g.fillRect(-10, -2, 20, 4);
      g.fillStyle(0xffffff, 1);
      g.fillTriangle(10, -4, 16, 0, 10, 4);
      g.setPosition(options.x, options.y);
      g.setRotation(angle);
      g.setDepth(options.y + 10);
      sprite = g;
    } else if (options.projectileType === 'MOLOTOV') {
      // Arced glass bottle with flaming cloth
      const g = this.scene.add.graphics();
      g.fillStyle(0xff9900, 1);
      g.fillCircle(0, 0, 7);
      g.fillStyle(0xff3300, 0.8);
      g.fillCircle(0, 0, 10);
      g.setPosition(options.x, options.y);
      g.setDepth(options.y + 10);
      sprite = g;
    } else if (options.projectileType === 'TONIC_BOTTLE') {
      // Bubbly medicine / energy drink bottle
      const g = this.scene.add.graphics();
      g.fillStyle(0x00ff66, 0.8);
      g.fillRoundedRect(-5, -8, 10, 16, 3);
      g.fillStyle(0xffffff, 1);
      g.fillRect(-3, -11, 6, 3);
      g.setPosition(options.x, options.y);
      g.setDepth(options.y + 10);
      sprite = g;
    } else if (options.projectileType === 'SONIC_WAVE') {
      // Expanding curved shockwave
      const g = this.scene.add.graphics();
      g.lineStyle(3, 0x05d9e8, 0.9);
      g.strokeCircle(0, 0, 16);
      g.lineStyle(1.5, 0xffffff, 0.7);
      g.strokeCircle(0, 0, 12);
      g.setPosition(options.x, options.y);
      g.setDepth(options.y + 10);
      sprite = g;
    } else if (options.projectileType === 'CALTROPS') {
      // Sharp steel caltrops scattered on ground
      const g = this.scene.add.graphics();
      g.fillStyle(0xd4af37, 1);
      g.fillTriangle(-6, 4, 6, 4, 0, -6);
      g.fillTriangle(-4, -4, 4, -4, 0, 6);
      g.setPosition(options.x, options.y);
      g.setDepth(options.y - 5);
      sprite = g;
    } else {
      // Chain whip link
      const g = this.scene.add.graphics();
      g.fillStyle(0xaaaaaa, 1);
      g.fillRect(-8, -3, 16, 6);
      g.setPosition(options.x, options.y);
      g.setRotation(angle);
      g.setDepth(options.y + 10);
      sprite = g;
    }

    this.projectiles.push({
      sprite,
      vx,
      vy,
      startX: options.x,
      startY: options.y,
      currentRange: 0,
      maxRange: options.range,
      damage: options.damage,
      damageType: options.damageType,
      projectileType: options.projectileType,
      statusEffect: options.statusEffect,
      pierceRemaining: options.pierceCount ?? 1,
      hitEnemies: new Set(),
      isGroundTrap: options.isGroundTrap,
      trapTimer: options.trapDuration ?? 5000,
      isAoE: options.isAoE,
      aoeRadius: options.aoeRadius ?? 75
    });
  }

  public update(_time: number, delta: number) {
    const deltaSec = delta / 1000;

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      if (p.isGroundTrap) {
        // Ground Trap logic: stationary until triggered or timer expires
        if (p.trapTimer !== undefined) {
          p.trapTimer -= delta;
          if (p.trapTimer <= 0) {
            p.sprite.destroy();
            this.projectiles.splice(i, 1);
            continue;
          }
        }

        // Check if an enemy steps on the trap
        for (const enemy of this.scene.enemies) {
          if (enemy.isDead || p.hitEnemies.has(enemy)) continue;
          const dist = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, enemy.x, enemy.y);
          if (dist < 36) {
            this.applyHit(p, enemy);
            p.hitEnemies.add(enemy);
            p.pierceRemaining--;
            if (p.pierceRemaining <= 0) {
              this.spawnImpactBurst(p.sprite.x, p.sprite.y, 0xffbb00);
              p.sprite.destroy();
              this.projectiles.splice(i, 1);
              break;
            }
          }
        }
        continue;
      }

      // Moving projectile
      const dx = p.vx * deltaSec;
      const dy = p.vy * deltaSec;
      p.sprite.x += dx;
      p.sprite.y += dy;
      p.sprite.setDepth(p.sprite.y + 10);
      p.currentRange += Math.sqrt(dx * dx + dy * dy);

      // Check collision with living enemies
      let projectileDestroyed = false;
      for (const enemy of this.scene.enemies) {
        if (enemy.isDead || p.hitEnemies.has(enemy)) continue;

        const dist = Phaser.Math.Distance.Between(p.sprite.x, p.sprite.y, enemy.x, enemy.y - 16);
        const hitRadius = p.projectileType === 'SONIC_WAVE' ? 42 : 24;

        if (dist <= hitRadius) {
          p.hitEnemies.add(enemy);

          if (p.isAoE) {
            this.explodeAoE(p.sprite.x, p.sprite.y, p);
            projectileDestroyed = true;
            break;
          } else {
            this.applyHit(p, enemy);
            p.pierceRemaining--;
            if (p.pierceRemaining <= 0) {
              this.spawnImpactBurst(p.sprite.x, p.sprite.y, 0x05d9e8);
              projectileDestroyed = true;
              break;
            }
          }
        }
      }

      // Check max range expiry
      if (projectileDestroyed || p.currentRange >= p.maxRange) {
        if (p.projectileType === 'MOLOTOV') {
          this.explodeAoE(p.sprite.x, p.sprite.y, p);
        } else if (!projectileDestroyed) {
          this.spawnImpactBurst(p.sprite.x, p.sprite.y, 0xaaaaaa);
        }
        p.sprite.destroy();
        this.projectiles.splice(i, 1);
      }
    }
  }

  private applyHit(p: any, enemy: Enemy) {
    const res = CombatSystem.calculateDamage(
      this.scene.player.stats,
      p.damage,
      p.damageType,
      enemy.defense,
      this.scene.player.isAwakened
    );

    const angle = Phaser.Math.Angle.Between(this.scene.player.x, this.scene.player.y, enemy.x, enemy.y);
    enemy.setVelocity(Math.cos(angle) * 120, Math.sin(angle) * 120);
    this.scene.time.delayedCall(120, () => enemy.setVelocity(0, 0));

    const statusToApply = p.statusEffect || res.statusApplied;
    const died = enemy.takeDamage(res.damage, statusToApply);
    this.scene.damageText.showDamage(enemy.x, enemy.y, res);

    this.spawnImpactBurst(enemy.x, enemy.y - 12, p.damageType === 'PIERCE' ? 0x05d9e8 : 0xff2a6d);

    if (died) {
      (this.scene as any).handleEnemyKill?.(enemy);
    }
  }

  private explodeAoE(x: number, y: number, p: any) {
    const aoe = this.scene.add.graphics();
    aoe.fillStyle(0xff3300, 0.4);
    aoe.fillCircle(x, y, p.aoeRadius);
    aoe.lineStyle(2, 0xffcc00, 0.8);
    aoe.strokeCircle(x, y, p.aoeRadius);
    aoe.setDepth(y);

    this.scene.tweens.add({
      targets: aoe,
      alpha: 0,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 350,
      onComplete: () => aoe.destroy()
    });

    this.scene.enemies.forEach(enemy => {
      if (enemy.isDead) return;
      const d = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (d <= p.aoeRadius) {
        this.applyHit(p, enemy);
      }
    });
  }

  private spawnImpactBurst(x: number, y: number, color: number) {
    const spark = this.scene.add.graphics();
    spark.fillStyle(color, 1);
    spark.fillCircle(x, y, 6);
    spark.setDepth(y + 20);

    this.scene.tweens.add({
      targets: spark,
      scale: 2.2,
      alpha: 0,
      duration: 160,
      onComplete: () => spark.destroy()
    });
  }

  public clear() {
    this.projectiles.forEach(p => p.sprite.destroy());
    this.projectiles = [];
  }
}

