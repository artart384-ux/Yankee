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

export class WorldScene extends Phaser.Scene {
  public player!: Player;
  public enemies: Enemy[] = [];
  public npcs: NPC[] = [];
  public currentZone: 'CROSSROADS' | 'APEX' | 'RUST_PORT' | 'NEON_ALLEY' = 'CROSSROADS';

  private damageText!: DamageTextManager;
  private soundSynth!: SoundSynthesizer;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private playerLight?: Phaser.GameObjects.PointLight;

  constructor() {
    super('WorldScene');
  }

  init(data: { playerName?: string; factionId?: FactionId; classId?: PlayerClassId }) {
    this.soundSynth = SoundSynthesizer.getInstance();
    this.soundSynth.startStreetSynthBGM();
  }

  create(data: { playerName?: string; factionId?: FactionId; classId?: PlayerClassId }) {
    const worldW = 2400;
    const worldH = 1800;

    this.physics.world.setBounds(0, 0, worldW, worldH);
    this.damageText = new DamageTextManager(this);

    // 0. ENABLE DYNAMIC 2D LIGHTING PIPELINE (Image 2 Inspired Cyberpunk Noir)
    this.lights.enable();
    this.lights.setAmbientColor(0x202436);

    // 1. BUILD STREET MAP & TILES
    this.buildMap(worldW, worldH);

    // 2. SPAWN PLAYER
    const playerName = data.playerName || 'Iron Spike';
    const factionId = data.factionId || 'GEARHEADS';
    const classId = data.classId || 'BRAWLER';

    this.player = new Player(this, 1200, 1000, playerName, factionId, classId);
    this.player.setPipeline('Light2D');

    // Attach dynamic spirit aura point light to player
    const auraColor = factionId === 'GEARHEADS' ? 0xff2a6d : factionId === 'ELITES' ? 0x05d9e8 : 0x00ff66;
    this.playerLight = this.lights.addPointLight(this.player.x, this.player.y, auraColor, 260, 2.0);

    // Setup Camera to follow player with smooth lerp
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.2);

    // 3. SPAWN NPCS & PROPS
    this.spawnNPCsAndProps();

    // 4. SPAWN TRAINING DUMMIES & ENEMIES
    this.spawnEnemies();

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
    this.keys.Q.on('down', () => this.player.executeDash(this.input.activePointer));
    this.keys.ONE.on('down', () => this.performAuraSkill());
    this.keys.TWO.on('down', () => this.performWeaponTech());
    this.keys.THREE.on('down', () => this.performSpiritBurst());
    this.keys.FOUR.on('down', () => this.performTonic());
    this.keys.E.on('down', () => this.performAwakening());
    this.keys.F.on('down', () => this.interactWithNearbyNPC());
    this.keys.TAB.on('down', (e: Event) => {
      e.preventDefault();
      this.events.emit('TOGGLE_PHONE');
    });
    this.keys.M.on('down', () => this.events.emit('TOGGLE_PHONE'));

