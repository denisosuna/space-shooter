import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, DEPTH } from '../config/game.config';
import { Player } from '../entities/Player';
import { createPowerUpPool } from '../entities/PowerUp';
import { WaveManager } from '../systems/WaveManager';
import { CollisionManager } from '../systems/CollisionManager';
import { ScoreManager } from '../systems/ScoreManager';
import { HUD } from '../ui/HUD';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private waveManager!: WaveManager;
  private collisionManager!: CollisionManager;
  private scoreManager!: ScoreManager;
  private hud!: HUD;
  private background!: Phaser.GameObjects.TileSprite;
  private powerUpPool!: Phaser.Physics.Arcade.Group;
  private gameOver = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.gameOver = false;

    this.createBackground();

    this.player = new Player(this);

    this.scoreManager = new ScoreManager();

    this.hud = new HUD(this);
    this.hud.updateHealth(this.player.currentHealth);

    this.waveManager = new WaveManager(this);
    this.waveManager.setOnWaveComplete((waveNum) => {
      this.scoreManager.addWaveBonus();
      this.hud.updateScore(this.scoreManager.score);
      this.hud.showWaveAnnouncement(waveNum + 1);
      this.hud.updateWave(waveNum + 1);
      this.collisionManager.setCurrentWave(waveNum + 1);
    });

    this.powerUpPool = createPowerUpPool(this, 15);

    this.collisionManager = new CollisionManager(this, this.player, {
      onEnemyHit: (_enemy, score) => {
        this.scoreManager.addKillScore(score);
        this.scoreManager.addCoin();
        this.hud.updateScore(this.scoreManager.score);
        this.hud.updateCoins(this.scoreManager.coins);
      },
      onPlayerHit: (damage) => {
        this.player.takeDamage(damage);
        this.player.downgradeGun();
        this.hud.updateHealth(this.player.currentHealth);
        this.hud.updateGunLevel(this.player.gunLevel);

        if (!this.player.isAlive) {
          this.handleGameOver();
        }
      },
      onPowerUpCollected: (type) => {
        if (type === 'gun') {
          this.player.upgradeGun();
          this.hud.updateGunLevel(this.player.gunLevel);
        } else {
          this.player.heal(25);
          this.hud.updateHealth(this.player.currentHealth);
        }
      },
    });

    this.collisionManager.setup(
      this.waveManager.enemies,
      this.waveManager.enemyBullets,
      this.powerUpPool,
    );

    this.waveManager.startWaves();
    this.hud.showWaveAnnouncement(1);
  }

  update(time: number, delta: number): void {
    if (this.gameOver) return;

    this.background.tilePositionY -= 1;

    this.player.update(time, delta);
    this.waveManager.update();
    this.collisionManager.update();
  }

  private createBackground(): void {
    this.background = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'bgDarkPurple');
    this.background.setOrigin(0, 0);
    this.background.setDepth(DEPTH.background);
  }

  private handleGameOver(): void {
    this.gameOver = true;
    this.scoreManager.saveHighScore();

    this.time.delayedCall(1500, () => {
      this.scene.start('GameOverScene', {
        score: this.scoreManager.score,
        coins: this.scoreManager.coins,
        wave: this.waveManager.currentWave,
        highScore: this.scoreManager.highScore,
      });
    });
  }
}
