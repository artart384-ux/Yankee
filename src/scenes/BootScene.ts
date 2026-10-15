import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const loaderBar = document.getElementById('loader-progress');
    const loaderStatus = document.getElementById('loader-status');

    this.load.on('progress', (value: number) => {
      if (loaderBar) loaderBar.style.width = `${Math.floor(value * 100)}%`;
      if (loaderStatus) loaderStatus.innerText = `LOADING HD 64x64 SYSTEM ASSETS: ${Math.floor(value * 100)}%`;
    });

    this.load.on('complete', () => {
      if (loaderStatus) loaderStatus.innerText = 'NEO-NAV READY. WELCOME TO NAWABORAPHA.';
      const screen = document.getElementById('loading-screen');
      if (screen) {
        screen.style.opacity = '0';
        setTimeout(() => {
          screen.style.display = 'none';
        }, 500);
      }
    });

    // Load HD 64x64 Character Spritesheets (7 Core Classes)
    const coreClasses = [
      'class_vanguard',
      'class_brawler',
      'class_striker',
      'class_sharpshooter',
      'class_supplier',
      'class_instigator',
      'class_saboteur'
    ];
    coreClasses.forEach(c => {
      this.load.spritesheet(c, `assets/sprites/${c}.png`, {
        frameWidth: 64,
        frameHeight: 64
      });
      this.load.image(`${c}_portrait`, `assets/portraits/${c}.png`);
    });

    // Load Modular Weapons
    const modularWeapons = [
      'weapon_riot_shield',
      'weapon_brass_knuckles',
      'weapon_baseball_bat',
      'weapon_slingshot',
      'weapon_medkit',
      'weapon_megaphone',
      'weapon_wiretrap'
    ];
    modularWeapons.forEach(w => {
      this.load.image(w, `assets/sprites/weapons/${w}.png`);
    });

    // Legacy faction aliases
    this.load.spritesheet('gearheads_brawler', 'assets/sprites/class_brawler.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet('elites_striker', 'assets/sprites/class_striker.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet('syndicate_delinquent', 'assets/sprites/class_vanguard.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet('enemy_thug', 'assets/sprites/enemy_thug.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet('enemy_apex_enforcer', 'assets/sprites/enemy_apex_enforcer.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet('enemy_drone', 'assets/sprites/enemy_drone.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet('training_dummy', 'assets/sprites/training_dummy.png', {
      frameWidth: 64,
      frameHeight: 64
    });

    // Load Props & Environment (including 2dcity, 2dclassroom, Pixel Crawler)
    this.load.image('tileset_street', 'assets/tiles/tileset_street.png');
    this.load.image('vending_machine', 'assets/props/vending_machine.png');
    this.load.image('street_lamp', 'assets/props/street_lamp.png');
    this.load.image('motorcycle', 'assets/props/motorcycle.png');
    this.load.image('barrier', 'assets/props/barrier.png');
    this.load.image('trash_bin', 'assets/props/trash_bin.png');

    // Extracted props from 2dcity & 2dclassroom & Pixel Crawler
    this.load.image('prop_cyber_car', 'assets/props/prop_cyber_car.png');
    this.load.image('prop_cyber_taxi', 'assets/props/prop_cyber_taxi.png');
    this.load.image('prop_school_desk', 'assets/props/prop_school_desk.png');
    this.load.image('prop_teacher_podium', 'assets/props/prop_teacher_podium.png');
    this.load.image('prop_computer_desk', 'assets/props/prop_computer_desk.png');
    this.load.image('prop_dungeon_portal', 'assets/props/prop_dungeon_portal.png');

    // Load Combat VFX & Comic Pop Badges
    this.load.image('vfx_slash', 'assets/vfx/vfx_slash.png');
    this.load.image('vfx_pierce', 'assets/vfx/vfx_pierce.png');
    this.load.image('vfx_strike', 'assets/vfx/vfx_strike.png');
    this.load.image('vfx_hitspark', 'assets/vfx/vfx_hitspark.png');
    this.load.image('vfx_aura_particle', 'assets/vfx/vfx_aura_particle.png');
    this.load.image('vfx_kapow_burst', 'assets/vfx/vfx_kapow_burst.png');
    this.load.image('vfx_slam_burst', 'assets/vfx/vfx_slam_burst.png');
    this.load.image('vfx_spark', 'assets/vfx/vfx_spark.png');
    this.load.image('vfx_debris', 'assets/vfx/vfx_debris.png');

    // Load Anime Character Portraits
    this.load.image('miss_poppy_anime', 'assets/portraits/miss_poppy_anime.jpg');
    this.load.image('elizabeth_anime', 'assets/portraits/elizabeth_anime.jpg');
    this.load.image('yamato_anime', 'assets/portraits/yamato_anime.jpg');

    // Load Crows Zero / Delinquent Rooftop Map Assets
    this.load.image('tileset_rooftop_concrete', 'assets/tiles/tileset_rooftop_concrete.png');
    this.load.image('tile_iso_concrete', 'assets/tiles/tile_iso_concrete.png');
    this.load.image('prop_chainlink_fence', 'assets/props/prop_chainlink_fence.png');
    this.load.image('prop_iso_chainlink_fence', 'assets/props/prop_iso_chainlink_fence.png');
    this.load.image('prop_iso_concrete_wall', 'assets/props/prop_iso_concrete_wall.png');
    this.load.image('prop_iso_oil_barrels', 'assets/props/prop_iso_oil_barrels.png');
    this.load.image('prop_iso_desk_pile', 'assets/props/prop_iso_desk_pile.png');
    this.load.image('prop_broken_desk_pile', 'assets/props/prop_broken_desk_pile.png');
    this.load.image('prop_oil_drum_fire', 'assets/props/prop_oil_drum_fire.png');
    this.load.image('prop_rooftop_door_hut', 'assets/props/prop_rooftop_door_hut.png');
    this.load.image('prop_rooftop_stair_hut_pixel', 'assets/props/prop_rooftop_stair_hut_pixel.png');
    this.load.image('prop_rooftop_water_tank', 'assets/props/prop_rooftop_water_tank.png');
    this.load.image('prop_bosozoku_bike', 'assets/props/prop_bosozoku_bike.png');
    this.load.image('prop_graffiti_wall', 'assets/props/prop_graffiti_wall.png');
    this.load.image('delinquent_rooftop_concept', 'assets/maps/delinquent_rooftop_concept.jpg');
    this.load.image('bg_distant_city_skyline', 'assets/maps/bg_distant_city_skyline.png');

    // Comic Pop Badges & Anime Impact Bursts
    this.load.image('vfx_comic_krsh', 'assets/vfx/vfx_comic_krsh.png');
    this.load.image('vfx_comic_exclaim', 'assets/vfx/vfx_comic_exclaim.png');
    this.load.image('vfx_comic_crit', 'assets/vfx/vfx_comic_crit.png');
    this.load.image('vfx_aura_burst_magenta', 'assets/vfx/vfx_aura_burst_magenta.png');
    this.load.image('vfx_aura_burst_cyan', 'assets/vfx/vfx_aura_burst_cyan.png');
    this.load.image('vfx_aura_burst_lime', 'assets/vfx/vfx_aura_burst_lime.png');

    // UI Overhaul Assets
    this.load.image('ui_cracked_phone', 'assets/ui/ui_cracked_phone.png');

    // Japanese Delinquent High School Floor Tiles (64x32 Iso Diamonds)
    this.load.image('tile_school_wood_parquet', 'assets/tiles/tile_school_wood_parquet.png');
    this.load.image('tile_school_corridor_wood', 'assets/tiles/tile_school_corridor_wood.png');
    this.load.image('tile_school_restroom_tile', 'assets/tiles/tile_school_restroom_tile.png');
    this.load.image('tile_school_cafeteria_tile', 'assets/tiles/tile_school_cafeteria_tile.png');
    this.load.image('tile_school_gym_parquet', 'assets/tiles/tile_school_gym_parquet.png');
    this.load.image('tile_school_dirty_asphalt', 'assets/tiles/tile_school_dirty_asphalt.png');

    // Japanese High School Room Perimeter Props (Walls, Doors, Windows, Chalkboards, Lockers)
    this.load.image('prop_iso_school_wall_wood', 'assets/props/prop_iso_school_wall_wood.png');
    this.load.image('prop_iso_school_window', 'assets/props/prop_iso_school_window.png');
    this.load.image('prop_iso_school_door', 'assets/props/prop_iso_school_door.png');
    this.load.image('prop_iso_school_chalkboard', 'assets/props/prop_iso_school_chalkboard.png');
    this.load.image('prop_iso_shoe_lockers', 'assets/props/prop_iso_shoe_lockers.png');
    this.load.image('prop_iso_bulletin_board', 'assets/props/prop_iso_bulletin_board.png');
    this.load.image('prop_iso_school_gate', 'assets/props/prop_iso_school_gate.png');
    this.load.image('prop_iso_restroom_wall', 'assets/props/prop_iso_restroom_wall.png');
  }

  create() {
    this.createGlobalAnimations();
    this.scene.start('CharacterSelectScene');
  }

  private createGlobalAnimations() {
    const coreClasses = [
      'vanguard',
      'brawler',
      'striker',
      'sharpshooter',
      'supplier',
      'instigator',
      'saboteur'
    ];

    coreClasses.forEach(c => {
      const textureKey = `class_${c}`;

      this.anims.create({
        key: `${c}_idle`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1
      });

      this.anims.create({
        key: `${c}_walk`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 6, end: 11 }),
        frameRate: 10,
        repeat: -1
      });

      this.anims.create({
        key: `${c}_run`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 12, end: 17 }),
        frameRate: 12,
        repeat: -1
      });

      this.anims.create({
        key: `${c}_attack1`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 18, end: 23 }),
        frameRate: 14,
        repeat: 0
      });

      this.anims.create({
        key: `${c}_attack2`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 24, end: 29 }),
        frameRate: 14,
        repeat: 0
      });

      this.anims.create({
        key: `${c}_attack3`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 30, end: 35 }),
        frameRate: 12,
        repeat: 0
      });

      this.anims.create({
        key: `${c}_dash`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 36, end: 39 }),
        frameRate: 12,
        repeat: 0
      });

      this.anims.create({
        key: `${c}_hurt`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 42, end: 45 }),
        frameRate: 8,
        repeat: 0
      });
    });

    // Faction alias animations for compatibility
    const factions = ['gearheads', 'elites', 'syndicate'];
    factions.forEach(f => {
      const textureKey = f === 'gearheads' ? 'class_brawler' :
                         f === 'elites' ? 'class_striker' : 'class_vanguard';

      this.anims.create({
        key: `${f}_idle`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1
      });

      this.anims.create({
        key: `${f}_walk`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 6, end: 11 }),
        frameRate: 10,
        repeat: -1
      });

      this.anims.create({
        key: `${f}_run`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 12, end: 17 }),
        frameRate: 12,
        repeat: -1
      });

      this.anims.create({
        key: `${f}_attack1`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 18, end: 23 }),
        frameRate: 14,
        repeat: 0
      });

      this.anims.create({
        key: `${f}_attack2`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 24, end: 29 }),
        frameRate: 14,
        repeat: 0
      });

      this.anims.create({
        key: `${f}_attack3`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 30, end: 35 }),
        frameRate: 12,
        repeat: 0
      });

      this.anims.create({
        key: `${f}_dash`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 36, end: 39 }),
        frameRate: 12,
        repeat: 0
      });

      this.anims.create({
        key: `${f}_hurt`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 42, end: 45 }),
        frameRate: 8,
        repeat: 0
      });
    });

    // Enemy Thug Animations
    this.anims.create({
      key: 'thug_idle',
      frames: this.anims.generateFrameNumbers('enemy_thug', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1
    });
    this.anims.create({
      key: 'thug_walk',
      frames: this.anims.generateFrameNumbers('enemy_thug', { start: 6, end: 11 }),
      frameRate: 8,
      repeat: -1
    });
    this.anims.create({
      key: 'thug_attack',
      frames: this.anims.generateFrameNumbers('enemy_thug', { start: 18, end: 23 }),
      frameRate: 12,
      repeat: 0
    });

    // Enemy Drone Animations
    this.anims.create({
      key: 'drone_hover',
      frames: this.anims.generateFrameNumbers('enemy_drone', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1
    });
    this.anims.create({
      key: 'drone_alert',
      frames: this.anims.generateFrameNumbers('enemy_drone', { start: 4, end: 7 }),
      frameRate: 12,
      repeat: -1
    });

    // Bulky Apex Enforcer Animations
    this.anims.create({
      key: 'enforcer_idle',
      frames: this.anims.generateFrameNumbers('enemy_apex_enforcer', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1
    });
    this.anims.create({
      key: 'enforcer_walk',
      frames: this.anims.generateFrameNumbers('enemy_apex_enforcer', { start: 6, end: 11 }),
      frameRate: 6,
      repeat: -1
    });
    this.anims.create({
      key: 'enforcer_attack',
      frames: this.anims.generateFrameNumbers('enemy_apex_enforcer', { start: 18, end: 23 }),
      frameRate: 10,
      repeat: 0
    });
  }
}
