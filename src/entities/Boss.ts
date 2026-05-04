import Phaser from 'phaser';
import { DEPTH, GAME_WIDTH } from '../config/game.config';
import type { BossConfig, BossPhase } from '../config/waves.config';

export class Boss extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  private config!: BossConfig;
  private hp = 0;
  private maxHp = 0;
  private currentPhaseIndex = 0;
  private fireTimer = 0;
  private movementTimer = 0;
  private movementDirection = 1;
  private _bulletGroup!: Phaser.Physics.Arcade.Group;
  private _onDamage?: (hp: number, maxHp: number) => void;
  private _onDeath?: () => void;
  private playerRef?: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemyRed5');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.enemies + 1);
  }

  get bullets(): Phaser.Physics.Arcade.Group {
    return this._bulletGroup;
  }

  get isAlive(): boolean {
    return this.active && this.hp > 0;
  }

  get currentHp(): number {
    return this.hp;
  }

  get totalHp(): number {
    return this.maxHp;
  }

  get bossName(): string {
    return this.config?.name ?? '';
  }

  init(
    cfg: BossConfig,
    bulletGroup: Phaser.Physics.Arcade.Group,
    player: Phaser.GameObjects.Sprite,
    onDamage: (hp: number, maxHp: number) => void,
    onDeath: () => void,
  ): void {
    this.config = cfg;
    this._bulletGroup = bulletGroup;
    this.playerRef = player;
    this._onDamage = onDamage;
    this._onDeath = onDeath;

    this.hp = cfg.baseHp;
    this.maxHp = cfg.baseHp;
    this.currentPhaseIndex = 0;
    this.fireTimer = 0;
    this.movementTimer = 0;
    this.movementDirection = 1;

    this.setTexture(cfg.textureKey);
    this.setScale(cfg.scale * 0.7);
    this.setActive(true);
    this.setVisible(true);
    this.body.enable = true;
    this.body.reset(GAME_WIDTH / 2, 100);

    // Entrance tween — slide in from top
    this.y = -100;
    this.scene.tweens.add({
      targets: this,
      y: 120,
      duration: 1200,
      ease: 'Back.easeOut',
    });
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (!this.active || !this.config) return;

    const phase = this.currentPhase;

    // Update phase based on HP
    this.updatePhase();

    // Movement
    this.handleMovement(delta, phase);

    // Shooting
    this.fireTimer += delta;
    if (this.fireTimer >= phase.fireRate && this.y > 50) {
      this.shoot(phase);
      this.fireTimer = 0;
    }

    // Keep within bounds
    this.x = Phaser.Math.Clamp(this.x, 60, GAME_WIDTH - 60);
  }

  takeDamage(amount: number): boolean {
    if (!this.active || this.hp <= 0) return false;
    this.hp = Math.max(0, this.hp - amount);

    this.flashRed();
    this._onDamage?.(this.hp, this.maxHp);

    if (this.hp <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.body.enable = false;
    this.body.setVelocity(0, 0);
    this.scene.tweens.killTweensOf(this);
  }

  private get currentPhase(): BossPhase {
    return this.config.phases[this.currentPhaseIndex];
  }

  private updatePhase(): void {
    const hpRatio = this.hp / this.maxHp;
    // Find deepest phase whose threshold is still above current HP ratio
    for (let i = this.config.phases.length - 1; i > this.currentPhaseIndex; i--) {
      if (hpRatio <= this.config.phases[i].hpThreshold) {
        this.currentPhaseIndex = i;
        this.fireTimer = 0;
        // Red screen flash on phase change
        this.scene.cameras.main.flash(400, 255, 50, 50);
        break;
      }
    }
  }

  private handleMovement(delta: number, phase: BossPhase): void {
    const speed = phase.movementSpeed;
    this.movementTimer += delta;

    switch (phase.movement) {
      case 'lateral': {
        this.x += speed * this.movementDirection * (delta / 1000);
        if (this.x >= GAME_WIDTH - 80 || this.x <= 80) {
          this.movementDirection *= -1;
        }
        this.body.setVelocity(0, 0);
        break;
      }
      case 'zigzag': {
        const zigzagPeriod = 2000;
        const t = (this.movementTimer % zigzagPeriod) / zigzagPeriod;
        const targetX = t < 0.5
          ? Phaser.Math.Linear(80, GAME_WIDTH - 80, t * 2)
          : Phaser.Math.Linear(GAME_WIDTH - 80, 80, (t - 0.5) * 2);
        this.x = Phaser.Math.Linear(this.x, targetX, 0.05);
        break;
      }
      case 'idle':
      default:
        this.body.setVelocity(0, 0);
        break;
    }
  }

  private shoot(phase: BossPhase): void {
    // Cap active boss bullets to avoid filling the screen
    if (this._bulletGroup.countActive(true) >= 18) return;

    const { pattern, bulletCount, spreadAngle } = phase;

    switch (pattern) {
      case 'spread':
      case 'barrage': {
        const half = spreadAngle / 2;
        for (let i = 0; i < bulletCount; i++) {
          const deg = bulletCount === 1
            ? 0
            : -half + (spreadAngle / (bulletCount - 1)) * i;
          this.fireBullet(Phaser.Math.DegToRad(deg));
        }
        break;
      }
      case 'aimed': {
        if (!this.playerRef) return;
        const dx = this.playerRef.x - this.x;
        const dy = this.playerRef.y - this.y;
        // atan2(dx, dy): angle from down-axis where sin=x, cos=y (game coords Y-down)
        const baseAngle = Math.atan2(dx, dy);
        const half2 = (spreadAngle / 2);
        for (let i = 0; i < bulletCount; i++) {
          const offset = bulletCount === 1 ? 0 : -half2 + (spreadAngle / (bulletCount - 1)) * i;
          this.fireBullet(baseAngle + Phaser.Math.DegToRad(offset));
        }
        break;
      }
      case 'circle': {
        const step = 360 / bulletCount;
        for (let i = 0; i < bulletCount; i++) {
          this.fireBullet(Phaser.Math.DegToRad(step * i));
        }
        break;
      }
    }
  }

  private fireBullet(angle: number): void {
    const bullet = this._bulletGroup.get(
      this.x, this.y + this.displayHeight / 2, 'laserRed01',
    ) as Phaser.Physics.Arcade.Sprite | null;
    if (!bullet) return;

    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.setDepth(DEPTH.bullets);
    bullet.setScale(0.9);
    // +Math.PI flips the sprite so it visually points in the direction of travel
    bullet.setRotation(angle + Math.PI);
    const speed = 310;
    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.enable = true;
    body.reset(this.x, this.y + this.displayHeight / 2);
    body.setVelocity(Math.sin(angle) * speed, Math.cos(angle) * speed);
  }

  private flashRed(): void {
    this.setTint(0xff4444);
    this.scene.time.delayedCall(80, () => {
      if (this.active) this.clearTint();
    });
  }

  private die(): void {
    // Big explosion
    for (let i = 0; i < 3; i++) {
      this.scene.time.delayedCall(i * 200, () => {
        const px = this.x + Phaser.Math.Between(-30, 30);
        const py = this.y + Phaser.Math.Between(-30, 30);
        const particles = this.scene.add.particles(px, py, 'fire01', {
          speed: { min: 80, max: 300 },
          scale: { start: 1.0, end: 0 },
          lifespan: 600,
          quantity: 20,
          emitting: false,
        });
        particles.explode(20);
      });
    }
    this.scene.cameras.main.shake(500, 0.015);
    this.scene.sound.play('sfxLose', { volume: 0.6 });

    this.deactivate();
    this._onDeath?.();
  }
}
