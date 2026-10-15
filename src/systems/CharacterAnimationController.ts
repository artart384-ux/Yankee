import Phaser from 'phaser';

export type CharacterState =
  | 'IDLE'
  | 'WALK'
  | 'RUN'
  | 'ATTACK_MELEE'
  | 'ATTACK_RANGED'
  | 'CAST_SKILL'
  | 'DODGE'
  | 'HURT';

export class CharacterAnimationController {
  private sprite: Phaser.Physics.Arcade.Sprite;
  private classId: string;
  public currentState: CharacterState = 'IDLE';
  private stateLocked: boolean = false;
  private lockTimer?: Phaser.Time.TimerEvent;

  // Procedural Animation Variables
  private animTimer: number = 0;
  private baseScaleX: number = 1.0;
  private baseScaleY: number = 1.0;

  constructor(sprite: Phaser.Physics.Arcade.Sprite, classId: string) {
    this.sprite = sprite;
    this.classId = classId.toLowerCase();
    this.baseScaleX = Math.abs(sprite.scaleX);
    this.baseScaleY = sprite.scaleY;
  }

  public updateFacing(pointerWorldX: number, velocityX?: number) {
    // If locked in action like attack, prioritize pointer direction
    if (this.stateLocked) {
      if (pointerWorldX < this.sprite.x) {
        this.sprite.setFlipX(true);
      } else {
        this.sprite.setFlipX(false);
      }
      return;
    }

    // When moving, face movement or pointer direction
    if (velocityX !== undefined && Math.abs(velocityX) > 10) {
      this.sprite.setFlipX(velocityX < 0);
    } else if (pointerWorldX < this.sprite.x) {
      this.sprite.setFlipX(true);
    } else {
      this.sprite.setFlipX(false);
    }
  }

  public setState(
    newState: CharacterState,
    durationMs?: number,
    onComplete?: () => void
  ): boolean {
    if (this.stateLocked && newState !== 'HURT' && newState !== 'DODGE') {
      return false;
    }

    this.currentState = newState;
    this.playAppropriateAnimation(newState);

    if (durationMs && durationMs > 0) {
      this.stateLocked = true;
      if (this.lockTimer) this.lockTimer.remove();

      this.lockTimer = this.sprite.scene.time.delayedCall(durationMs, () => {
        this.stateLocked = false;
        if (onComplete) onComplete();
        this.resetProceduralTransforms();
        this.setState('IDLE');
      });
    }

    return true;
  }

  public isLocked(): boolean {
    return this.stateLocked;
  }

  private playAppropriateAnimation(state: CharacterState) {
    const c = this.classId;
    let animKey = `${c}_idle`;

    switch (state) {
      case 'IDLE':
        animKey = `${c}_idle`;
        break;
      case 'WALK':
        animKey = `${c}_walk`;
        break;
      case 'RUN':
        animKey = `${c}_run`;
        break;
      case 'ATTACK_MELEE':
        animKey = `${c}_attack1`;
        break;
      case 'ATTACK_RANGED':
        animKey = `${c}_attack2`;
        break;
      case 'CAST_SKILL':
        animKey = `${c}_attack3`;
        break;
      case 'DODGE':
        animKey = `${c}_dash`;
        break;
      case 'HURT':
        animKey = `${c}_hurt`;
        break;
    }

    if (this.sprite.anims.animationManager.exists(animKey)) {
      if (!this.sprite.anims.isPlaying || this.sprite.anims.currentAnim?.key !== animKey) {
        this.sprite.play(animKey, true);
      }
    } else {
      // Fallback
      if (this.sprite.anims.animationManager.exists(`${c}_idle`)) {
        this.sprite.play(`${c}_idle`, true);
      }
    }
  }

  public updateProceduralAnimation(delta: number, vx: number, vy: number) {
    this.animTimer += delta * 0.008;

    const flip = this.sprite.flipX ? -1 : 1;

    switch (this.currentState) {
      case 'IDLE':
        // Breathing vertical subtle sine squash
        const idleBob = Math.sin(this.animTimer * 3.5) * 0.02;
        this.sprite.setScale(this.baseScaleX * flip, this.baseScaleY * (1 + idleBob));
        this.sprite.setRotation(0);
        break;

      case 'WALK':
        // Stride footstep bob and gentle lateral tilt
        const walkBob = Math.abs(Math.sin(this.animTimer * 12)) * 0.05;
        const walkTilt = Math.sin(this.animTimer * 12) * 0.05 * flip;
        this.sprite.setScale(this.baseScaleX * flip, this.baseScaleY * (1 - walkBob));
        this.sprite.setRotation(walkTilt);
        break;

      case 'RUN':
        // Dynamic forward athletic sprint lean
        const runBob = Math.abs(Math.sin(this.animTimer * 16)) * 0.08;
        const forwardLean = 0.12 * flip;
        this.sprite.setScale(this.baseScaleX * flip * 1.05, this.baseScaleY * (1 - runBob));
        this.sprite.setRotation(forwardLean);
        break;

      case 'ATTACK_MELEE':
        // Kinetic forward strike impact tilt & squash
        const strikeTilt = 0.18 * flip;
        this.sprite.setScale(this.baseScaleX * flip * 1.15, this.baseScaleY * 0.95);
        this.sprite.setRotation(strikeTilt);
        break;

      case 'ATTACK_RANGED':
        // Recoil back-tilt upon firing
        const recoilTilt = -0.10 * flip;
        this.sprite.setScale(this.baseScaleX * flip * 0.95, this.baseScaleY * 1.08);
        this.sprite.setRotation(recoilTilt);
        break;

      case 'CAST_SKILL':
        // Charging upward pulse
        const castPulse = Math.sin(this.animTimer * 20) * 0.08;
        this.sprite.setScale(this.baseScaleX * flip * (1 + castPulse), this.baseScaleY * (1 + castPulse));
        this.sprite.setRotation(0);
        break;

      case 'DODGE':
        // Fast 360-degree acrobatic spin roll
        this.sprite.rotation += 0.35 * flip;
        break;

      case 'HURT':
        // Knockback recoil backwards
        this.sprite.setRotation(-0.25 * flip);
        break;
    }
  }

  private resetProceduralTransforms() {
    const flip = this.sprite.flipX ? -1 : 1;
    this.sprite.setScale(this.baseScaleX * flip, this.baseScaleY);
    this.sprite.setRotation(0);
  }

  public triggerHurtFlash(durationMs: number = 200) {
    this.setState('HURT', durationMs);
    this.sprite.setTint(0xff3333);
    this.sprite.scene.time.delayedCall(durationMs, () => {
      this.sprite.clearTint();
    });
  }

  public triggerDodgeRoll(durationMs: number = 320, onComplete?: () => void) {
    this.setState('DODGE', durationMs, onComplete);
  }
}

