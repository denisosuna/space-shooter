import Phaser from 'phaser';
import { Boss } from '../entities/Boss';
import { getBossConfig } from '../config/waves.config';
import type { Player } from '../entities/Player';

export interface BossCallbacks {
  onBossSpawned: (name: string) => void;
  onBossHpChanged: (hp: number, maxHp: number) => void;
  onBossDefeated: (score: number, coins: number) => void;
}

export class BossManager {
  private player: Player;
  private callbacks: BossCallbacks;

  private boss!: Boss;
  private _bossGroup!: Phaser.Physics.Arcade.Group;
  private _bossBulletGroup!: Phaser.Physics.Arcade.Group;
  private _active = false;

  constructor(scene: Phaser.Scene, player: Player, callbacks: BossCallbacks) {
    this.player = player;
    this.callbacks = callbacks;

    this._bossGroup = scene.physics.add.group({ allowGravity: false });
    this._bossBulletGroup = scene.physics.add.group({
      maxSize: 60,
      allowGravity: false,
    });

    this.boss = new Boss(scene, -200, -200);
    this._bossGroup.add(this.boss);
  }

  get bossGroup(): Phaser.Physics.Arcade.Group {
    return this._bossGroup;
  }

  get bossBullets(): Phaser.Physics.Arcade.Group {
    return this._bossBulletGroup;
  }

  get isBossActive(): boolean {
    return this._active;
  }

  /** Returns true if this wave should have a boss */
  static isBossWave(wave: number): boolean {
    return wave % 5 === 0;
  }

  trySpawnBoss(wave: number): boolean {
    const cfg = getBossConfig(wave);
    if (!cfg) return false;

    this._active = true;
    this.boss.init(
      cfg,
      this._bossBulletGroup,
      this.player,
      (hp, maxHp) => this.callbacks.onBossHpChanged(hp, maxHp),
      () => {
        this._active = false;
        this.callbacks.onBossDefeated(cfg.score, cfg.coinReward);
      },
    );

    this.callbacks.onBossSpawned(cfg.name);
    return true;
  }

  update(): void {
    // Clean up off-screen boss bullets
    for (const b of this._bossBulletGroup.children) {
      const bullet = b as Phaser.Physics.Arcade.Sprite;
      if (!bullet.active) continue;
      if (bullet.y > 850 || bullet.x < -20 || bullet.x > 520) {
        bullet.setActive(false);
        bullet.setVisible(false);
        (bullet.body as Phaser.Physics.Arcade.Body).enable = false;
      }
    }
  }

  /** Call when a player bullet hits the boss */
  hitBoss(bullet: Phaser.Physics.Arcade.Sprite): void {
    bullet.setActive(false);
    bullet.setVisible(false);
    (bullet.body as Phaser.Physics.Arcade.Body).enable = false;
    this.boss.takeDamage(1);
  }
}
