import Phaser from 'phaser';
import { WorldScene } from '../scenes/WorldScene';
import { SCHOOL_ZONES, SchoolZoneData, PortalConfig } from '../data/SchoolZonesConfig';
import { NPC } from '../entities/NPC';
import { Enemy, EnemyType } from '../entities/Enemy';
import { IsometricGrid } from './IsometricGrid';
import { ZoneBoundaryManager } from './ZoneBoundaryManager';

export class SchoolZoneManager {
  private scene: WorldScene;
  public currentZoneId: string = 'zone_1';
  public currentZoneData!: SchoolZoneData;
  public boundaryManager: ZoneBoundaryManager;

  private roomElements: Phaser.GameObjects.GameObject[] = [];
  public roomObstacles!: Phaser.Physics.Arcade.StaticGroup;
  private portals: {
    config: PortalConfig;
    zone: Phaser.GameObjects.Zone;
    ring: Phaser.GameObjects.Graphics;
    label: Phaser.GameObjects.Text;
    icon: Phaser.GameObjects.Text;
  }[] = [];

  private ambientOverlay?: Phaser.GameObjects.Graphics;
  private isTransitioning: boolean = false;
  private transitionCooldown: number = 0;

  constructor(scene: WorldScene) {
    this.scene = scene;
    this.boundaryManager = new ZoneBoundaryManager(scene);
    this.roomObstacles = scene.physics.add.staticGroup();
  }

  public getActiveZoneData(): SchoolZoneData {
    return this.currentZoneData;
  }

