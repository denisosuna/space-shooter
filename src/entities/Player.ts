import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER, DEPTH, BULLET_POOL_SIZE } from '../config/game.config';

export class Player extends Phaser.GameObjects.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private health: number;
  private maxHealth: number;
  private isDragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private isInvincible = false;
  private fireTimer = 0;
  private _bullets!: Phaser.Physics.Arcade.Group;
  private _gunLevel = 1;
  private _shipLevel = 1;
  private static readonly SHIP_TEXTURES = ['playerShip1', 'playerShip2', 'playerShip3'];

  constructor(scene: Phaser.Scene) {
    super(scene, GAME_WIDTH / 2, GAME_HEIGHT * 0.85, 'playerShip1');
    this.maxHealth = PLAYER.maxHealth;
    this.health = this.maxHealth;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(DEPTH.player);
    this.body.setCollideWorldBounds(true);
    this.setScale(0.8);

    this.setupInput();
    this.createBulletPool();
  }

  get bullets(): Phaser.Physics.Arcade.Group {
    return this._bullets;
  }

  get currentHealth(): number {
    return this.health;
  }

  get isAlive(): boolean {
    return this.health > 0;
  }

  get invincible(): boolean {
    return this.isInvincible;
  }

  get gunLevel(): number {
    return this._gunLevel;
  }

  get shipLevel(): number {
    return this._shipLevel;
  }

  get maxHP(): number {
    return this.maxHealth;
  }

  private get minGunLevel(): number {
    return this._shipLevel;
  }

  upgradeGun(): void {
    if (this._gunLevel < 5) {
      this._gunLevel++;
    }
  }

  downgradeGun(): void {
    if (this._gunLevel > this.minGunLevel) {
      this._gunLevel--;
    }
  }

  update(_time: number, delta: number): void {
    if (!this.isAlive) return;

    this.fireTimer += delta;
    if (this.fireTimer >= PLAYER.fireRate) {
      this.fire();
      this.fireTimer = 0;
    }
  }

  takeDamage(amount: number): void {
    if (this.isInvincible || !this.isAlive) return;

    this.health = Math.max(0, this.health - amount);

    if (this.health <= 0) {
      this.die();
      return;
    }

    this.startInvincibility();
  }

  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  levelUpShip(): boolean {
    if (this._shipLevel >= 3) return false;
    this._shipLevel++;
    this.maxHealth += 10;
    this.health = this.maxHealth;
    this.setTexture(Player.SHIP_TEXTURES[this._shipLevel - 1]);

    // Flash + scale animation
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      yoyo: true,
      ease: 'Back.easeOut',
      onComplete: () => this.setScale(0.8),
    });
    this.scene.cameras.main.flash(300, 255, 255, 100);
    this.scene.sound.play('sfxShieldUp', { volume: 0.7 });

    // Ensure gun level is at least the new ship level
    if (this._gunLevel < this._shipLevel) {
      this._gunLevel = this._shipLevel;
    }

    return true;
  }

  private setupInput(): void {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const bounds = this.getBounds();
      const expandedBounds = new Phaser.Geom.Rectangle(
        bounds.x - 30,
        bounds.y - 30,
        bounds.width + 60,
        bounds.height + 60,
      );

      if (expandedBounds.contains(pointer.x, pointer.y)) {
        this.isDragging = true;
        this.dragOffsetX = pointer.x - this.x;
        this.dragOffsetY = pointer.y - this.y;
      } else {
        // Tap anywhere to start dragging from that point
        this.isDragging = true;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || !this.isAlive) return;

      const newX = Phaser.Math.Clamp(
        pointer.x - this.dragOffsetX,
        this.displayWidth / 2,
        GAME_WIDTH - this.displayWidth / 2,
      );
      const newY = Phaser.Math.Clamp(
        pointer.y - this.dragOffsetY,
        GAME_HEIGHT * 0.3,
        GAME_HEIGHT - this.displayHeight / 2,
      );

      this.x = newX;
      this.y = newY;
      this.body.reset(newX, newY);
    });

    this.scene.input.on('pointerup', () => {
      this.isDragging = false;
    });
  }

  private createBulletPool(): void {
    this._bullets = this.scene.physics.add.group({
      maxSize: BULLET_POOL_SIZE,
      allowGravity: false,
      runChildUpdate: false,
    });
  }

  private fireBullet(x: number, y: number, angle: number): void {
    const bullet = this._bullets.get(x, y, 'laserBlue01') as Phaser.Physics.Arcade.Sprite | null;
    if (!bullet) return;

    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.setDepth(DEPTH.bullets);
    bullet.setScale(0.7);
    bullet.setRotation(angle);
    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.reset(x, y);
    const speed = Math.abs(PLAYER.bulletSpeed);
    body.setVelocity(Math.sin(angle) * speed, -Math.cos(angle) * speed);
  }

  private fire(): void {
    const y = this.y - this.displayHeight / 2;
    const x = this.x;
    const level = this._gunLevel;

    if (level === 1) {
      this.fireBullet(x, y, 0);
    } else {
      const maxSpread = (level - 1) * 10;
      for (let i = 0; i < level; i++) {
        const deg = -maxSpread + (2 * maxSpread / (level - 1)) * i;
        this.fireBullet(x, y, Phaser.Math.DegToRad(deg));
      }
    }

    this.scene.sound.play('sfxLaser1', { volume: 0.3 });
  }

  private die(): void {
    this.scene.sound.play('sfxLose', { volume: 0.5 });

    // Explosion effect
    const particles = this.scene.add.particles(this.x, this.y, 'fire00', {
      speed: { min: 50, max: 200 },
      scale: { start: 0.6, end: 0 },
      lifespan: 600,
      quantity: 20,
      emitting: false,
    });
    particles.explode();

    this.setVisible(false);
    this.setActive(false);
    this.body.enable = false;
  }

  private startInvincibility(): void {
    this.isInvincible = true;

    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: Math.floor(PLAYER.invincibleDuration / 200),
      onComplete: () => {
        this.isInvincible = false;
        this.alpha = 1;
      },
    });
  }
}
