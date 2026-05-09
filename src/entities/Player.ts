import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER, DEPTH, BULLET_POOL_SIZE, isReducedEffects } from '../config/game.config';

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
  private lastX = 0;
  private shadow!: Phaser.GameObjects.Sprite;
  private _bombs = 2;
  private _shieldHits = 0;
  private shieldSprite!: Phaser.GameObjects.Arc;
  private static readonly MAX_BOMBS = 4;
  private static readonly SHIP_TEXTURES = [
    'playerShip1', // nivel 1 — azul
    'playerShip2', // nivel 2 — gris
    'playerShip3', // nivel 3 — verde
    'playerShip4', // nivel 4 — dorado
    'playerShip5', // nivel 5 — violeta
    'playerShip6', // nivel 6 — rojo
  ];

  constructor(scene: Phaser.Scene) {
    super(scene, GAME_WIDTH / 2, GAME_HEIGHT * 0.85, 'playerShip1');
    this.maxHealth = PLAYER.maxHealth;
    this.health = this.maxHealth;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(DEPTH.player);
    this.body.setCollideWorldBounds(true);
    this.setScale(0.8);

    // Drop shadow — drawn just below the ship
    this.shadow = scene.add.sprite(this.x + 8, this.y + 10, 'playerShip1');
    this.shadow.setScale(0.8);
    this.shadow.setTint(0x000000);
    this.shadow.setAlpha(0.35);
    this.shadow.setDepth(DEPTH.player - 1);

    this.lastX = this.x;

    // Shield visual
    this.shieldSprite = scene.add.arc(this.x, this.y, 38, 0, 360, false, 0x44aaff, 0.35);
    this.shieldSprite.setStrokeStyle(2, 0x88ccff, 0.9);
    this.shieldSprite.setDepth(DEPTH.player + 1);
    this.shieldSprite.setVisible(false);

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

  /** Damage dealt per bullet at current gun level */
  get bulletDamage(): number {
    // Level: 1→1, 2→1, 3→2, 4→2, 5→3
    return Math.ceil(this._gunLevel / 2);
  }

  get shipLevel(): number {
    return this._shipLevel;
  }

  get maxHP(): number { return this.maxHealth; }
  get bombs(): number { return this._bombs; }
  get shieldHits(): number { return this._shieldHits; }
  get hasShield(): boolean { return this._shieldHits > 0; }

  addBomb(): void { this._bombs = Math.min(Player.MAX_BOMBS, this._bombs + 1); }

  addShield(hits = 3): void {
    this._shieldHits = Math.min(6, this._shieldHits + hits);
    this.shieldSprite.setVisible(true);
    this.scene.tweens.add({ targets: this.shieldSprite, alpha: { from: 0, to: 0.35 }, duration: 300 });
  }

  /** Returns true if shield absorbed the hit instead of HP. */
  tryShieldAbsorb(): boolean {
    if (this._shieldHits <= 0) return false;
    this._shieldHits--;
    // Flash shield
    this.scene.tweens.add({ targets: this.shieldSprite, alpha: { from: 1, to: 0.35 }, duration: 200 });
    if (this._shieldHits <= 0) {
      this.shieldSprite.setVisible(false);
      if (!isReducedEffects()) {
        this.scene.cameras.main.flash(200, 68, 170, 255);
      }
    }
    return true;
  }

  /** Returns list of active enemy+bullet groups for the bomb to affect. */
  useBomb(): boolean {
    if (this._bombs <= 0) return false;
    this._bombs--;
    if (!isReducedEffects()) {
      this.scene.cameras.main.flash(300, 255, 255, 255);
    }
    this.scene.sound.play('sfxTwoTone', { volume: 0.7 });
    return true;
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

    // Keyboard movement
    this.handleKeyboardMovement(delta);

    // Banking: squish scaleX based on horizontal velocity
    const dx = this.x - this.lastX;
    this.lastX = this.x;
    const targetScaleX = Phaser.Math.Clamp(0.8 - dx * 0.045, 0.45, 1.15);
    this.scaleX = Phaser.Math.Linear(this.scaleX, targetScaleX, 0.25);

    // Sync shadow
    this.shadow.setPosition(this.x + 8, this.y + 10);
    this.shadow.setScale(this.scaleX * 0.9, this.scaleY * 0.9);
    this.shadow.setTexture(this.texture.key);

    // Sync shield
    if (this._shieldHits > 0) {
      this.shieldSprite.setPosition(this.x, this.y);
    }

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
    if (this._shipLevel >= 6) return false;
    this._shipLevel++;
    this.maxHealth += 10;
    this.health = this.maxHealth;
    this.setTexture(Player.SHIP_TEXTURES[this._shipLevel - 1]);
    this.shadow.setTexture(Player.SHIP_TEXTURES[this._shipLevel - 1]);

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
    if (!isReducedEffects()) {
      this.scene.cameras.main.flash(300, 255, 255, 100);
    }
    this.scene.sound.play('sfxShieldUp', { volume: 0.7 });

    // Ensure gun level is at least the new ship level
    if (this._gunLevel < this._shipLevel) {
      this._gunLevel = this._shipLevel;
    }

    return true;
  }

  private cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys;

  private setupInput(): void {
    // Keyboard arrow keys
    this.cursorKeys = this.scene.input.keyboard!.createCursorKeys();

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

  private handleKeyboardMovement(delta: number): void {
    if (!this.cursorKeys) return;
    const speed = PLAYER.speed * (delta / 1000);
    let dx = 0;
    let dy = 0;
    if (this.cursorKeys.left.isDown) dx -= speed;
    if (this.cursorKeys.right.isDown) dx += speed;
    if (this.cursorKeys.up.isDown) dy -= speed;
    if (this.cursorKeys.down.isDown) dy += speed;

    if (dx !== 0 || dy !== 0) {
      const newX = Phaser.Math.Clamp(this.x + dx, this.displayWidth / 2, GAME_WIDTH - this.displayWidth / 2);
      const newY = Phaser.Math.Clamp(this.y + dy, GAME_HEIGHT * 0.3, GAME_HEIGHT - this.displayHeight / 2);
      this.x = newX;
      this.y = newY;
      this.body.reset(newX, newY);
    }
  }

  private createBulletPool(): void {
    this._bullets = this.scene.physics.add.group({
      maxSize: BULLET_POOL_SIZE,
      allowGravity: false,
      runChildUpdate: false,
    });
  }

  private static readonly BULLET_TINTS = [
    0x66bbff, // level 1 — blue
    0x00ffff, // level 2 — cyan
    0x00ff88, // level 3 — green
    0xffcc00, // level 4 — gold
    0xff4400, // level 5 — red/orange
  ];

  private fireBullet(x: number, y: number, angle: number): void {
    const bullet = this._bullets.get(x, y, 'laserBlue01') as Phaser.Physics.Arcade.Sprite | null;
    if (!bullet) return;

    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.setDepth(DEPTH.bullets);
    bullet.setScale(0.7);
    bullet.setRotation(angle);
    bullet.setTint(Player.BULLET_TINTS[this._gunLevel - 1]);
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
    this.shadow.setVisible(false);
    this.shieldSprite.setVisible(false);
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
