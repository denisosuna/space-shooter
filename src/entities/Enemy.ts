import Phaser from 'phaser';
import { DEPTH, GAME_HEIGHT, ENEMY_BULLET_POOL_SIZE } from '../config/game.config';
import type { EnemyConfig } from '../config/waves.config';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private config!: EnemyConfig;
  private hp = 0;
  private fireTimer = 0;
  private _enemyBullets!: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.enemies);
  }

  get enemyBullets(): Phaser.Physics.Arcade.Group {
    return this._enemyBullets;
  }

  init(config: EnemyConfig, bulletGroup: Phaser.Physics.Arcade.Group): this {
    this.config = config;
    this.hp = config.health;
    this._enemyBullets = bulletGroup;
    this.setTexture(config.textureKey);
    this.setScale(0.7);
    this.setActive(true);
    this.setVisible(true);
    this.body.enable = true;
    this.body.setVelocityY(config.speed);
    this.fireTimer = Phaser.Math.Between(0, config.fireRate);
    return this;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    if (!this.active) return;

    // Remove if off screen
    if (this.y > GAME_HEIGHT + 50) {
      this.deactivate();
      return;
    }

    // Enemy shooting
    if (this.config.fireRate > 0) {
      this.fireTimer += delta;
      if (this.fireTimer >= this.config.fireRate) {
        this.fire();
        this.fireTimer = 0;
      }
    }
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    this.flashWhite();

    if (this.hp <= 0) {
      this.explode();
      return true;
    }
    return false;
  }

  getScore(): number {
    return this.config.score;
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
    this.body.setVelocity(0, 0);
  }

  private fire(): void {
    const bullet = this._enemyBullets.get(
      this.x,
      this.y + this.displayHeight / 2,
      'laserRed01',
    ) as Phaser.Physics.Arcade.Sprite | null;

    if (!bullet) return;

    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.setScale(0.7);
    bullet.setDepth(DEPTH.bullets);
    (bullet.body as Phaser.Physics.Arcade.Body).setVelocityY(290);
  }

  private flashWhite(): void {
    this.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (this.active) this.clearTint();
    });
  }

  private explode(): void {
    const particles = this.scene.add.particles(this.x, this.y, 'fire01', {
      speed: { min: 30, max: 150 },
      scale: { start: 0.5, end: 0 },
      lifespan: 400,
      quantity: 12,
      emitting: false,
    });
    particles.explode(12);

    this.scene.sound.play('sfxZap', { volume: 0.3 });
    this.deactivate();
  }
}

export function createEnemyPool(scene: Phaser.Scene, size: number): Phaser.Physics.Arcade.Group {
  return scene.physics.add.group({
    classType: Enemy,
    maxSize: size,
    runChildUpdate: true,
    allowGravity: false,
  });
}

export function createEnemyBulletPool(scene: Phaser.Scene): Phaser.Physics.Arcade.Group {
  return scene.physics.add.group({
    maxSize: ENEMY_BULLET_POOL_SIZE,
    allowGravity: false,
  });
}
