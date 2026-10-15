import Phaser from 'phaser';
import { CharacterStats, FactionId, PlayerClassId, SkillConfig, StatusEffect } from '../types/game';
import { FACTIONS } from '../data/gameData';
import { StatsSystem } from '../systems/StatsSystem';
import { SoundSynthesizer } from '../systems/SoundSynthesizer';
import { ClassCombatConfig, ClassCombatSystem, ClassSkillSpec } from '../systems/ClassCombatSystem';
import { CharacterAnimationController } from '../systems/CharacterAnimationController';

export class Player extends Phaser.Physics.Arcade.Sprite {
  public playerName: string;
  public factionId: FactionId;
  public classId: PlayerClassId;
  public stats: CharacterStats;
  public skills: SkillConfig[];
  public classConfig: ClassCombatConfig;
  public statusEffects: StatusEffect[] = [];

  public animController: CharacterAnimationController;
  public isAttacking: boolean = false;
  public isDashing: boolean = false;
  public isAwakened: boolean = false;
  public awakenedTimer: number = 0;
  public comboStep: number = 0;
  public lastAttackTime: number = 0;

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
    const textureKey = `class_${classId.toLowerCase()}`;

    super(scene, x, y, textureKey, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.playerName = name;
    this.factionId = factionId;
    this.classId = classId;
    this.stats = StatsSystem.createInitialStats(factionId, classId);
    this.classConfig = ClassCombatSystem.getClassConfig(classId);
    this.skills = ClassCombatSystem.getInitialSkills(classId);
    this.soundSynth = SoundSynthesizer.getInstance();

    // Setup anchor at feet (0.5, 0.9) and isometric footprint hitbox (24x12)
    this.setOrigin(0.5, 0.9);
    this.setCollideWorldBounds(true);
    this.setSize(24, 12);
    this.setOffset(20, 50);
    this.setDepth(y);

    // Character Animation Controller & State Machine
    this.animController = new CharacterAnimationController(this, classId);

    // Aura ring underneath player feet
    this.auraRing = scene.add.graphics();
    this.drawAuraRing();

    // Floating Overhead Nameplate & Faction Tag
    const factionData = FACTIONS[factionId];
    this.nameText = scene.add.text(x, y - 64, this.playerName, {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.factionTagText = scene.add.text(x, y - 78, `[${factionData.name}]`, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '10px',
      color: factionData.hexColor,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
  }

  private drawAuraRing() {
    this.auraRing.clear();
    const factionColor = FACTIONS[this.factionId].themeColor;
    const alpha = this.isAwakened ? 0.8 : 0.35;
    const radius = this.isAwakened ? 28 : 20;

    this.auraRing.lineStyle(2, factionColor, alpha);
    this.auraRing.strokeEllipse(this.x, this.y, radius * 2, radius);
    if (this.isAwakened) {
      this.auraRing.fillStyle(factionColor, 0.2);
      this.auraRing.fillEllipse(this.x, this.y, radius * 2, radius);
    }
    this.auraRing.setDepth(this.y - 1);
  }

  public update(
    _time: number,
    delta: number,
    cursors: Phaser.Types.Input.Keyboard.CursorKeys,
    keys: Record<string, Phaser.Input.Keyboard.Key>,
    pointer: Phaser.Input.Pointer
  ) {
    this.setDepth(this.y);
    this.drawAuraRing();

    // Update nameplate position
    this.nameText.setPosition(this.x, this.y - 64);
    this.factionTagText.setPosition(this.x, this.y - 78);
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

    // Update facing direction via Animation Controller
    this.animController.updateFacing(pointer.worldX, this.body?.velocity.x);

    // Skip normal movement if locked in dashing, dodge roll or attacking
    if (this.animController.isLocked() || this.isDashing || this.isAttacking) {
      this.animController.updateProceduralAnimation(delta, this.body?.velocity.x ?? 0, this.body?.velocity.y ?? 0);
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
      const mag = Math.sqrt(vx * vx + vy * vy);
      vx = (vx / mag) * speed;
      vy = (vy / mag) * speed * 0.7; // Isometric aspect ratio

      this.setVelocity(vx, vy);

      const isRunning = keys.SHIFT?.isDown || speed > 185;
      this.animController.setState(isRunning ? 'RUN' : 'WALK');
    } else {
      this.setVelocity(0, 0);
      this.animController.setState('IDLE');
    }

    // Apply procedural motion
    this.animController.updateProceduralAnimation(delta, vx, vy);
  }

  // --- ACTIONS & SKILLS ---

  public executePrimaryAttack(targetX: number, targetY: number): { success: boolean; spec?: ClassSkillSpec } {
    if (this.isAttacking || this.isDashing || this.animController.isLocked()) {
      return { success: false };
    }

    const skillSpec = this.classConfig.skills['LCLICK'];
    if (!skillSpec) return { success: false };

    const skillConfig = this.skills.find(s => s.keySlot === 'LCLICK');
    const now = Date.now();
    if (skillConfig && now - skillConfig.lastUsedTime < skillSpec.cooldown) {
      return { success: false };
    }
    if (this.stats.stamina < skillSpec.staminaCost) {
      return { success: false };
    }

    this.stats.stamina -= skillSpec.staminaCost;
    if (skillConfig) skillConfig.lastUsedTime = now;
    this.isAttacking = true;

    // Advance combo step
    if (now - this.lastAttackTime > 900) {
      this.comboStep = 0;
    }
    this.lastAttackTime = now;

    // Trigger animation state based on melee or ranged
    const isMelee = this.classConfig.attackType === 'melee';
    const duration = isMelee ? 220 : 250;
    this.animController.setState(isMelee ? 'ATTACK_MELEE' : 'ATTACK_RANGED', duration, () => {
      this.isAttacking = false;
      this.comboStep = (this.comboStep + 1) % 3;
    });

    // Play attack sound
    if (isMelee) {
      this.soundSynth.playPunch();
      // Slight forward step
      const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
      this.setVelocity(Math.cos(angle) * 100, Math.sin(angle) * 70);
      this.scene.time.delayedCall(160, () => this.setVelocity(0, 0));
    } else {
      this.soundSynth.playPierce();
    }

    return { success: true, spec: skillSpec };
  }

  public executeHeavyStrike(targetX: number, targetY: number): { success: boolean; spec?: ClassSkillSpec } {
    if (this.isAttacking || this.isDashing || this.animController.isLocked()) {
      return { success: false };
    }

    const skillSpec = this.classConfig.skills['RCLICK'];
    if (!skillSpec) return { success: false };

    const skillConfig = this.skills.find(s => s.keySlot === 'RCLICK');
    const now = Date.now();
    if (skillConfig && now - skillConfig.lastUsedTime < skillSpec.cooldown) {
      return { success: false };
    }
    if (this.stats.stamina < skillSpec.staminaCost) {
      return { success: false };
    }

    this.stats.stamina -= skillSpec.staminaCost;
    if (skillConfig) skillConfig.lastUsedTime = now;
    this.isAttacking = true;

    this.animController.setState('CAST_SKILL', 340, () => {
      this.isAttacking = false;
    });

    this.soundSynth.playHeavyHit();

    // Lunge forward
    const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    this.setVelocity(Math.cos(angle) * 160, Math.sin(angle) * 110);
    this.scene.time.delayedCall(200, () => this.setVelocity(0, 0));

    return { success: true, spec: skillSpec };
  }

  public executeClassSkill(
    slot: '1' | '2' | '3' | '4' | 'Q' | 'E',
    _targetX: number,
    _targetY: number
  ): { success: boolean; spec?: ClassSkillSpec } {
    const skillSpec = this.classConfig.skills[slot];
    if (!skillSpec) return { success: false };

    const skillConfig = this.skills.find(s => s.keySlot === slot);
    const now = Date.now();
    if (skillConfig && now - skillConfig.lastUsedTime < skillSpec.cooldown) {
      return { success: false };
    }
    if (this.stats.aura < skillSpec.auraCost || this.stats.stamina < skillSpec.staminaCost) {
      return { success: false };
    }

    this.stats.aura -= skillSpec.auraCost;
    this.stats.stamina -= skillSpec.staminaCost;
    if (skillConfig) skillConfig.lastUsedTime = now;

    // Trigger Cast Animation
    this.animController.setState('CAST_SKILL', 320);

    // Play sound based on skill type
    if (skillSpec.skillType.includes('heal') || skillSpec.skillType.includes('buff')) {
      this.soundSynth.playLevelUp();
    } else if (skillSpec.skillType.includes('dash')) {
      this.soundSynth.playDash();
    } else {
      this.soundSynth.playAuraBurst();
    }

    return { success: true, spec: skillSpec };
  }

  public executeDodgeRoll(pointer: Phaser.Input.Pointer): boolean {
    if (this.isDashing || this.animController.isLocked()) return false;
    if (this.stats.stamina < 20) return false;

    this.stats.stamina -= 20;
    this.isDashing = true;
    this.soundSynth.playDash();

    const angle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
    const rollSpeed = 480;
    this.setVelocity(Math.cos(angle) * rollSpeed, Math.sin(angle) * rollSpeed * 0.7);

    // Trigger 360-degree spin roll animation
    this.animController.triggerDodgeRoll(300, () => {
      this.setVelocity(0, 0);
      this.isDashing = false;
    });

    // Spawn motion blur ghosts
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 70, () => {
        const ghost = this.scene.add.sprite(this.x, this.y, this.texture.key, this.frame.name);
        ghost.setFlipX(this.flipX);
        ghost.setTint(FACTIONS[this.factionId].themeColor);
        ghost.setAlpha(0.6);
        ghost.setDepth(this.y - 1);
        this.scene.tweens.add({
          targets: ghost,
          alpha: 0,
          scale: 1.1,
          duration: 220,
          onComplete: () => ghost.destroy()
        });
      });
    }

    return true;
  }

  public takeDamage(amount: number) {
    this.stats.hp = Math.max(0, this.stats.hp - amount);
    this.animController.triggerHurtFlash(180);

    if (this.stats.hp <= 0) {
      // Delinquent Knocked Out
      this.stats.hp = Math.round(this.stats.maxHp * 0.5);
      this.setPosition(800, 600);
      this.scene.events.emit('CHAT_LOG', 'SYSTEM', '💥 คุณหมดสติจากการต่อสู้! เพื่อนร่วมแก๊งหามมาส่งที่ห้องปฐมพยาบาล');
    }
  }

  public destroy(fromScene?: boolean) {
    this.nameText?.destroy();
    this.factionTagText?.destroy();
    this.auraRing?.destroy();
    super.destroy(fromScene);
  }
}
