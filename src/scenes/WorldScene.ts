import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { NPC } from '../entities/NPC';
import { DamageTextManager } from '../ui/DamageText';
import { CombatSystem } from '../systems/CombatSystem';
import { SoundSynthesizer } from '../systems/SoundSynthesizer';
import { FactionId, PlayerClassId } from '../types/game';
import { StatsSystem } from '../systems/StatsSystem';
import { FACTIONS } from '../data/gameData';
import { IsometricDepthSystem } from '../systems/IsometricDepthSystem';
import { IsometricGrid } from '../systems/IsometricGrid';
import { SchoolZoneManager } from '../systems/SchoolZoneManager';
import { SchoolZoneData } from '../data/SchoolZonesConfig';
import { ProjectileManager } from '../systems/ProjectileManager';

export class WorldScene extends Phaser.Scene {
  public player!: Player;
  public enemies: Enemy[] = [];
  public npcs: NPC[] = [];
  public currentZone: string = 'zone_1';
  public zoneManager!: SchoolZoneManager;
  public projectileManager!: ProjectileManager;

  public damageText!: DamageTextManager;
  public soundSynth!: SoundSynthesizer;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  public depthSystem = IsometricDepthSystem.getInstance();

  constructor() {
    super('WorldScene');
  }

  init(data: { playerName?: string; factionId?: FactionId; classId?: PlayerClassId }) {
    this.soundSynth = SoundSynthesizer.getInstance();
    this.soundSynth.startStreetSynthBGM();
  }

