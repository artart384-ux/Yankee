import Phaser from 'phaser';
import { CharacterStats, FactionId, PlayerClassId, SkillConfig, StatusEffect } from '../types/game';
import { BASE_SKILLS, FACTIONS } from '../data/gameData';
import { StatsSystem } from '../systems/StatsSystem';
import { SoundSynthesizer } from '../systems/SoundSynthesizer';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public playerName: string;
  public factionId: FactionId;
  public classId: PlayerClassId;
  public stats: CharacterStats;
  public skills: SkillConfig[];
  public statusEffects: StatusEffect[] = [];

  public isAttacking: boolean = false;
  public isDashing: boolean = false;
  public isAwakened: boolean = false;
  public awakenedTimer: number = 0;
  public comboStep: number = 0;
  public lastAttackTime: number = 0;

  private auraEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private soundSynth: SoundSynthesizer;
  private nameText: Phaser.GameObjects.Text;
  private factionTagText: Phaser.GameObjects.Text;
  private auraRing: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    name: string,
    factionId: FactionId,
    classId: PlayerClassId
  ) {
    const textureKey = factionId === 'GEARHEADS' ? 'gearheads_brawler' :
                       factionId === 'ELITES' ? 'elites_striker' : 'syndicate_delinquent';

    super(scene, x, y, textureKey, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.playerName = name;
    this.factionId = factionId;
    this.classId = classId;
    this.stats = StatsSystem.createInitialStats(factionId, classId);
    this.skills = JSON.parse(JSON.stringify(BASE_SKILLS));
    this.soundSynth = SoundSynthesizer.getInstance();

    // Setup physics body (isometric footprint for 64x64 sprite)
    this.setCollideWorldBounds(true);
    this.setSize(28, 22);
    this.setOffset(18, 42);
    this.setDepth(y);

    // Aura ring underneath player
    this.auraRing = scene.add.graphics();
    this.drawAuraRing();

    // Floating Overhead Nameplate & Faction Tag
    const factionData = FACTIONS[factionId];
    this.nameText = scene.add.text(x, y - 44, this.playerName, {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.factionTagText = scene.add.text(x, y - 58, `[${factionData.name}]`, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '10px',
      color: factionData.hexColor,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Initial animation
    const animPrefix = this.getAnimPrefix();
    this.play(`${animPrefix}_idle`);
  }

  private getAnimPrefix(): string {
    return this.factionId === 'GEARHEADS' ? 'gearheads' :
           this.factionId === 'ELITES' ? 'elites' : 'syndicate';
  }

  private drawAuraRing() {
    this.auraRing.clear();
    const factionColor = FACTIONS[this.factionId].themeColor;
    const alpha = this.isAwakened ? 0.8 : 0.35;
    const radius = this.isAwakened ? 30 : 22;

    this.auraRing.lineStyle(2, factionColor, alpha);
    this.auraRing.strokeEllipse(this.x, this.y + 24, radius * 2, radius);
    if (this.isAwakened) {
      this.auraRing.fillStyle(factionColor, 0.2);
      this.auraRing.fillEllipse(this.x, this.y + 24, radius * 2, radius);
    }
    this.auraRing.setDepth(this.y - 1);
  }

  public update(time: number, delta: number, cursors: Phaser.Types.Input.Keyboard.CursorKeys, keys: Record<string, Phaser.Input.Keyboard.Key>, pointer: Phaser.Input.Pointer) {
    this.setDepth(this.y);
    this.drawAuraRing();

    // Update nameplate position
    this.nameText.setPosition(this.x, this.y - 44);
    this.factionTagText.setPosition(this.x, this.y - 58);
    this.nameText.setDepth(this.y + 100);
    this.factionTagText.setDepth(this.y + 100);

    // Handle Spirit Awakening timer
    if (this.isAwakened) {
      this.awakenedTimer -= delta;
      if (this.awakenedTimer <= 0) {
        this.isAwakened = false;
      }
    }

    // Passive regeneration (Stamina and Aura)
    const regenDelta = delta / 1000;
    this.stats.stamina = Math.min(this.stats.maxStamina, this.stats.stamina + 15 * regenDelta);
    this.stats.aura = Math.min(this.stats.maxAura, this.stats.aura + 8 * regenDelta);

    // Face cursor direction
    if (pointer.worldX < this.x) {
      this.setFlipX(true);
    } else {
      this.setFlipX(false);
    }

    // Skip normal movement if locked in dashing or attacking
    if (this.isDashing || this.isAttacking) {
      return;
    }

    // 8-Directional Movement (WASD & Arrows)
    let vx = 0;
    let vy = 0;

    if (cursors.left.isDown || keys.A?.isDown) vx -= 1;
    if (cursors.right.isDown || keys.D?.isDown) vx += 1;
    if (cursors.up.isDown || keys.W?.isDown) vy -= 1;
    if (cursors.down.isDown || keys.S?.isDown) vy += 1;

    let speed = this.stats.moveSpeed;
    if (this.isAwakened) speed *= 1.4;

    if (vx !== 0 || vy !== 0) {
      // Normalize diagonal speed
      const mag = Math.sqrt(vx * vx + vy * vy);
      vx = (vx / mag) * speed;
      vy = (vy / mag) * speed * 0.7; // Isometric aspect compression

      this.setVelocity(vx, vy);

      const animPrefix = this.getAnimPrefix();
      if (!this.anims.isPlaying || this.anims.currentAnim?.key !== `${animPrefix}_walk`) {
        this.play(`${animPrefix}_walk`, true);
      }
    } else {
      this.setVelocity(0, 0);
      const animPrefix = this.getAnimPrefix();
      if (!this.anims.isPlaying || this.anims.currentAnim?.key !== `${animPrefix}_idle`) {
        this.play(`${animPrefix}_idle`, true);
      }
    }
  }

  // --- ACTIONS & SKILLS ---

  public executePrimaryAttack(targetX: number, targetY: number): boolean {
    if (this.isAttacking || this.isDashing) return false;
    const skill = this.skills.find(s => s.keySlot === 'LCLICK');
    if (!skill) return false;

    const now = Date.now();
    if (now - skill.lastUsedTime < skill.cooldown) return false;
    if (this.stats.stamina < skill.staminaCost) return false;

    this.stats.stamina -= skill.staminaCost;
    skill.lastUsedTime = now;
    this.isAttacking = true;

    // Advance combo step (0 -> 1 -> 2 -> 0)
    if (now - this.lastAttackTime > 900) {
      this.comboStep = 0;
    }
    this.lastAttackTime = now;

    const animPrefix = this.getAnimPrefix();
    const animName = this.comboStep === 2 ? `${animPrefix}_attack3` :
                     this.comboStep === 1 ? `${animPrefix}_attack2` : `${animPrefix}_attack1`;
    this.play(animName, true);

    // Play attack sound
    if (this.comboStep === 2) {
      this.soundSynth.playHeavyHit();
    } else {
      this.soundSynth.playPunch();
    }

    // Step towards target slightly
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    this.setVelocity(Math.cos(angle) * 120, Math.sin(angle) * 80);

    this.scene.time.delayedCall(220, () => {
      this.setVelocity(0, 0);
      this.isAttacking = false;
      this.comboStep = (this.comboStep + 1) % 3;
    });

    return true;
  }

  public executeHeavyStrike(targetX: number, targetY: number): boolean {
    if (this.isAttacking || this.isDashing) return false;
    const skill = this.skills.find(s => s.keySlot === 'RCLICK');
    if (!skill) return false;

    const now = Date.now();
    if (now - skill.lastUsedTime < skill.cooldown) return false;
    if (this.stats.stamina < skill.staminaCost) return false;

    this.stats.stamina -= skill.staminaCost;
    skill.lastUsedTime = now;
    this.isAttacking = true;

    const animPrefix = this.getAnimPrefix();
    this.play(`${animPrefix}_attack3`, true);
    this.soundSynth.playHeavyHit();

    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    this.setVelocity(Math.cos(angle) * 180, Math.sin(angle) * 120);

    this.scene.time.delayedCall(350, () => {
      this.setVelocity(0, 0);
      this.isAttacking = false;
    });

    return true;
  }

  public executeDash(pointer: Phaser.Input.Pointer): boolean {
    if (this.isDashing) return false;
    const skill = this.skills.find(s => s.keySlot === 'Q');
    if (!skill) return false;

    const now = Date.now();
    if (now - skill.lastUsedTime < skill.cooldown) return false;
    if (this.stats.stamina < skill.staminaCost) return false;

    this.stats.stamina -= skill.staminaCost;
    skill.lastUsedTime = now;
    this.isDashing = true;
    this.isAttacking = false;

    this.soundSynth.playDash();

    // Direction towards cursor
    const angle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
    const dashSpeed = 480;
    this.setVelocity(Math.cos(angle) * dashSpeed, Math.sin(angle) * dashSpeed * 0.7);

    // Create ghost trail effect
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 60, () => {
        const ghost = this.scene.add.sprite(this.x, this.y, this.texture.key, this.frame.name);
        ghost.setFlipX(this.flipX);
        ghost.setTint(FACTIONS[this.factionId].themeColor);
        ghost.setAlpha(0.65);
        ghost.setDepth(this.y - 1);
        this.scene.tweens.add({
          targets: ghost,
          alpha: 0,
          scale: 1.1,
          duration: 250,
          onComplete: () => ghost.destroy()
        });
      });
    }

    this.scene.time.delayedCall(240, () => {
      this.setVelocity(0, 0);
      this.isDashing = false;
    });

    return true;
  }

  public executeAuraSkill(): boolean {
    const skill = this.skills.find(s => s.keySlot === '1');
    if (!skill) return false;

    const now = Date.now();
    if (now - skill.lastUsedTime < skill.cooldown) return false;
    if (this.stats.aura < skill.auraCost) return false;

    this.stats.aura -= skill.auraCost;
    skill.lastUsedTime = now;

    this.soundSynth.playAuraBurst();
    return true;
  }

  public executeWeaponTech(): boolean {
    const skill = this.skills.find(s => s.keySlot === '2');
    if (!skill) return false;

    const now = Date.now();
    if (now - skill.lastUsedTime < skill.cooldown) return false;
    if (this.stats.aura < skill.auraCost) return false;

    this.stats.aura -= skill.auraCost;
    skill.lastUsedTime = now;

    this.soundSynth.playPierce();
    return true;
  }

  public executeSpiritBurst(): boolean {
    const skill = this.skills.find(s => s.keySlot === '3');
    if (!skill) return false;

    const now = Date.now();
    if (now - skill.lastUsedTime < skill.cooldown) return false;
    if (this.stats.aura < skill.auraCost) return false;

    this.stats.aura -= skill.auraCost;
    skill.lastUsedTime = now;

    this.soundSynth.playHeavyHit();
    return true;
  }

  public executeTonic(): boolean {
    const skill = this.skills.find(s => s.keySlot === '4');
    if (!skill) return false;

    const now = Date.now();
    if (now - skill.lastUsedTime < skill.cooldown) return false;

    skill.lastUsedTime = now;
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 60);
    this.stats.stamina = Math.min(this.stats.maxStamina, this.stats.stamina + 50);

    this.soundSynth.playUI();
    return true;
  }

  public executeAwakening(): boolean {
    const skill = this.skills.find(s => s.keySlot === 'E');
    if (!skill) return false;

    const now = Date.now();
    if (now - skill.lastUsedTime < skill.cooldown) return false;
    if (this.stats.aura < skill.auraCost) return false;

    this.stats.aura -= skill.auraCost;
    skill.lastUsedTime = now;

    this.isAwakened = true;
    this.awakenedTimer = 12000; // 12 seconds overdrive

    this.soundSynth.playAuraBurst();
    return true;
  }

  public takeDamage(amount: number) {
    this.stats.hp = Math.max(0, this.stats.hp - amount);
    this.setTint(0xff4444);
    this.scene.time.delayedCall(120, () => {
      this.clearTint();
    });

    if (this.stats.hp <= 0) {
      // Delinquent Knocked Out
      this.stats.hp = Math.round(this.stats.maxHp * 0.5); // Respawn with 50% HP
      this.setPosition(400, 300); // Send back to Crossroads safe zone
    }
  }

  public destroy(fromScene?: boolean) {
    this.nameText.destroy();
    this.factionTagText.destroy();
    this.auraRing.destroy();
    super.destroy(fromScene);
  }
}

