import Phaser from 'phaser';
import { DAMAGE } from '../config/game.config';
import type { Player } from '../entities/Player';
import type { WaveManager } from './WaveManager';
import type { BossManager } from './BossManager';

export interface BombCallbacks {
  onBombUsed: (bombsLeft: number) => void;
  onEnemyKilled: (score: number) => void;
}

export class BombManager {
  private player: Player;
  private waveManager: WaveManager;
  private bossManager: BossManager;
  private callbacks: BombCallbacks;

  constructor(
    player: Player,
    waveManager: WaveManager,
    bossManager: BossManager,
    callbacks: BombCallbacks,
  ) {
    this.player = player;
    this.waveManager = waveManager;
    this.bossManager = bossManager;
    this.callbacks = callbacks;
  }

  trigger(): boolean {
    if (!this.player.useBomb()) return false;

    this.callbacks.onBombUsed(this.player.bombs);

    // Clear all enemy bullets
    this.clearBulletGroup(this.waveManager.enemyBullets);
    this.clearBulletGroup(this.bossManager.bossBullets);

    // Damage all active enemies
    for (const e of this.waveManager.enemies.children) {
      const enemy = e as unknown as {
        active: boolean;
        takeDamage?: (n: number) => boolean;
        getScore?: () => number;
      };
      if (enemy.active && enemy.takeDamage) {
        const killed = enemy.takeDamage(DAMAGE.bombToEnemies);
        if (killed && enemy.getScore) {
          this.callbacks.onEnemyKilled(enemy.getScore());
        }
      }
    }

    // Damage boss
    if (this.bossManager.isBossActive) {
      this.bossManager.hitBossDirectly(DAMAGE.bombToBoss);
    }

    return true;
  }

  private clearBulletGroup(group: Phaser.Physics.Arcade.Group): void {
    for (const b of group.children) {
      const bullet = b as Phaser.Physics.Arcade.Sprite;
      if (bullet.active) {
        bullet.setActive(false).setVisible(false);
        (bullet.body as Phaser.Physics.Arcade.Body).enable = false;
      }
    }
  }
}
