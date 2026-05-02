import Phaser from 'phaser';
import { GAME_WIDTH, POWERUP } from '../config/game.config';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';
import { PowerUp, type PowerUpType } from '../entities/PowerUp';

export interface CollisionCallbacks {
  onEnemyHit: (enemy: Enemy, score: number) => void;
  onPlayerHit: (damage: number) => void;
  onPowerUpCollected: (type: PowerUpType) => void;
}

export class CollisionManager {
  private scene: Phaser.Scene;
  private player: Player;
  private callbacks: CollisionCallbacks;
  private powerUpPool!: Phaser.Physics.Arcade.Group;
  private lastGunDropWave = -2;

  constructor(scene: Phaser.Scene, player: Player, callbacks: CollisionCallbacks) {
    this.scene = scene;
    this.player = player;
    this.callbacks = callbacks;
  }

  setCurrentWave(wave: number): void {
    this._currentWave = wave;
  }

  private _currentWave = 1;

  setup(
    enemyGroup: Phaser.Physics.Arcade.Group,
    enemyBulletGroup: Phaser.Physics.Arcade.Group,
    powerUpPool: Phaser.Physics.Arcade.Group,
  ): void {
    this.powerUpPool = powerUpPool;
    // Player bullets vs enemies
    this.scene.physics.add.overlap(
      this.player.bullets,
      enemyGroup,
      this.onBulletHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    // Enemy bullets vs player
    this.scene.physics.add.overlap(
      enemyBulletGroup,
      this.player,
      this.onEnemyBulletHitPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    // Enemies vs player (collision)
    this.scene.physics.add.overlap(
      enemyGroup,
      this.player,
      this.onEnemyCollidePlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    // Power-ups vs player
    this.scene.physics.add.overlap(
      powerUpPool,
      this.player,
      this.onPowerUpCollected as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );
  }

  update(): void {
    // Clean up off-screen player bullets (including angled ones)
    for (const bullet of this.player.bullets.children) {
      const b = bullet as Phaser.Physics.Arcade.Sprite;
      if (b.active && (b.y < -20 || b.x < -20 || b.x > GAME_WIDTH + 20)) {
        b.setActive(false);
        b.setVisible(false);
        (b.body as Phaser.Physics.Arcade.Body).enable = false;
      }
    }
  }

  private onBulletHitEnemy(
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
    const enemy = enemyObj as Enemy;

    if (!bullet.active || !enemy.active) return;

    bullet.setActive(false);
    bullet.setVisible(false);
    (bullet.body as Phaser.Physics.Arcade.Body).enable = false;

    const killed = enemy.takeDamage(1);
    if (killed) {
      this.callbacks.onEnemyHit(enemy, enemy.getScore());
      this.tryDropPowerUp(enemy.x, enemy.y);
    }
  }

  private tryDropPowerUp(x: number, y: number): void {
    if (Math.random() >= POWERUP.dropChance) return;

    // Decide type: gun only if not maxed AND at least 5 waves since last gun drop
    const canDropGun = this.player.gunLevel < 5
      && (this._currentWave - this.lastGunDropWave) >= 5;

    let type: PowerUpType;
    if (canDropGun && Math.random() < 0.5) {
      type = 'gun';
      this.lastGunDropWave = this._currentWave;
    } else {
      type = 'health';
    }

    const powerUp = this.powerUpPool.get(x, y, 'powerupBolt') as PowerUp | null;
    if (!powerUp) return;

    powerUp.spawn(x, y, type);
  }

  private onPowerUpCollected(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    powerUpObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    const powerUp = powerUpObj as PowerUp;
    if (!powerUp.active) return;

    powerUp.deactivate();
    this.scene.sound.play('sfxShieldUp', { volume: 0.5 });
    this.callbacks.onPowerUpCollected(powerUp.powerType);
  }

  private onEnemyBulletHitPlayer(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;

    if (!bullet.active || !this.player.isAlive) return;

    bullet.setActive(false);
    bullet.setVisible(false);

    if (!this.player.invincible) {
      this.callbacks.onPlayerHit(15);
    }
  }

  private onEnemyCollidePlayer(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    const enemy = enemyObj as Enemy;

    if (!enemy.active || !this.player.isAlive) return;

    enemy.takeDamage(999);
    if (!this.player.invincible) {
      this.callbacks.onPlayerHit(30);
    }
  }
}
