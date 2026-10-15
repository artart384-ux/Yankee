import Phaser from 'phaser';
import { DamageResult, DamageType } from '../types/game';
import { CombatSystem } from '../systems/CombatSystem';

export class DamageTextManager {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public showDamage(x: number, y: number, result: DamageResult) {
    const isCrit = result.isCrit;
    const damage = result.damage;

    // 1. COMIC EXPLOSION BADGE ("KRSH!!", "!!?", "CRIT!")
    if (isCrit || damage > 150) {
      let badgeTexture = 'vfx_comic_krsh';
      if (isCrit) {
        badgeTexture = 'vfx_comic_crit';
      } else if (Math.random() > 0.5) {
        badgeTexture = 'vfx_comic_exclaim';
      }

      const badgeAngle = (Math.random() - 0.5) * 16;
      if (this.scene.textures.exists(badgeTexture)) {
        const badge = this.scene.add.image(x + (Math.random() - 0.5) * 30, y - 36, badgeTexture);
        badge.setScale(0.2);
        badge.setAngle(badgeAngle);
        badge.setDepth(y + 400);

        this.scene.tweens.add({
          targets: badge,
          scale: 1.25,
          y: y - 50,
          duration: 180,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.scene.tweens.add({
              targets: badge,
              alpha: 0,
              y: y - 68,
              duration: 320,
              delay: 180,
              onComplete: () => badge.destroy()
            });
          }
        });
      }

      // Neon Aura Burst underneath the strike
      const auraType = isCrit ? 'vfx_aura_burst_lime' : (Math.random() > 0.5 ? 'vfx_aura_burst_magenta' : 'vfx_aura_burst_cyan');
      if (this.scene.textures.exists(auraType)) {
        const burst = this.scene.add.image(x, y - 10, auraType);
        burst.setScale(0.4);
        burst.setDepth(y + 250);
        this.scene.tweens.add({
          targets: burst,
          scale: 1.3,
          alpha: 0,
          duration: 260,
          onComplete: () => burst.destroy()
        });
      }

      // Micro camera shake for juicy impact feel
      this.scene.cameras.main.shake(120, 0.005);
    }

    // 2. RETRO ARCADE DAMAGE TEXT (Glowing drop-shadowed popup)
    const color = CombatSystem.getDamageColor(result.damageType, isCrit);
    const textStr = isCrit ? `★ ${damage}` : `${damage}`;
    const fontSize = isCrit ? '22px' : '16px';

    const text = this.scene.add.text(x + (Math.random() - 0.5) * 24, y - 16, textStr, {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: fontSize,
      fontStyle: 'bold',
      color: color,
      stroke: '#000000',
      strokeThickness: isCrit ? 5 : 3,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 2,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5).setDepth(y + 300);

    // Initial scale bounce
    text.setScale(0.4);
    this.scene.tweens.add({
      targets: text,
      scale: isCrit ? 1.35 : 1.1,
      y: y - 40,
      duration: 180,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: text,
          y: y - 65,
          alpha: 0,
          scale: 0.9,
          duration: 600,
          ease: 'Power2',
          onComplete: () => text.destroy()
        });
      }
    });

    // 3. BURST PARTICLES: SPARKS & DEBRIS
    this.spawnSparks(x, y - 10, isCrit ? 10 : 5);
    if (isCrit) {
      this.spawnDebris(x, y - 5, 5);
    }

    // 4. STATUS AILMENT POPUP
    if (result.statusApplied) {
      this.scene.time.delayedCall(150, () => {
        let statusColor = '#ff3300';
        let statusLabel = '🩸 BLEED';
        if (result.statusApplied === 'BURN') {
          statusColor = '#00e5ff';
          statusLabel = '🔥 AURA BURN';
        } else if (result.statusApplied === 'FRACTURE') {
          statusColor = '#ffbb00';
          statusLabel = '🦴 FRACTURE';
        }

        const statusText = this.scene.add.text(x, y - 25, statusLabel, {
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '12px',
          fontStyle: 'bold',
          color: statusColor,
          stroke: '#000000',
          strokeThickness: 3
        }).setOrigin(0.5).setDepth(y + 301);

        this.scene.tweens.add({
          targets: statusText,
          y: y - 60,
          alpha: 0,
          duration: 800,
          ease: 'Power1',
          onComplete: () => statusText.destroy()
        });
      });
    }
  }

  public showHeal(x: number, y: number, amount: number) {
    const text = this.scene.add.text(x, y - 20, `+${amount} HP`, {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#00ff66',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(y + 300);

    this.scene.tweens.add({
      targets: text,
      y: y - 55,
      alpha: 0,
      scale: 1.2,
      duration: 800,
      ease: 'Back.easeOut',
      onComplete: () => text.destroy()
    });
  }

  private spawnSparks(x: number, y: number, count: number) {
    if (!this.scene.textures.exists('vfx_spark')) return;
    for (let i = 0; i < count; i++) {
      const spark = this.scene.add.image(x, y, 'vfx_spark');
      spark.setDepth(y + 250);
      spark.setScale(Phaser.Math.FloatBetween(0.8, 1.4));

      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(60, 140);
      const targetX = x + Math.cos(angle) * speed;
      const targetY = y + Math.sin(angle) * speed * 0.7 - 20;

      this.scene.tweens.add({
        targets: spark,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(250, 450),
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy()
      });
    }
  }

  private spawnDebris(x: number, y: number, count: number) {
    if (!this.scene.textures.exists('vfx_debris')) return;
    for (let i = 0; i < count; i++) {
      const pebble = this.scene.add.image(x, y, 'vfx_debris');
      pebble.setDepth(y + 240);
      pebble.setScale(Phaser.Math.FloatBetween(0.8, 1.3));

      const dir = (Math.random() - 0.5) * 80;
      const up = -Phaser.Math.FloatBetween(20, 60);

      this.scene.tweens.add({
        targets: pebble,
        x: x + dir,
        y: y + up,
        angle: Phaser.Math.Between(-180, 180),
        duration: 200,
        ease: 'Quad.easeOut',
        onComplete: () => {
          this.scene.tweens.add({
            targets: pebble,
            y: y + 20,
            alpha: 0,
            duration: 300,
            ease: 'Bounce.easeOut',
            onComplete: () => pebble.destroy()
          });
        }
      });
    }
  }
}
