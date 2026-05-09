import Phaser from 'phaser';
import { DEPTH, GAME_HEIGHT } from '../config/game.config';

export type PowerUpType = 'gun' | 'health' | 'bomb' | 'shield';

const TINTS: Record<PowerUpType, number> = {
  gun:    0xffff00,
  health: 0x00ff88,
  bomb:   0xff4400,
  shield: 0x44aaff,
};

const TEXTURES: Record<PowerUpType, string> = {
  gun:    'powerupBolt',
  health: 'powerupShield',
  bomb:   'star',
  shield: 'powerupShield',
};

const SCALES: Record<PowerUpType, number> = {
  gun:    0.8,
  health: 0.8,
  bomb:   0.7,
  shield: 1.0,
};

export class PowerUp extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private powerUpType: PowerUpType = 'gun';

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.powerups);
  }

  get powerType(): PowerUpType {
    return this.powerUpType;
  }

  spawn(x: number, y: number, type: PowerUpType): this {
    this.powerUpType = type;
    this.setTexture(TEXTURES[type]);
    this.setTint(TINTS[type]);
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setScale(SCALES[type]);
    this.body.enable = true;
    this.body.reset(x, y);
    this.body.setVelocityY(80);

    // Gentle bobbing tween
    this.scene.tweens.add({
      targets: this,
      angle: { from: -15, to: 15 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    return this;
  }

  spawnRecoverable(x: number, y: number): this {
    this.powerUpType = 'gun';
    this.setTexture('powerupBolt');
    this.setTint(TINTS.gun);
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.setScale(SCALES.gun);
    this.body.enable = true;
    this.body.reset(x, y);

    // Launch upward with random horizontal drift
    const vx = Phaser.Math.Between(-80, 80);
    this.body.setVelocity(vx, -120);

    // Slow down and fall
    this.scene.time.delayedCall(600, () => {
      if (!this.active) return;
      this.body.setVelocity(0, 60);
    });

    // Blinking tween
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 1, to: 0.3 },
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Auto-despawn after 4 seconds
    this.scene.time.delayedCall(4000, () => {
      if (this.active) this.deactivate();
    });

    return this;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    if (!this.active) return;

    if (this.y > GAME_HEIGHT + 30) {
      this.deactivate();
    }
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setAlpha(1);
    this.body.enable = false;
    this.body.setVelocity(0, 0);
    this.scene.tweens.killTweensOf(this);
  }
}