    // 6. LAUNCH UI SCENE OVERLAY
    this.scene.launch('UIScene', { player: this.player, worldScene: this });
  }

  private buildMap(w: number, h: number) {
    // Ground base: Dark asphalt
    const bgTile = this.add.tileSprite(w / 2, h / 2, w, h, 'tileset_street');
    bgTile.setDepth(-100);
    bgTile.setPipeline('Light2D');

    // Draw Roads and Street Markings
    const roadGraphics = this.add.graphics();
    roadGraphics.setDepth(-50);
    roadGraphics.setPipeline('Light2D');

    // Crossroads Center Plaza (Safe Zone)
    roadGraphics.fillStyle(0x1a2133, 1);
    roadGraphics.fillRect(800, 750, 800, 600);
    roadGraphics.lineStyle(3, 0x05d9e8, 0.7);
    roadGraphics.strokeRect(800, 750, 800, 600);

    // Crosswalk zebra stripes
    for (let i = 0; i < 8; i++) {
      roadGraphics.fillStyle(0xffffff, 0.85);
      roadGraphics.fillRect(820 + i * 95, 760, 45, 14);
      roadGraphics.fillRect(820 + i * 95, 1326, 45, 14);
    }

    // Apex Ground Zero Arena (North / Upper Zone) - Danger Red Glow
    roadGraphics.fillStyle(0x280e1a, 1);
    roadGraphics.fillRect(600, 100, 1200, 550);
    roadGraphics.lineStyle(4, 0xff2a6d, 1);
    roadGraphics.strokeRect(600, 100, 1200, 550);

    // Wet Puddle Reflections in Apex Ground Zero
    const puddles = [[850, 420], [1480, 360], [1050, 240], [1320, 500]];
    puddles.forEach(([px, py]) => {
      const puddle = this.add.graphics();
      puddle.fillStyle(0x0e1b2d, 0.75);
      puddle.fillEllipse(px, py, 110, 42);
      puddle.lineStyle(1.5, 0x05d9e8, 0.45);
      puddle.strokeEllipse(px, py, 110, 42);
      puddle.setDepth(-46);
    });

    // Street Manholes with Steam Vents
    const manholes = [[780, 520], [1620, 520], [1200, 630]];
    manholes.forEach(([mx, my]) => {
      const mh = this.add.graphics();
      mh.fillStyle(0x242838, 1);
      mh.fillCircle(mx, my, 20);
      mh.lineStyle(2, 0x424a62, 1);
      mh.strokeCircle(mx, my, 20);
      mh.setDepth(-48);

      // Steam puffs rising up
      this.time.addEvent({
        delay: 2000 + Math.random() * 1500,
        loop: true,
        callback: () => {
          const puff = this.add.circle(mx + (Math.random() - 0.5) * 10, my, 6, 0xccccdd, 0.4);
          puff.setDepth(my);
          this.tweens.add({
            targets: puff,
            y: my - 35,
            scale: 2.5,
            alpha: 0,
            duration: 1600,
            onComplete: () => puff.destroy()
          });
        }
      });
    });

    // Dynamic Point Lights in Apex Ground Zero
    const apexLights = [
      this.lights.addPointLight(720, 220, 0xff2a6d, 360, 2.2),
      this.lights.addPointLight(1680, 220, 0xff2a6d, 360, 2.2),
      this.lights.addPointLight(720, 580, 0xff2a6d, 340, 2.0),
      this.lights.addPointLight(1680, 580, 0xff2a6d, 340, 2.0)
    ];
    this.tweens.add({
      targets: apexLights,
      intensity: 1.6,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Crossroads Safe Zone Center Emerald Light
    this.lights.addPointLight(1200, 1050, 0x00ff66, 420, 1.8);

    // Vocational Training Hall Amber Light
    this.lights.addPointLight(530, 980, 0xffd700, 360, 1.6);

    // Apex Warning Marquee
    this.add.text(1200, 140, '⚡ APEX GROUND ZERO ⚡ // [FREE PK ZONE] // WARNING: ENTER AT YOUR OWN RISK', {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ff2a6d',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(-40);

    // Crossroads Safe Zone Marquee
    this.add.text(1200, 780, '🛡️ CROSSROADS TRADE DISTRICT // [SAFE ZONE] // WEAPONS POWERED DOWN', {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#00ff66',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(-40);

    // Apex Perimeter Caution Barricades
    for (let x = 650; x <= 1750; x += 110) {
      if (x < 1140 || x > 1260) { // Leave entry gate in center
        const barrier = this.add.image(x, 650, 'barrier');
        barrier.setDepth(650);
        barrier.setPipeline('Light2D');
      }
    }

    // Vocational Classroom Wing (West Plaza)
    roadGraphics.fillStyle(0x352319, 0.9); // Warm Classroom Wood Parquet Floor
    roadGraphics.fillRect(320, 820, 420, 480);
    roadGraphics.lineStyle(2, 0xffd700, 0.8);
    roadGraphics.strokeRect(320, 820, 420, 480);

    this.add.text(530, 840, '🏫 อาชีวะนวบูรพา [VOCATIONAL TRAINING HALL]', {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(-40);
  }

  private spawnNPCsAndProps() {
    // 1. Crossroads NPCs
    const winTaxi = new NPC(this, 1000, 950, 'WIN_TAXI');
    const pawnShop = new NPC(this, 1400, 950, 'PAWN_VENDOR');
    this.npcs.push(winTaxi, pawnShop);

    // 2. Faction Leaders visiting the Crossroads Summit
    const missPoppy = new NPC(this, 900, 1150, 'MISS_POPPY');
    const elizabeth = new NPC(this, 1200, 1150, 'ELIZABETH');
    const yamato = new NPC(this, 1500, 1150, 'YAMATO');
    this.npcs.push(missPoppy, elizabeth, yamato);

    // 3. Tartarus Endgame Dungeon Portal in Apex Ground Zero (Pixel Crawler style)
    const portal = this.add.image(1200, 200, 'prop_dungeon_portal');
    portal.setScale(1.2);
    portal.setDepth(200);

    const portalSign = this.add.text(1200, 260, '💀 APEX UNDERGROUND TARTARUS\n[Lv.90-100 Endgame PvPvE]', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '12px',
      color: '#ff2a6d',
      align: 'center',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(210);

    // Pulsing aura on Tartarus portal
    this.tweens.add({
      targets: portal,
      alpha: 0.75,
      scale: 1.25,
      duration: 1200,
      yoyo: true,
      repeat: -1
    });

    // 4. City Vehicles from 2dcity
    const cyberCar = this.add.image(740, 1100, 'prop_cyber_car');
    cyberCar.setDepth(1100);

    const cyberTaxi = this.add.image(1080, 1020, 'prop_cyber_taxi');
    cyberTaxi.setDepth(1020);

    // 5. Classroom Desks & Computers from 2dclassroom
    const podium = this.add.image(420, 890, 'prop_teacher_podium');
    podium.setScale(0.8);
    podium.setDepth(890);

    const deskCoords = [
      [420, 980], [530, 980], [640, 980],
      [420, 1080], [530, 1080], [640, 1080]
    ];
    deskCoords.forEach(([dx, dy]) => {
      const desk = this.add.image(dx, dy, 'prop_school_desk');
      desk.setScale(0.75);
      desk.setDepth(dy);
    });

    const compCoords = [[440, 1190], [560, 1190]];
    compCoords.forEach(([cx, cy]) => {
      const comp = this.add.image(cx, cy, 'prop_computer_desk');
      comp.setScale(0.75);
      comp.setDepth(cy);
    });

    // 6. Street Props (Vending machines, street lamps, dumpsters)
    const vending1 = this.add.image(860, 900, 'vending_machine').setInteractive({ useHandCursor: true });
    vending1.setDepth(900);
    vending1.on('pointerdown', () => {
      this.soundSynth.playUI();
      this.player.stats.hp = this.player.stats.maxHp;
      this.player.stats.stamina = this.player.stats.maxStamina;
      this.player.stats.aura = this.player.stats.maxAura;
      this.damageText.showHeal(this.player.x, this.player.y, 999);
      this.events.emit('CHAT_LOG', 'SYSTEM', 'ดื่มน้ำโซดาเย็นเจี๊ยบจากตู้ขายน้ำอัตโนมัติ ฟื้นฟู HP/Stamina/Aura เต็มหลอด!');
    });

    const lampPositions = [
      [820, 800], [1580, 800], [820, 1300], [1580, 1300],
      [700, 300], [1700, 300], [1200, 320]
    ];
    lampPositions.forEach(([lx, ly]) => {
      const lamp = this.add.image(lx, ly, 'street_lamp');
      lamp.setDepth(ly);
    });

    // Street Dumpsters with tags
    const dumpsters = [[770, 960], [1630, 960], [620, 450], [1780, 450]];
    dumpsters.forEach(([dx, dy]) => {
      const bin = this.add.image(dx, dy, 'trash_bin');
      bin.setDepth(dy);
    });
  }

  private spawnEnemies() {
    // 1. Bulky Apex Enforcers (Raid Mini-Bosses in Apex Ground Zero)
    const enforcer1 = new Enemy(this, 1000, 280, 'APEX_ENFORCER', '⚡ ผู้คุมกฎเหล็กเอเปกซ์ (Apex Enforcer Alpha)');
    enforcer1.setTarget(this.player);
    enforcer1.setPipeline('Light2D');

    const enforcer2 = new Enemy(this, 1400, 280, 'APEX_ENFORCER', '⚡ ผู้คุมกฎกระบองยักษ์ (Apex Enforcer Beta)');
    enforcer2.setTarget(this.player);
    enforcer2.setPipeline('Light2D');

    this.enemies.push(enforcer1, enforcer2);

    // 2. Training Dummies in Crossroads training court
    const dummy1 = new Enemy(this, 1100, 900, 'DUMMY', 'หุ่นซ้อมสายฟัน [Slash Dummy]');
    dummy1.setPipeline('Light2D');
    const dummy2 = new Enemy(this, 1300, 900, 'DUMMY', 'หุ่นซ้อมสายแทง [Pierce Dummy]');
    dummy2.setPipeline('Light2D');
    this.enemies.push(dummy1, dummy2);

    // 3. Delinquent Thugs patrolling Apex Ground Zero
    const thugSpawns = [
      [850, 350], [1050, 420], [1350, 380], [1550, 460],
      [950, 250], [1450, 260]
    ];
    thugSpawns.forEach(([tx, ty], idx) => {
      const thug = new Enemy(this, tx, ty, 'THUG', `เด็กเกเรตรอกมืด #${idx + 1}`);
      thug.setTarget(this.player);
      thug.setPipeline('Light2D');
      this.enemies.push(thug);
    });

    // 4. Security Drones in Apex Ground Zero
    const droneSpawns = [[750, 200], [1200, 220], [1650, 200]];
    droneSpawns.forEach(([dx, dy]) => {
      const drone = new Enemy(this, dx, dy, 'DRONE');
      drone.setTarget(this.player);
      drone.setPipeline('Light2D');
      this.enemies.push(drone);
    });
  }

  public update(time: number, delta: number) {
    if (!this.player) return;

    // Update Player
    this.player.update(time, delta, this.cursors, this.keys, this.input.activePointer);

    // Update Player Dynamic Spirit Aura Light
    if (this.playerLight) {
      this.playerLight.x = this.player.x;
      this.playerLight.y = this.player.y;
      if (this.player.isDashing || this.player.isAwakened) {
        this.playerLight.radius = 340;
        this.playerLight.intensity = 2.8;
      } else {
        this.playerLight.radius = 240;
        this.playerLight.intensity = 1.8;
      }
    }

    // Update Zone (Safe vs Free PK)
    if (this.player.y < 650) {
      this.currentZone = 'APEX';
    } else {
      this.currentZone = 'CROSSROADS';
    }

    // Update Enemies & Dummies
    this.enemies.forEach(e => e.update(time, delta));

    // Update NPCs & player interaction proximity
    this.npcs.forEach(npc => npc.checkPlayerDistance(this.player.x, this.player.y));
  }

  // --- COMBAT & ATTACK LOGIC ---

  private performPlayerAttack(slot: 'LCLICK' | 'RCLICK', pointer: Phaser.Input.Pointer) {
    let success = false;
    let baseDamage = 25;
    let range = 65;
    let arc = Math.PI * 0.7; // 120 degree cone

    if (slot === 'LCLICK') {
      success = this.player.executePrimaryAttack(pointer.worldX, pointer.worldY);
      baseDamage = 25 + this.player.comboStep * 12;
      range = 75;
    } else {
      success = this.player.executeHeavyStrike(pointer.worldX, pointer.worldY);
      baseDamage = 65;
      range = 95;
    }

    if (!success) return;

    // Spawn combat slash/strike VFX
    this.spawnCombatVFX(this.player.x, this.player.y, pointer.worldX, pointer.worldY, slot === 'LCLICK' ? 'vfx_slash' : 'vfx_strike');

    // Hitbox check against enemies
    const angleToMouse = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);

    this.enemies.forEach(enemy => {
      if (enemy.isDead) return;

      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist <= range) {
        const angleToEnemy = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        const diff = Phaser.Math.Angle.Wrap(angleToEnemy - angleToMouse);

        if (Math.abs(diff) < arc / 2) {
          // HIT CONFIRMED!
          const result = CombatSystem.calculateDamage(
            this.player.stats,
            baseDamage,
            slot === 'LCLICK' ? 'STRIKE' : 'STRIKE',
            enemy.defense,
            this.player.isAwakened
          );

          // Knockback
          enemy.setVelocity(Math.cos(angleToEnemy) * 150, Math.sin(angleToEnemy) * 150);
          this.time.delayedCall(150, () => enemy.setVelocity(0, 0));

          // Apply damage
          const died = enemy.takeDamage(result.damage, result.statusApplied);
          this.damageText.showDamage(enemy.x, enemy.y, result);

          // Log in Chat
          this.events.emit('CHAT_LOG', 'SYSTEM', `คุณโจมตี ${enemy.enemyName} ด้วย ${CombatSystem.getDamageTypeName(result.damageType)} สร้างดาเมจ ${result.damage}!`);

          if (died) {
            this.handleEnemyKill(enemy);
          }
        }
      }
    });
  }

  private performAuraSkill() {
    if (!this.player.executeAuraSkill()) return;

    const pointer = this.input.activePointer;
    this.spawnCombatVFX(this.player.x, this.player.y, pointer.worldX, pointer.worldY, 'vfx_slash');

    // Wide area wave attack
    const angleToMouse = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
    this.enemies.forEach(enemy => {
      if (enemy.isDead) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist <= 160) {
        const angleToEnemy = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        const diff = Phaser.Math.Angle.Wrap(angleToEnemy - angleToMouse);
        if (Math.abs(diff) < 0.9) {
          const res = CombatSystem.calculateDamage(this.player.stats, 65, 'SLASH', enemy.defense, true);
          const died = enemy.takeDamage(res.damage, 'BLEED');
          this.damageText.showDamage(enemy.x, enemy.y, res);
          if (died) this.handleEnemyKill(enemy);
        }
      }
    });
  }

  private performWeaponTech() {
    if (!this.player.executeWeaponTech()) return;

    const pointer = this.input.activePointer;
    this.spawnCombatVFX(this.player.x, this.player.y, pointer.worldX, pointer.worldY, 'vfx_pierce');

    // Long piercing line attack
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.worldX, pointer.worldY);
    this.enemies.forEach(enemy => {
      if (enemy.isDead) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist <= 220) {
        const enemyAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        if (Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - angle)) < 0.35) {
          const res = CombatSystem.calculateDamage(this.player.stats, 95, 'PIERCE', enemy.defense, true);
          const died = enemy.takeDamage(res.damage, 'BURN');
          this.damageText.showDamage(enemy.x, enemy.y, res);
          if (died) this.handleEnemyKill(enemy);
        }
      }
    });
  }

  private performSpiritBurst() {
    if (!this.player.executeSpiritBurst()) return;

    // 360 AoE Explosion
    const shockwave = this.add.image(this.player.x, this.player.y, 'vfx_strike');
    shockwave.setScale(0.5);
    shockwave.setDepth(this.player.y + 10);
    this.tweens.add({
      targets: shockwave,
      scale: 3.0,
      alpha: 0,
      duration: 400,
      onComplete: () => shockwave.destroy()
    });

    this.enemies.forEach(enemy => {
      if (enemy.isDead) return;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (dist <= 180) {
        const res = CombatSystem.calculateDamage(this.player.stats, 130, 'STRIKE', enemy.defense, true);
        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
        enemy.setVelocity(Math.cos(angle) * 280, Math.sin(angle) * 280);
        this.time.delayedCall(200, () => enemy.setVelocity(0, 0));

        const died = enemy.takeDamage(res.damage, 'FRACTURE');
        this.damageText.showDamage(enemy.x, enemy.y, res);
        if (died) this.handleEnemyKill(enemy);
      }
    });
  }

  private performTonic() {
    if (this.player.executeTonic()) {
      this.damageText.showHeal(this.player.x, this.player.y, 60);
      this.events.emit('CHAT_LOG', 'SYSTEM', 'ดื่มเครื่องดื่มชูกำลังตรากระทิงฟ้า ฟื้นฟู 60 HP และ 50 Stamina!');
    }
  }

  private performAwakening() {
    if (this.player.executeAwakening()) {
      this.events.emit('CHAT_LOG', 'FACTION', '⚡ เข้าสู่โหมดสถิตวิญญาณสปิริตออร่า! ความเร็วและพลังโจมตีเพิ่มขึ้นมหาศาล!');
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
    switch (targetZone) {
      case 'CROSSROADS':
        this.player.setPosition(1200, 1000);
        break;
      case 'RUST_PORT':
        this.player.setPosition(880, 1150);
        break;
      case 'NEON_ALLEY':
        this.player.setPosition(1520, 1150);
        break;
      case 'SAPPHIRE':
        this.player.setPosition(1200, 1150);
        break;
      case 'APEX':
        this.player.setPosition(1200, 500); // Danger free PK zone!
        break;
    }
  }
}