  create(data: { playerName?: string; factionId?: FactionId; classId?: PlayerClassId }) {
    this.damageText = new DamageTextManager(this);
    this.depthSystem.clear();
    this.zoneManager = new SchoolZoneManager(this);
    this.projectileManager = new ProjectileManager(this);

    // 1. SPAWN PLAYER
    const playerName = data.playerName || 'Iron Spike';
    const factionId = data.factionId || 'GEARHEADS';
    const classId = data.classId || 'BRAWLER';

    this.player = new Player(this, 800, 600, playerName, factionId, classId);
    this.depthSystem.register(this.player);

    // 2. CAMERA SETUP (Zoomed closer for crisp, bold 64x64 characters)
    this.cameras.main.setZoom(1.95);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Interactive mouse wheel zoom (clamp 1.4x - 2.6x)
    this.input.on('wheel', (_pointer: unknown, _gameObjects: unknown[], _deltaX: number, deltaY: number) => {
      const currentZoom = this.cameras.main.zoom;
      const newZoom = Phaser.Math.Clamp(currentZoom - deltaY * 0.001, 1.4, 2.6);
      this.cameras.main.setZoom(newZoom);
    });

    // 3. LISTEN TO ZONE CHANGES
    this.events.on('ZONE_CHANGED', (zone: SchoolZoneData) => {
      this.currentZone = zone.id;
    });

    // 4. LOAD INITIAL SCHOOL CAMPUS ZONE (Zone 1: School Gate & Bike Stand)
    this.zoneManager.loadZone('zone_1', { x: 800, y: 600 }, true);

    // 5. INPUT SETUP
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        Q: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
        E: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
        F: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F),
        ONE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
        TWO: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
        THREE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
        FOUR: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR),
        SPACE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        TAB: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB),
        M: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M)
      };
    }

    // Mouse Controls (Non-target aim & click attack)
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Don't trigger combat if dialogue is open
      const uiScene = this.scene.get('UIScene') as { isDialogueOpen?: () => boolean };
      if (uiScene?.isDialogueOpen?.()) return;

      if (pointer.leftButtonDown()) {
        this.performPlayerAttack('LCLICK', pointer);
      } else if (pointer.rightButtonDown()) {
        this.performPlayerAttack('RCLICK', pointer);
      }
    });

    // Disable default browser context menu for right click combat
    this.input.mouse?.disableContextMenu();

    // Keybindings for Combat Skills
    this.keys.Q.on('down', () => this.performClassSkill('Q'));
    this.keys.ONE.on('down', () => this.performClassSkill('1'));
    this.keys.TWO.on('down', () => this.performClassSkill('2'));
    this.keys.THREE.on('down', () => this.performClassSkill('3'));
    this.keys.FOUR.on('down', () => this.performClassSkill('4'));
    this.keys.E.on('down', () => this.performClassSkill('E'));
    this.keys.SPACE.on('down', () => this.player.executeDodgeRoll(this.input.activePointer));
    this.keys.F.on('down', () => this.interactWithNearbyNPC());
    this.keys.TAB.on('down', (e: Event) => {
      e.preventDefault();
      this.events.emit('TOGGLE_PHONE');
    });
    this.keys.M.on('down', () => this.events.emit('TOGGLE_PHONE'));

    // 6. LAUNCH UI SCENE OVERLAY
    this.scene.launch('UIScene', { player: this.player, worldScene: this });
  }

  public update(time: number, delta: number) {
    if (!this.player) return;

    // Update Projectiles (Sling bullets, arrows, molotovs, traps)
    this.projectileManager.update(time, delta);

    // Update School Zone Portals and Room Transitions
    this.zoneManager.update(time, delta);

    // Update Player
    this.player.update(time, delta, this.cursors, this.keys, this.input.activePointer);

    // Update Current Zone Identifier
    this.currentZone = this.zoneManager.currentZoneId;

    // Update Enemies & Dummies
    this.enemies.forEach(e => e.update(time, delta));

    // Update NPCs & player interaction proximity
    this.npcs.forEach(npc => npc.checkPlayerDistance(this.player.x, this.player.y));

    // Dynamic Map-wide Isometric Depth Sorting
    this.depthSystem.update();
  }

  // --- COMBAT & ATTACK LOGIC ---

  private performPlayerAttack(slot: 'LCLICK' | 'RCLICK', pointer: Phaser.Input.Pointer) {
    if (slot === 'LCLICK') {
      const res = this.player.executePrimaryAttack(pointer.worldX, pointer.worldY);
      if (!res.success || !res.spec) return;

      const spec = res.spec;
      const isMelee = this.player.classConfig.attackType === 'melee';

      if (isMelee) {
        // Melee semicircular sweep cone
        const range = spec.range;
        const arc = Math.PI * 0.75; // 135 degree cone
        const angleToMouse = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);

        this.spawnCombatVFX(this.player.x, this.player.y, pointer.worldX, pointer.worldY, spec.damageType === 'SLASH' ? 'vfx_slash' : 'vfx_strike');

        this.enemies.forEach(enemy => {
          if (enemy.isDead) return;
          const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
          if (dist <= range) {
            const angleToEnemy = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            const diff = Phaser.Math.Angle.Wrap(angleToEnemy - angleToMouse);

            if (Math.abs(diff) < arc / 2) {
              const comboBonus = this.player.comboStep * 10;
              const dmgRes = CombatSystem.calculateDamage(
                this.player.stats,
                spec.baseDamage + comboBonus,
                spec.damageType,
                enemy.defense,
                this.player.isAwakened
              );

              // Knockback
              enemy.setVelocity(Math.cos(angleToEnemy) * 160, Math.sin(angleToEnemy) * 160);
              this.time.delayedCall(140, () => enemy.setVelocity(0, 0));

              const died = enemy.takeDamage(dmgRes.damage, spec.statusEffect || dmgRes.statusApplied);
              this.damageText.showDamage(enemy.x, enemy.y, dmgRes);

              // Impact VFX
              const burstTex = spec.damageType === 'SLASH' ? 'vfx_aura_burst_magenta' : 'vfx_aura_burst_cyan';
              this.spawnImpactBurstAt(enemy.x, enemy.y - 12, burstTex);

              if (died) this.handleEnemyKill(enemy);
            }
          }
        });
      } else {
        // Ranged / Projectile attack!
        this.projectileManager.fire({
          x: this.player.x,
          y: this.player.y - 16,
          targetX: pointer.worldX,
          targetY: pointer.worldY,
          speed: this.player.classConfig.projectileSpeed ?? 580,
          range: spec.range,
          damage: spec.baseDamage + this.player.comboStep * 8,
          damageType: spec.damageType,
          projectileType: spec.projectileType ?? 'SLING_BALL',
          statusEffect: spec.statusEffect
        });

        this.spawnCombatVFX(this.player.x, this.player.y, pointer.worldX, pointer.worldY, 'vfx_hitspark');
      }
    } else {
      // RCLICK (Heavy Attack / Power Shot)
      const res = this.player.executeHeavyStrike(pointer.worldX, pointer.worldY);
      if (!res.success || !res.spec) return;

      const spec = res.spec;
      const isMelee = this.player.classConfig.attackType === 'melee';

      if (isMelee) {
        const range = spec.range;
        const angleToMouse = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
        this.spawnCombatVFX(this.player.x, this.player.y, pointer.worldX, pointer.worldY, 'vfx_strike');

        this.enemies.forEach(enemy => {
          if (enemy.isDead) return;
          const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
          if (dist <= range) {
            const angleToEnemy = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            const diff = Phaser.Math.Angle.Wrap(angleToEnemy - angleToMouse);

            if (Math.abs(diff) < 0.8) {
              const dmgRes = CombatSystem.calculateDamage(
                this.player.stats,
                spec.baseDamage,
                spec.damageType,
                enemy.defense,
                this.player.isAwakened
              );

              enemy.setVelocity(Math.cos(angleToEnemy) * 240, Math.sin(angleToEnemy) * 240);
              this.time.delayedCall(180, () => enemy.setVelocity(0, 0));

              const died = enemy.takeDamage(dmgRes.damage, spec.statusEffect || 'FRACTURE');
              this.damageText.showDamage(enemy.x, enemy.y, dmgRes);
              this.spawnImpactBurstAt(enemy.x, enemy.y - 12, 'vfx_slam_burst');
              if (died) this.handleEnemyKill(enemy);
            }
          }
        });
      } else {
        // Ranged Heavy Shot (Pierce bolt / charged shot)
        this.projectileManager.fire({
          x: this.player.x,
          y: this.player.y - 16,
          targetX: pointer.worldX,
          targetY: pointer.worldY,
          speed: (this.player.classConfig.projectileSpeed ?? 580) * 1.25,
          range: spec.range,
          damage: spec.baseDamage,
          damageType: spec.damageType,
          projectileType: spec.projectileType ?? 'PIERCE_BOLT',
          statusEffect: spec.statusEffect,
          pierceCount: 3
        });
        this.spawnCombatVFX(this.player.x, this.player.y, pointer.worldX, pointer.worldY, 'vfx_pierce');
      }
    }
  }

  public performClassSkill(slot: '1' | '2' | '3' | '4' | 'Q' | 'E') {
    const pointer = this.input.activePointer;
    const res = this.player.executeClassSkill(slot, pointer.worldX, pointer.worldY);
    if (!res.success || !res.spec) return;

    const spec = res.spec;
    this.events.emit('CHAT_LOG', 'SYSTEM', `⚡ ใช้สกิล [${spec.keySlot}] ${spec.name}!`);

    switch (spec.skillType) {
      case 'heal_self_party': {
        const healAmt = 90;
        this.player.stats.hp = Math.min(this.player.stats.maxHp, this.player.stats.hp + healAmt);
        this.player.stats.stamina = Math.min(this.player.stats.maxStamina, this.player.stats.stamina + 40);
        this.damageText.showHeal(this.player.x, this.player.y, healAmt);
        this.spawnImpactBurstAt(this.player.x, this.player.y - 20, 'vfx_aura_burst_lime');
        break;
      }

      case 'cleanse_buff': {
        this.player.statusEffects = [];
        this.player.stats.hp = Math.min(this.player.stats.maxHp, this.player.stats.hp + 60);
        this.damageText.showHeal(this.player.x, this.player.y, 60);
        this.spawnImpactBurstAt(this.player.x, this.player.y - 20, 'vfx_aura_burst_cyan');
        break;
      }

      case 'buff_self': {
        this.spawnImpactBurstAt(this.player.x, this.player.y - 20, 'vfx_aura_burst_magenta');
        if (spec.id.includes('iron_guard')) {
          this.player.stats.defense += 50;
          this.time.delayedCall(6000, () => {
            this.player.stats.defense = Math.max(10, this.player.stats.defense - 50);
          });
        } else if (spec.id.includes('undying')) {
          this.player.isAwakened = true;
          this.player.awakenedTimer = 6000;
        }
        break;
      }

      case 'buff_party': {
        const ring = this.add.graphics();
        ring.lineStyle(3, 0x05d9e8, 0.9);
        ring.strokeCircle(this.player.x, this.player.y, 30);
        this.tweens.add({
          targets: ring,
          scale: 4.5,
          alpha: 0,
          duration: 400,
          onComplete: () => ring.destroy()
        });
        this.player.stats.hp = Math.min(this.player.stats.maxHp, this.player.stats.hp + 120);
        this.damageText.showHeal(this.player.x, this.player.y, 120);
        break;
      }

      case 'melee_dash': {
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
        const dashDist = spec.range;
        this.player.setVelocity(Math.cos(angle) * 550, Math.sin(angle) * 380);
        this.time.delayedCall(220, () => this.player.setVelocity(0, 0));

        this.enemies.forEach(enemy => {
          if (enemy.isDead) return;
          const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
          if (d <= dashDist) {
            const dmgRes = CombatSystem.calculateDamage(this.player.stats, spec.baseDamage, spec.damageType, enemy.defense, true);
            const died = enemy.takeDamage(dmgRes.damage, spec.statusEffect);
            this.damageText.showDamage(enemy.x, enemy.y, dmgRes);
            if (died) this.handleEnemyKill(enemy);
          }
        });
        break;
      }

      case 'melee_aoe': {
        const radius = spec.range;
        const shockwave = this.add.graphics();
        shockwave.fillStyle(0xff2a6d, 0.35);
        shockwave.fillCircle(this.player.x, this.player.y, radius);
        shockwave.lineStyle(3, 0xffffff, 0.8);
        shockwave.strokeCircle(this.player.x, this.player.y, radius);
        this.tweens.add({
          targets: shockwave,
          alpha: 0,
          scale: 1.2,
          duration: 300,
          onComplete: () => shockwave.destroy()
        });

        this.enemies.forEach(enemy => {
          if (enemy.isDead) return;
          const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
          if (dist <= radius) {
            const dmgRes = CombatSystem.calculateDamage(this.player.stats, spec.baseDamage, spec.damageType, enemy.defense, true);
            const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            enemy.setVelocity(Math.cos(angle) * 260, Math.sin(angle) * 260);
            this.time.delayedCall(160, () => enemy.setVelocity(0, 0));

            const died = enemy.takeDamage(dmgRes.damage, spec.statusEffect);
            this.damageText.showDamage(enemy.x, enemy.y, dmgRes);
            if (died) this.handleEnemyKill(enemy);
          }
        });
        break;
      }

      case 'ranged_multi': {
        const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
        [-0.18, 0, 0.18].forEach(offset => {
          const targetX = this.player.x + Math.cos(baseAngle + offset) * spec.range;
          const targetY = this.player.y + Math.sin(baseAngle + offset) * spec.range;
          this.projectileManager.fire({
            x: this.player.x,
            y: this.player.y - 16,
            targetX,
            targetY,
            speed: this.player.classConfig.projectileSpeed ?? 600,
            range: spec.range,
            damage: spec.baseDamage,
            damageType: spec.damageType,
            projectileType: spec.projectileType ?? 'SLING_BALL',
            statusEffect: spec.statusEffect
          });
        });
        break;
      }

      case 'ranged_single':
      case 'ranged_pierce':
      case 'sonic_cone': {
        this.projectileManager.fire({
          x: this.player.x,
          y: this.player.y - 16,
          targetX: pointer.worldX,
          targetY: pointer.worldY,
          speed: this.player.classConfig.projectileSpeed ?? 580,
          range: spec.range,
          damage: spec.baseDamage,
          damageType: spec.damageType,
          projectileType: spec.projectileType ?? 'SLING_BALL',
          statusEffect: spec.statusEffect,
          pierceCount: spec.skillType === 'ranged_pierce' ? 4 : 1
        });
        break;
      }

      case 'ranged_ground_aoe': {
        this.projectileManager.fire({
          x: this.player.x,
          y: this.player.y - 16,
          targetX: pointer.worldX,
          targetY: pointer.worldY,
          speed: 400,
          range: spec.range,
          damage: spec.baseDamage,
          damageType: spec.damageType,
          projectileType: spec.projectileType ?? 'MOLOTOV',
          statusEffect: spec.statusEffect,
          isAoE: true,
          aoeRadius: 85
        });
        break;
      }

      case 'trap_place': {
        this.projectileManager.fire({
          x: pointer.worldX,
          y: pointer.worldY,
          targetX: pointer.worldX,
          targetY: pointer.worldY,
          speed: 0,
          range: 9999,
          damage: spec.baseDamage,
          damageType: spec.damageType,
          projectileType: spec.projectileType ?? 'CALTROPS',
          statusEffect: spec.statusEffect,
          isGroundTrap: true,
          trapDuration: 8000,
          pierceCount: 3
        });
        break;
      }
    }
  }

  private spawnImpactBurstAt(x: number, y: number, texture: string) {
    if (this.textures.exists(texture)) {
      const burst = this.add.image(x, y, texture);
      burst.setScale(0.5);
      burst.setDepth(y + 200);
      this.tweens.add({
        targets: burst,
        scale: 1.3,
        alpha: 0,
        duration: 220,
        onComplete: () => burst.destroy()
      });
    }
  }

  private spawnCombatVFX(fromX: number, fromY: number, toX: number, toY: number, texture: string) {
    const angle = Phaser.Math.Angle.Between(fromX, fromY, toX, toY);
    const fx = fromX + Math.cos(angle) * 35;
    const fy = fromY + Math.sin(angle) * 25;

    const vfx = this.add.image(fx, fy, texture);
    vfx.setRotation(angle);
    vfx.setDepth(fromY + 50);

    this.tweens.add({
      targets: vfx,
      alpha: 0,
      scale: 1.3,
      duration: 180,
      onComplete: () => vfx.destroy()
    });
  }

  private handleEnemyKill(enemy: Enemy) {
    this.events.emit('CHAT_LOG', 'SYSTEM', `คุณกำราบ ${enemy.enemyName} ได้สำเร็จ! ได้รับ ${enemy.expReward} EXP`);
    const leveledUp = StatsSystem.addExp(this.player.stats, enemy.expReward, this.player.factionId);
    if (leveledUp) {
      this.soundSynth.playLevelUp();
      this.damageText.showHeal(this.player.x, this.player.y, 999);
      this.events.emit('CHAT_LOG', 'SYSTEM', `🎉 เลเวลอัป! ตัวละครเลเวล ${this.player.stats.level}! ได้รับ 4 แต้มสเตตัส (กด TAB เพื่ออัปแต้ม)`);
    }
  }

  private interactWithNearbyNPC() {
    for (const npc of this.npcs) {
      if (npc.checkPlayerDistance(this.player.x, this.player.y)) {
        this.openNPCDialogue(npc);
        break;
      }
    }
  }

  public openNPCDialogue(npc: NPC) {
    const dialogue = npc.getDialogue((targetZone) => {
      this.fastTravelTo(targetZone);
    });
    this.events.emit('SHOW_DIALOGUE', dialogue);
  }

  private fastTravelTo(targetZone: string) {
    this.soundSynth.playDash();
    this.zoneManager.fastTravelToZone(targetZone);
  }
}