  public loadZone(zoneId: string, spawnPos?: { x: number; y: number }, skipFade: boolean = false) {
    const zoneData = SCHOOL_ZONES[zoneId];
    if (!zoneData) {
      console.warn(`[SchoolZoneManager] Zone ${zoneId} not found!`);
      return;
    }

    if (!skipFade) {
      this.isTransitioning = true;
      this.scene.cameras.main.fadeOut(200, 0, 0, 0);
      this.scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.buildZoneInternal(zoneData, spawnPos);
        this.scene.cameras.main.fadeIn(200, 0, 0, 0);
        this.scene.time.delayedCall(300, () => {
          this.isTransitioning = false;
          this.transitionCooldown = 500;
        });
      });
    } else {
      this.buildZoneInternal(zoneData, spawnPos);
    }
  }

  private buildZoneInternal(zoneData: SchoolZoneData, spawnPos?: { x: number; y: number }) {
    this.currentZoneId = zoneData.id;
    this.currentZoneData = zoneData;
    this.clearCurrentRoom();

    const roomW = zoneData.mapWidth ?? 1600;
    const roomH = zoneData.mapHeight ?? 1200;

    // 1. SET WORLD & CAMERA BOUNDARIES VIA ZONE BOUNDARY MANAGER
    this.boundaryManager.applyZoneBoundaries(zoneData);

    // 2. BUILD ISOMETRIC ROOM FLOOR
    this.buildRoomFloor(zoneData, roomW, roomH);

    // 3. BUILD CUTAWAY ROOM WALLS & PERIMETERS
    this.buildRoomPerimeters(zoneData, roomW, roomH);

    // 4. SPAWN ROOM PROPS & OBSTACLES
    this.spawnRoomProps(zoneData);

    // 5. SPAWN NPCS
    this.spawnRoomNPCs(zoneData);

    // 6. SPAWN MONSTERS / DUMMIES
    this.spawnRoomMonsters(zoneData);

    // 7. SPAWN GLOWING ARCADE PORTALS
    this.spawnRoomPortals(zoneData);

    // 8. AMBIENT LIGHTING OVERLAY (Sunset dusk / wet restroom / neon glow)
    this.applyAmbientLighting(zoneData, roomW, roomH);

    // 9. REPOSITION PLAYER
    const targetX = spawnPos?.x ?? 800;
    const targetY = spawnPos?.y ?? 600;
    if (this.scene.player) {
      this.scene.player.setPosition(targetX, targetY);
      this.scene.player.setVelocity(0, 0);
      this.scene.cameras.main.startFollow(this.scene.player, true, 0.1, 0.1);
    }

    // 10. SETUP COLLIDERS
    if (this.scene.player) {
      this.scene.physics.add.collider(this.scene.player, this.roomObstacles);
    }
    this.scene.physics.add.collider(this.scene.enemies, this.roomObstacles);

    // 11. EMIT EVENTS & CHAT NOTIFICATION
    this.scene.events.emit('ZONE_CHANGED', zoneData);
    this.scene.events.emit(
      'CHAT_LOG',
      'SYSTEM',
      `📍 เข้าสู่พื้นที่: ${zoneData.name} // [${zoneData.subtitle}]`
    );
  }

  private getZoneFloorTexture(zoneId: string, floorType: string): string {
    if (zoneId === 'zone_6') return 'tile_school_wood_parquet';
    if (zoneId === 'zone_2' || zoneId === 'zone_5' || zoneId === 'zone_8') return 'tile_school_corridor_wood';
    if (zoneId === 'zone_4') return 'tile_school_cafeteria_tile';
    if (zoneId === 'zone_7') return 'tile_school_restroom_tile';
    if (zoneId === 'zone_9') return 'tile_school_gym_parquet';
    if (zoneId === 'zone_1' || zoneId === 'zone_3') return 'tile_school_dirty_asphalt';
    if (zoneId === 'zone_10') return 'tile_iso_concrete';

    if (floorType === 'wood_parquet') return 'tile_school_wood_parquet';
    if (floorType === 'wet_tiles') return 'tile_school_restroom_tile';
    if (floorType === 'tiles') return 'tile_school_cafeteria_tile';
    if (floorType === 'asphalt' || floorType === 'dirty_concrete') return 'tile_school_dirty_asphalt';
    return 'tile_iso_concrete';
  }

  private buildRoomFloor(zoneData: SchoolZoneData, w: number, h: number) {
    // 1. Base Dark Floor Bed
    const bg = this.scene.add.rectangle(w / 2, h / 2, w + 200, h + 200, 0x0a0c14);
    bg.setDepth(-500);
    this.roomElements.push(bg);

    // 2. Select authentic Japanese school floor tile texture
    const floorTex = this.getZoneFloorTexture(zoneData.id, zoneData.floorType);
    const originX = 800;
    const originY = 140;

    // 3. Tile entire room surface seamlessly across 1600x1200 coordinates
    for (let r = -30; r <= 60; r++) {
      for (let c = -30; c <= 60; c++) {
        const isoX = (c - r) * 32 + originX;
        const isoY = (c + r) * 16 + originY;

        // Skip tiles outside room rectangle + margin
        if (isoX < -64 || isoX > w + 64 || isoY < -64 || isoY > h + 64) continue;

        const tile = this.scene.add.image(isoX, isoY, floorTex);
        tile.setOrigin(0.5, 0.5);
        tile.setDepth(-400 + (c + r) * 0.01);

        if (zoneData.ambientTint && zoneData.ambientTint !== 0xffffff) {
          tile.setTint(zoneData.ambientTint);
        }
        this.roomElements.push(tile);
      }
    }

    // 4. Atmospheric floor decals (puddles, oil stains, skylines)
    const floorDecals = this.scene.add.graphics();
    floorDecals.setDepth(-380);
    this.roomElements.push(floorDecals);

    if (zoneData.id === 'zone_7') {
      // Restroom wet glossy water puddles
      floorDecals.fillStyle(0x4cc9f0, 0.22);
      for (let i = 0; i < 18; i++) {
        const px = 300 + (i * 137) % 1000;
        const py = 350 + (i * 93) % 650;
        floorDecals.fillEllipse(px, py, 54, 22);
      }
    } else if (zoneData.id === 'zone_1' || zoneData.id === 'zone_3') {
      // School gate / bike shed oil & tire stains
      floorDecals.fillStyle(0x0e0e14, 0.45);
      for (let i = 0; i < 16; i++) {
        const px = 280 + (i * 151) % 1040;
        const py = 320 + (i * 113) % 680;
        floorDecals.fillEllipse(px, py, 60, 24);
      }
    }

    // Rooftop Skyline Backdrop for Zone 10
    if (zoneData.id === 'zone_10') {
      const skyline = this.scene.add.image(800, 140, 'bg_distant_city_skyline');
      skyline.setScale(1.2);
      skyline.setDepth(-350);
      this.roomElements.push(skyline);
    }
  }

  private buildRoomPerimeters(zoneData: SchoolZoneData, w: number, h: number) {
    // 1. Room Edge Boundaries (Outer perimeter walls to prevent walking off room)
    const bounds = [
      { x: w / 2, y: 30, width: w, height: 60 },
      { x: w / 2, y: h - 30, width: w, height: 60 },
      { x: 30, y: h / 2, width: 60, height: h },
      { x: w - 30, y: h / 2, width: 60, height: h }
    ];

    bounds.forEach(b => {
      const zone = this.scene.add.zone(b.x, b.y, b.width, b.height);
      this.scene.physics.add.existing(zone, true);
      this.roomObstacles.add(zone);
      this.roomElements.push(zone);
    });

    // 2. North-West and North-East 2.5D Isometric Cutaway Walls
    const originX = 800;
    const originY = 160;
    const segmentCount = 10;

    // Helper to test if a point is near an exit portal
    const isNearPortal = (x: number, y: number) => {
      return zoneData.portals.some(p => Phaser.Math.Distance.Between(x, y, p.x, p.y) < 80);
    };

    // --- NORTH-WEST WALL (Exterior Window Wall / Fences) ---
    for (let i = 1; i <= segmentCount; i++) {
      const fx = originX - i * 64;
      const fy = originY + i * 32;

      let wallTex = 'prop_iso_school_wall_wood';
      let flipX = false;
      let scale = 1.0;

      if (zoneData.id === 'zone_6') {
        // Classroom 3-D: Japanese school windows with afternoon sunbeams alternating with wood wall
        wallTex = i % 2 === 0 ? 'prop_iso_school_window' : 'prop_iso_school_wall_wood';
      } else if (zoneData.id === 'zone_2' || zoneData.id === 'zone_5' || zoneData.id === 'zone_8') {
        // Corridors & Stairwell: School windows and wooden wainscoted walls
        wallTex = i % 2 === 0 ? 'prop_iso_school_window' : 'prop_iso_school_wall_wood';
      } else if (zoneData.id === 'zone_7') {
        // Restroom: Ceramic tiled walls with cracked mirrors
        wallTex = 'prop_iso_restroom_wall';
        flipX = i % 2 === 1;
      } else if (zoneData.id === 'zone_4') {
        // Cafeteria: Large windows and wood wainscot walls
        wallTex = i % 2 === 0 ? 'prop_iso_school_window' : 'prop_iso_school_wall_wood';
      } else if (zoneData.id === 'zone_9') {
        // Gymnasium: Gym windows and walls
        wallTex = i % 2 === 0 ? 'prop_iso_school_window' : 'prop_iso_concrete_wall';
      } else if (zoneData.id === 'zone_1') {
        // School Entrance: Sliding steel school gate & chainlink fence
        if (i === 3 || i === 4) wallTex = 'prop_iso_school_gate';
        else wallTex = i % 2 === 0 ? 'prop_iso_chainlink_fence' : 'prop_iso_concrete_wall';
      } else if (zoneData.id === 'zone_3') {
        // Bike Shed: Chainlink fences & concrete graffiti walls
        wallTex = i % 2 === 0 ? 'prop_iso_chainlink_fence' : 'prop_iso_concrete_wall';
      } else if (zoneData.id === 'zone_10') {
        // Rooftop Summit: Rusted chainlink fence with barbed wire overlooking skyline
        wallTex = 'prop_iso_chainlink_fence';
      }

      const wall = this.scene.add.image(fx, fy, wallTex);
      wall.setOrigin(0.5, 0.85);
      if (flipX) wall.setFlipX(true);
      if (scale !== 1.0) wall.setScale(scale);
      this.scene.depthSystem.register(wall);
      this.roomElements.push(wall);

      // Add physics collider if not blocking a zone portal
      if (!isNearPortal(fx, fy)) {
        const col = this.scene.add.zone(fx, fy, 60, 28);
        this.scene.physics.add.existing(col, true);
        this.roomObstacles.add(col);
        this.roomElements.push(col);
      }
    }

    // --- NORTH-EAST WALL (Interior Doors, Blackboard, Lockers, Notices) ---
    for (let i = 1; i <= segmentCount; i++) {
      const wx = originX + i * 64;
      const wy = originY + i * 32;

      let wallTex = 'prop_iso_school_wall_wood';
      let flipX = false;
      let scale = 1.0;

      if (zoneData.id === 'zone_6') {
        // Classroom 3-D: Chalkboard, Sliding Doors "3年D組", Bulletin Board & Shoe Lockers
        if (i === 1) {
          wallTex = 'prop_iso_school_chalkboard'; // Iconic Delinquent Chalkboard
          scale = 1.05;
        } else if (i === 3 || i === 7) {
          wallTex = 'prop_iso_school_door'; // Sliding Door "3年D組"
        } else if (i === 5) {
          wallTex = 'prop_iso_bulletin_board'; // Delinquent cork bulletin board
        } else if (i === 9) {
          wallTex = 'prop_iso_shoe_lockers'; // Shoe cubbies
        } else {
          wallTex = 'prop_iso_school_wall_wood';
        }
      } else if (zoneData.id === 'zone_2' || zoneData.id === 'zone_5' || zoneData.id === 'zone_8') {
        // Corridors: Sliding Classroom Doors, Shoe Lockers (Geta-bako), Bulletin Boards
        if (i === 2 || i === 6) {
          wallTex = 'prop_iso_shoe_lockers';
        } else if (i === 4 || i === 8) {
          wallTex = 'prop_iso_school_door';
        } else if (i === 5) {
          wallTex = 'prop_iso_bulletin_board';
        } else {
          wallTex = 'prop_iso_school_wall_wood';
        }
      } else if (zoneData.id === 'zone_7') {
        // Restroom: Ceramic tiled walls with cracked mirrors & pipes
        wallTex = 'prop_iso_restroom_wall';
        flipX = i % 2 === 0;
      } else if (zoneData.id === 'zone_4') {
        // Cafeteria: Bulletin boards, doors, and wood wainscot walls
        if (i === 2 || i === 6) wallTex = 'prop_iso_bulletin_board';
        else if (i === 4) wallTex = 'prop_iso_school_door';
        else wallTex = 'prop_iso_school_wall_wood';
      } else if (zoneData.id === 'zone_9') {
        // Gymnasium: Concrete walls and fences
        wallTex = i % 2 === 0 ? 'prop_iso_concrete_wall' : 'prop_iso_chainlink_fence';
      } else if (zoneData.id === 'zone_1' || zoneData.id === 'zone_3') {
        // School Gate & Bike Shed: Graffiti concrete walls and chainlink fences
        wallTex = i % 2 === 0 ? 'prop_iso_concrete_wall' : 'prop_iso_chainlink_fence';
        if (i % 2 === 0) flipX = true;
      } else if (zoneData.id === 'zone_10') {
        // Rooftop: Concrete parapet wall with graffiti
        wallTex = 'prop_iso_concrete_wall';
        if (i % 2 === 0) flipX = true;
      }

      const wall = this.scene.add.image(wx, wy, wallTex);
      wall.setOrigin(0.5, 0.85);
      if (flipX) wall.setFlipX(true);
      if (scale !== 1.0) wall.setScale(scale);
      this.scene.depthSystem.register(wall);
      this.roomElements.push(wall);

      // Add physics collider if not blocking an exit portal
      if (!isNearPortal(wx, wy)) {
        const col = this.scene.add.zone(wx, wy, 60, 28);
        this.scene.physics.add.existing(col, true);
        this.roomObstacles.add(col);
        this.roomElements.push(col);
      }
    }

    // --- NORTH APEX CORNER WALL (Back corner where NW and NE meet) ---
    if (!isNearPortal(originX, originY)) {
      let apexTex = 'prop_iso_school_wall_wood';
      if (zoneData.id === 'zone_7') apexTex = 'prop_iso_restroom_wall';
      else if (zoneData.id === 'zone_1' || zoneData.id === 'zone_3' || zoneData.id === 'zone_10') apexTex = 'prop_iso_concrete_wall';

      const apexWall = this.scene.add.image(originX, originY, apexTex);
      apexWall.setOrigin(0.5, 0.85);
      this.scene.depthSystem.register(apexWall);
      this.roomElements.push(apexWall);

      const apexCol = this.scene.add.zone(originX, originY, 60, 28);
      this.scene.physics.add.existing(apexCol, true);
      this.roomObstacles.add(apexCol);
      this.roomElements.push(apexCol);
    }
  }

  private spawnRoomProps(zoneData: SchoolZoneData) {
    zoneData.props.forEach(p => {
      const img = this.scene.add.image(p.x, p.y, p.texture);
      if (p.scale) img.setScale(p.scale);
      if (p.flipX) img.setFlipX(p.flipX);
      img.setOrigin(0.5, 0.85);
      this.scene.depthSystem.register(img);
      this.roomElements.push(img);

      if (p.isObstacle) {
        const ow = p.obstacleWidth ?? (img.width * (p.scale ?? 1) * 0.75);
        const oh = p.obstacleHeight ?? 24;
        const obstacleZone = this.scene.add.zone(p.x, p.y, ow, oh);
        this.scene.physics.add.existing(obstacleZone, true);
        this.roomObstacles.add(obstacleZone);
        this.roomElements.push(obstacleZone);
      }

      if (p.interactive) {
        img.setInteractive({ useHandCursor: true });
        img.on('pointerdown', () => {
          this.scene.soundSynth.playUI();
          if (p.interactAction === 'HEAL') {
            if (this.scene.player) {
              this.scene.player.stats.hp = this.scene.player.stats.maxHp;
              this.scene.player.stats.stamina = this.scene.player.stats.maxStamina;
              this.scene.player.stats.aura = this.scene.player.stats.maxAura;
              this.scene.damageText.showHeal(this.scene.player.x, this.scene.player.y, 999);
            }
            this.scene.events.emit('CHAT_LOG', 'SYSTEM', '🥤 ดื่มน้ำเย็นเจี๊ยบจากตู้ขายน้ำอัตโนมัติ ฟื้นฟู HP/Stamina/Aura เต็มหลอด!');
          } else if (p.interactMessage) {
            this.scene.events.emit('CHAT_LOG', 'SYSTEM', p.interactMessage);
          }
        });
      }
    });
  }

  private spawnRoomNPCs(zoneData: SchoolZoneData) {
    zoneData.npcs.forEach(n => {
      const npc = new NPC(this.scene, n.x, n.y, n.npcType);
      this.scene.npcs.push(npc);
      this.scene.depthSystem.register(npc);
      this.roomElements.push(npc);
    });
  }

  private spawnRoomMonsters(zoneData: SchoolZoneData) {
    zoneData.monsters.forEach(m => {
      let enemyType: EnemyType = 'THUG';
      if (m.monsterId.startsWith('dummy')) enemyType = 'DUMMY';
      else if (m.monsterId.startsWith('drone')) enemyType = 'DRONE';
      else if (m.monsterId === 'boss_serizawa') enemyType = 'ROOFTOP_KING';
      else if (m.isMiniBoss) enemyType = 'APEX_ENFORCER';

      if (m.count === 1 && m.x !== undefined && m.y !== undefined) {
        const enemy = new Enemy(this.scene, m.x, m.y, enemyType, m.name, m.level, m.isMiniBoss);
        if (this.scene.player) enemy.setTarget(this.scene.player);
        this.scene.enemies.push(enemy);
        this.scene.depthSystem.register(enemy);
        this.roomElements.push(enemy);
      } else {
        // Distribute squad
        for (let i = 0; i < m.count; i++) {
          const spreadX = 550 + (i % 4) * 160 + (Math.random() - 0.5) * 40;
          const spreadY = 480 + Math.floor(i / 4) * 140 + (Math.random() - 0.5) * 40;
          const enemy = new Enemy(this.scene, spreadX, spreadY, enemyType, `${m.name} #${i + 1}`, m.level, m.isMiniBoss);
          if (this.scene.player) enemy.setTarget(this.scene.player);
          this.scene.enemies.push(enemy);
          this.scene.depthSystem.register(enemy);
          this.roomElements.push(enemy);
        }
      }
    });
  }

  private spawnRoomPortals(zoneData: SchoolZoneData) {
    this.portals = [];

    zoneData.portals.forEach(p => {
      // 1. Arcade Zone trigger
      const zone = this.scene.add.zone(p.x, p.y, 70, 50);
      this.scene.physics.add.existing(zone, true);
      this.roomElements.push(zone);

      // 2. Pulsing Neon Isometric Ring on Floor
      const ring = this.scene.add.graphics();
      ring.setDepth(-200);
      this.drawPortalRing(ring, p.x, p.y, zoneData.bannerColor);
      this.roomElements.push(ring);

      this.scene.tweens.add({
        targets: ring,
        alpha: { from: 0.5, to: 0.95 },
        scaleX: { from: 0.95, to: 1.05 },
        scaleY: { from: 0.95, to: 1.05 },
        duration: 800,
        yoyo: true,
        repeat: -1
      });

      // 3. Floating Holographic Arrow & Label
      const arrowChar = p.direction === 'UP' ? '▲' : p.direction === 'DOWN' ? '▼' : p.direction === 'LEFT' ? '◄' : '►';
      const icon = this.scene.add.text(p.x, p.y - 42, arrowChar, {
        fontFamily: 'Chakra Petch, sans-serif',
        fontSize: '22px',
        color: zoneData.bannerColor,
        stroke: '#000000',
        strokeThickness: 4
      }).setOrigin(0.5).setDepth(2000);
      this.roomElements.push(icon);

      const label = this.scene.add.text(p.x, p.y - 68, p.label, {
        fontFamily: 'Chakra Petch, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: '#111520ee',
        padding: { x: 8, y: 4 },
        stroke: '#000000',
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(2000);
      this.roomElements.push(label);

      // Bobbing animation for label & icon
      this.scene.tweens.add({
        targets: [icon, label],
        y: '-=8',
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.portals.push({ config: p, zone, ring, label, icon });
    });
  }

  private drawPortalRing(g: Phaser.GameObjects.Graphics, x: number, y: number, colorHex: string) {
    g.clear();
    const color = Phaser.Display.Color.HexStringToColor(colorHex).color;

    // Outer glow ellipse
    g.fillStyle(color, 0.2);
    g.fillEllipse(x, y, 90, 42);

    // Inner bright neon rim
    g.lineStyle(3, color, 0.9);
    g.strokeEllipse(x, y, 76, 34);

    g.lineStyle(1.5, 0xffffff, 0.7);
    g.strokeEllipse(x, y, 56, 24);
  }

  private applyAmbientLighting(zoneData: SchoolZoneData, w: number, h: number) {
    if (this.ambientOverlay) {
      this.ambientOverlay.destroy();
    }

    if (zoneData.ambientTint === 0xffffff) return;

    this.ambientOverlay = this.scene.add.graphics();
    this.ambientOverlay.fillStyle(zoneData.ambientTint, 0.12);
    this.ambientOverlay.fillRect(0, 0, w, h);
    this.ambientOverlay.setDepth(3000);
    this.ambientOverlay.setScrollFactor(0);
  }

  public update(time: number, delta: number) {
    if (this.transitionCooldown > 0) {
      this.transitionCooldown -= delta;
      return;
    }

    if (this.isTransitioning || !this.scene.player) return;

    // Check player contact with portals
    const playerX = this.scene.player.x;
    const playerY = this.scene.player.y;

    for (const p of this.portals) {
      const dist = Phaser.Math.Distance.Between(playerX, playerY, p.config.x, p.config.y);
      if (dist < 46) {
        // Trigger Portal Transition!
        this.triggerPortalTransition(p.config);
        break;
      }
    }
  }

  private triggerPortalTransition(portal: PortalConfig) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    this.scene.soundSynth.playPierce();
    this.scene.cameras.main.fadeOut(200, 0, 0, 0);

    this.scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.loadZone(portal.targetZone, { x: portal.spawnX, y: portal.spawnY }, true);
      this.scene.cameras.main.fadeIn(200, 0, 0, 0);

      this.scene.time.delayedCall(300, () => {
        this.isTransitioning = false;
        this.transitionCooldown = 600;
      });
    });
  }

  public fastTravelToZone(targetZone: string) {
    // Map shortcut names
    let zoneId = targetZone;
    if (targetZone === 'APEX' || targetZone === 'ROOFTOP') zoneId = 'zone_10';
    else if (targetZone === 'CROSSROADS') zoneId = 'zone_1';
    else if (targetZone === 'RUST_PORT') zoneId = 'zone_3';
    else if (targetZone === 'SAPPHIRE') zoneId = 'zone_4';
    else if (targetZone === 'NEON_ALLEY') zoneId = 'zone_7';

    this.loadZone(zoneId);
  }

  private clearCurrentRoom() {
    // Destroy all previous room game objects
    this.roomElements.forEach(el => {
      try {
        el.destroy();
      } catch {
        // Ignore
      }
    });
    this.roomElements = [];

    // Clear NPCs
    this.scene.npcs.forEach(npc => {
      try {
        npc.destroy();
      } catch {
        // Ignore
      }
    });
    this.scene.npcs = [];

    // Clear Enemies
    this.scene.enemies.forEach(e => {
      try {
        e.destroy();
      } catch {
        // Ignore
      }
    });
    this.scene.enemies = [];

    // Clear static obstacles
    this.roomObstacles.clear(true, true);
    this.boundaryManager.clearBoundaries();

    // Clear depth system
    this.scene.depthSystem.clear();
    if (this.scene.player) {
      this.scene.depthSystem.register(this.scene.player);
    }
  }
}
