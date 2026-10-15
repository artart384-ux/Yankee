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

    // Load HD 64x64 Character Spritesheets
    this.load.spritesheet('gearheads_brawler', 'assets/sprites/gearheads_brawler.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet('elites_striker', 'assets/sprites/elites_striker.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet('syndicate_delinquent', 'assets/sprites/syndicate_delinquent.png', {
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
  }

  create() {
    this.createGlobalAnimations();
    this.scene.start('CharacterSelectScene');
  }

  private createGlobalAnimations() {
    const factions = ['gearheads', 'elites', 'syndicate'];

    factions.forEach(f => {
      const textureKey = f === 'gearheads' ? 'gearheads_brawler' :
                         f === 'elites' ? 'elites_striker' : 'syndicate_delinquent';

      // Idle (Row 0: frames 0 to 3)
      this.anims.create({
        key: `${f}_idle`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1
      });

      // Walk (Row 1: frames 6 to 11)
      this.anims.create({
        key: `${f}_walk`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 6, end: 11 }),
        frameRate: 10,
        repeat: -1
      });

      // Run (Row 2: frames 12 to 17)
      this.anims.create({
        key: `${f}_run`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 12, end: 17 }),
        frameRate: 12,
        repeat: -1
      });

      // Slash Attack 1 (Row 3: frames 18 to 23)
      this.anims.create({
        key: `${f}_attack1`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 18, end: 23 }),
        frameRate: 14,
        repeat: 0
      });

      // Pierce Attack 2 (Row 4: frames 24 to 29)
      this.anims.create({
        key: `${f}_attack2`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 24, end: 29 }),
        frameRate: 14,
        repeat: 0
      });

      // Crush / Heavy Strike Attack 3 (Row 5: frames 30 to 35)
      this.anims.create({
        key: `${f}_attack3`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 30, end: 35 }),
        frameRate: 12,
        repeat: 0
      });

      // Dash (Row 6: frames 36 to 39)
      this.anims.create({
        key: `${f}_dash`,
        frames: this.anims.generateFrameNumbers(textureKey, { start: 36, end: 39 }),
        frameRate: 12,
        repeat: 0
      });

      // Hurt (Row 7: frames 42 to 45)
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
