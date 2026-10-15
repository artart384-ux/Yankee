import Phaser from 'phaser';
import { DamageType, StatusEffect, StatusEffectType } from '../types/game';
import { SoundSynthesizer } from '../systems/SoundSynthesizer';

export type EnemyType = 'THUG' | 'DRONE' | 'DUMMY' | 'APEX_ENFORCER';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  public enemyType: EnemyType;
  public enemyName: string;
  public hp: number;
  public maxHp: number;
  public defense: number;
  public expReward: number;
  public isDead: boolean = false;
  public statusEffects: StatusEffect[] = [];

  private healthBarBg: Phaser.GameObjects.Graphics;
  private healthBarFill: Phaser.GameObjects.Graphics;
  private nameLabel: Phaser.GameObjects.Text;
  private soundSynth: SoundSynthesizer;
  private moveTimer: number = 0;
  private targetPlayer?: Phaser.Physics.Arcade.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number, type: EnemyType, name?: string) {
    let texture = 'enemy_thug';
    if (type === 'DRONE') texture = 'enemy_drone';
    if (type === 'DUMMY') texture = 'training_dummy';
    if (type === 'APEX_ENFORCER') texture = 'enemy_apex_enforcer';

    super(scene, x, y, texture, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.enemyType = type;
    this.soundSynth = SoundSynthesizer.getInstance();

    if (type === 'APEX_ENFORCER') {
      this.enemyName = name || '⚡ ผู้คุมกฎเอเปกซ์ (Apex Enforcer [ELITE])';
      this.maxHp = 750;
      this.defense = 24;
      this.expReward = 160;
      this.setSize(36, 28);
      this.setOffset(14, 34);
      this.play('enforcer_idle');
    } else if (type === 'THUG') {
      this.enemyName = name || 'แก๊งเกเรนอกคอก (Rival Thug)';
      this.maxHp = 240;
      this.defense = 12;
      this.expReward = 45;
      this.setSize(28, 22);
      this.setOffset(18, 42);
      this.play('thug_idle');
    } else if (type === 'DRONE') {
      this.enemyName = name || 'โดรนตรวจการสนิมเหล็ก (Patrol Drone)';
      this.maxHp = 140;
      this.defense = 8;
      this.expReward = 35;
      this.setSize(28, 22);
      this.setOffset(18, 22);
      this.play('drone_hover');
    } else {
      this.enemyName = name || 'หุ่นฝึกซ้อมสปิริต (Training Dummy)';
      this.maxHp = 99999;
      this.defense = 10;
      this.expReward = 5;
      this.setImmovable(true);
      this.setSize(30, 24);
      this.setOffset(17, 40);
    }

    this.hp = this.maxHp;
    this.setDepth(y);

    // Health bar & Name label
    this.healthBarBg = scene.add.graphics();
    this.healthBarFill = scene.add.graphics();
    this.nameLabel = scene.add.text(x, y - 46, this.enemyName, {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '11px',
      color: type === 'DUMMY' ? '#05d9e8' : '#ff4444',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.updateHealthBar();
  }

  public setTarget(player: Phaser.Physics.Arcade.Sprite) {
    this.targetPlayer = player;
  }

  public update(time: number, delta: number) {
    if (this.isDead) return;

    this.setDepth(this.y);
    this.updateHealthBar();
    this.updateStatusEffects(delta);

    if (this.enemyType === 'DUMMY') {
      return; // Dummy doesn't move
    }

    // AI behavior: Aggro if close to player, or wander
    if (this.targetPlayer) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, this.targetPlayer.x, this.targetPlayer.y);
      if (dist < 260 && dist > 35) {
        // Chase player
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.targetPlayer.x, this.targetPlayer.y);
        const speed = this.enemyType === 'APEX_ENFORCER' ? 70 : this.enemyType === 'THUG' ? 85 : 100;
        this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed * 0.7);
        this.setFlipX(this.targetPlayer.x < this.x);

        if (this.enemyType === 'APEX_ENFORCER') {
          this.play('enforcer_walk', true);
        } else if (this.enemyType === 'THUG') {
          this.play('thug_walk', true);
        }
      } else if (dist <= 38) {
        // Attack range
        this.setVelocity(0, 0);
        if (this.enemyType === 'APEX_ENFORCER') {
          this.play('enforcer_attack', true);
        } else if (this.enemyType === 'THUG') {
          this.play('thug_attack', true);
        }
      } else {
        // Idle wander
        this.moveTimer += delta;
        if (this.moveTimer > 2500) {
          this.moveTimer = 0;
          const rx = (Math.random() - 0.5) * 50;
          const ry = (Math.random() - 0.5) * 35;
          this.setVelocity(rx, ry);
          if (this.enemyType === 'APEX_ENFORCER') {
            if (Math.abs(rx) > 5) this.play('enforcer_walk', true);
            else this.play('enforcer_idle', true);
          } else if (this.enemyType === 'THUG') {
            if (Math.abs(rx) > 5) this.play('thug_walk', true);
            else this.play('thug_idle', true);
          }
        }
      }
    }
  }

  public takeDamage(damage: number, status?: StatusEffectType): boolean {
    if (this.isDead) return false;

    this.hp -= damage;
    this.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
    });

    if (this.enemyType === 'DUMMY') {
      this.setFrame(1);
      this.scene.time.delayedCall(160, () => this.setFrame(0));
    }

    // Apply status effect
    if (status) {
      this.applyStatusEffect(status);
    }

    if (this.hp <= 0 && this.enemyType !== 'DUMMY') {
      this.die();
      return true; // Enemy died
    }

    return false;
  }

  private applyStatusEffect(type: StatusEffectType) {
    const existing = this.statusEffects.find(s => s.type === type);
    if (existing) {
      existing.elapsed = 0; // Refresh duration
    } else {
      this.statusEffects.push({
        type,
        duration: 4.0,
        elapsed: 0,
        potency: 12,
        tickInterval: 1.0,
        lastTick: 0
      });
    }
  }

  private updateStatusEffects(delta: number) {
    const sec = delta / 1000;
    for (let i = this.statusEffects.length - 1; i >= 0; i--) {
      const effect = this.statusEffects[i];
      effect.elapsed += sec;
      effect.lastTick = (effect.lastTick || 0) + sec;

      // Tick damage for Bleed & Burn
      if (effect.lastTick >= (effect.tickInterval || 1.0)) {
        effect.lastTick = 0;
        if (effect.type === 'BLEED' || effect.type === 'BURN') {
          this.hp -= effect.potency;
          // Flash orange or cyan
          this.setTint(effect.type === 'BLEED' ? 0xff3300 : 0x00ccff);
          this.scene.time.delayedCall(80, () => this.clearTint());
        }
      }

      if (effect.elapsed >= effect.duration) {
        this.statusEffects.splice(i, 1);
      }
    }
  }

  private updateHealthBar() {
    this.healthBarBg.clear();
    this.healthBarFill.clear();

    const barW = 38;
    const barH = 5;
    const barX = this.x - barW / 2;
    const barY = this.y - 36;

    this.healthBarBg.fillStyle(0x101018, 0.85);
    this.healthBarBg.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    this.healthBarBg.lineStyle(1, 0x333344, 0.8);
    this.healthBarBg.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);

    const ratio = Math.max(0, Math.min(1, this.hp / this.maxHp));
    const fillColor = this.enemyType === 'DUMMY' ? 0x05d9e8 : ratio > 0.3 ? 0xff2a6d : 0xffaa00;
    this.healthBarFill.fillStyle(fillColor, 1);
    this.healthBarFill.fillRect(barX, barY, barW * ratio, barH);

    this.nameLabel.setPosition(this.x, this.y - 48);
    this.healthBarBg.setDepth(this.y + 10);
    this.healthBarFill.setDepth(this.y + 11);
    this.nameLabel.setDepth(this.y + 12);
  }

  private die() {
    this.isDead = true;
    this.setVelocity(0, 0);
    this.soundSynth.playPunch();

    // Death fade & shrink tween
    this.scene.tweens.add({
      targets: [this, this.healthBarBg, this.healthBarFill, this.nameLabel],
      alpha: 0,
      scaleX: 0.1,
      scaleY: 0.1,
      duration: 350,
      onComplete: () => {
        // Respawn after 8 seconds
        this.scene.time.delayedCall(8000, () => {
          this.respawn();
        });
      }
    });
  }

  private respawn() {
    this.isDead = false;
    this.hp = this.maxHp;
    this.setAlpha(1);
    this.setScale(1);
    this.healthBarBg.setAlpha(1);
    this.healthBarFill.setAlpha(1);
    this.nameLabel.setAlpha(1);
  }

  public destroy(fromScene?: boolean) {
    this.healthBarBg.destroy();
    this.healthBarFill.destroy();
    this.nameLabel.destroy();
    super.destroy(fromScene);
  }
}

