import Phaser from 'phaser';
import { PlayerClassId } from '../types/game';

export interface CharacterUnitConfig {
  classId: PlayerClassId;
  weaponKey?: string;
  depthOffset?: number;
}

export class CharacterUnit extends Phaser.GameObjects.Container {
  public bodySprite: Phaser.GameObjects.Sprite;
  public weaponSprite?: Phaser.GameObjects.Sprite;
  public shadowSprite: Phaser.GameObjects.Graphics;
  public classId: PlayerClassId;
  public depthOffset: number;
  declare body: Phaser.Physics.Arcade.Body;

  constructor(scene: Phaser.Scene, x: number, y: number, config: CharacterUnitConfig) {
    super(scene, x, y);
    this.classId = config.classId;
    this.depthOffset = config.depthOffset || 0;

    // 1. Ground Shadow (W 26, H 10 ellipse at base Y=58)
    this.shadowSprite = scene.add.graphics();
    this.shadowSprite.fillStyle(0x0a0c16, 0.45);
    this.shadowSprite.fillEllipse(0, 24, 26, 10);
    this.add(this.shadowSprite);

    // 2. Main Character Body Sprite (64x64 frame with 0.5, 0.9 anchor at feet)
    const textureKey = `class_${config.classId.toLowerCase()}`;
    this.bodySprite = scene.add.sprite(0, 0, textureKey, 0);
    this.bodySprite.setOrigin(0.5, 0.9);
    this.add(this.bodySprite);

    // 3. Modular Weapon Layer (Optional overlay)
    if (config.weaponKey) {
      this.weaponSprite = scene.add.sprite(0, 0, config.weaponKey);
      this.weaponSprite.setOrigin(0.5, 0.9);
      this.add(this.weaponSprite);
    }

    // 4. Register with Scene and Physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 5. Isometric Feet Hitbox (24x12 footprint at bottom)
    if (this.body) {
      this.body.setSize(24, 12);
      this.body.setOffset(-12, 18);
    }

    this.updateDepth();
  }

  public equipWeapon(weaponKey: string) {
    if (!this.weaponSprite) {
      this.weaponSprite = this.scene.add.sprite(0, 0, weaponKey);
      this.weaponSprite.setOrigin(0.5, 0.9);
      this.add(this.weaponSprite);
    } else {
      this.weaponSprite.setTexture(weaponKey);
      this.weaponSprite.setVisible(true);
    }
  }

  public playAnimation(animKey: string, ignoreIfPlaying = true) {
    this.bodySprite.play(animKey, ignoreIfPlaying);
  }

  public setUnitFlipX(flip: boolean) {
    this.bodySprite.setFlipX(flip);
    if (this.weaponSprite) {
      this.weaponSprite.setFlipX(flip);
    }
  }

  public updateDepth() {
    this.setDepth(this.y + this.depthOffset);
  }
}

