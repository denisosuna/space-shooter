import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, DEPTH } from '../config/game.config';
import { Player } from '../entities/Player';
import { createPowerUpPool } from '../entities/PowerUp';
import { WaveManager } from '../systems/WaveManager';
import { BossManager } from '../systems/BossManager';
import { CollisionManager } from '../systems/CollisionManager';
import { ScoreManager } from '../systems/ScoreManager';
import { HUD } from '../ui/HUD';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private waveManager!: WaveManager;
  private bossManager!: BossManager;
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

    this.bossManager = new BossManager(this, this.player, {
      onBossSpawned: (name) => {
        this.hud.showBossBar(name, 1, 1);
        // Big warning announcement
        const warnText = this.add.text(GAME_WIDTH / 2, 380, `⚠ ${name} ⚠`, {
          fontSize: '36px',
          color: '#ff2222',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 5,
        });
        warnText.setOrigin(0.5);
        warnText.setDepth(DEPTH.hud + 1);
        this.tweens.add({
          targets: warnText,
          alpha: 0,
          scale: 1.4,
          duration: 1800,
          onComplete: () => warnText.destroy(),
        });
      },
      onBossHpChanged: (hp, maxHp) => {
        this.hud.updateBossHp(hp, maxHp);
      },
      onBossDefeated: (score, coins) => {
        this.hud.hideBossBar();
        // Award score + coins
        for (let i = 0; i < coins; i++) this.scoreManager.addCoin();
        this.scoreManager.addKillScore(score);
        this.hud.updateScore(this.scoreManager.score);
        this.hud.updateCoins(this.scoreManager.coins);
        // Guaranteed power-up drop
        this.collisionManager.spawnRecoverablePowerUp(GAME_WIDTH / 2, 200);
        // Notify WaveManager to advance
        this.waveManager.notifyBossDefeated();
        this.checkShipLevelUp();
      },
    });

    this.waveManager.setBossManager(this.bossManager);

    this.powerUpPool = createPowerUpPool(this, 15);

    this.collisionManager = new CollisionManager(this, this.player, {
      onEnemyHit: (_enemy, score) => {
        this.scoreManager.addKillScore(score);
        this.scoreManager.addCoin();
        this.hud.updateScore(this.scoreManager.score);
        this.hud.updateCoins(this.scoreManager.coins);
        this.checkShipLevelUp();
      },
      onPlayerHit: (damage) => {
        const hadGunLevel = this.player.gunLevel;
        this.player.takeDamage(damage);
        this.player.downgradeGun();
        this.hud.updateHealth(this.player.currentHealth);
        this.hud.updateGunLevel(this.player.gunLevel);

        // Spawn recoverable gun power-up if player lost a level
        if (hadGunLevel > 1 && this.player.isAlive) {
          this.collisionManager.spawnRecoverablePowerUp(this.player.x, this.player.y - 40);
        }

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

    // Boss collision: player bullets vs boss
    this.physics.add.overlap(
      this.player.bullets,
      this.bossManager.bossGroup,
      (_bullet, _boss) => {
        const bullet = _bullet as Phaser.Physics.Arcade.Sprite;
        this.bossManager.hitBoss(bullet);
      },
    );

    // Boss bullets vs player
    // Phaser 4 arg-swap: overlap(group, sprite, cb) → cb receives (sprite, groupMember)
    this.physics.add.overlap(
      this.bossManager.bossBullets,
      this.player,
      (_swappedPlayer, _swappedBullet) => {
        const bullet = _swappedBullet as Phaser.Physics.Arcade.Sprite;
        if (!bullet.active) return;
        bullet.setActive(false);
        bullet.setVisible(false);
        (bullet.body as Phaser.Physics.Arcade.Body).enable = false;

        const hadGunLevel = this.player.gunLevel;
        this.player.takeDamage(20);
        this.player.downgradeGun();
        this.hud.updateHealth(this.player.currentHealth);
        this.hud.updateGunLevel(this.player.gunLevel);
        if (hadGunLevel > 1 && this.player.isAlive) {
          this.collisionManager.spawnRecoverablePowerUp(this.player.x, this.player.y - 40);
        }
        if (!this.player.isAlive) this.handleGameOver();
      },
    );

    this.waveManager.startWaves();
    this.hud.showWaveAnnouncement(1);
  }

  update(time: number, delta: number): void {
    if (this.gameOver) return;

    this.background.tilePositionY -= 1;

    this.player.update(time, delta);
    this.waveManager.update();
    this.bossManager.update();
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

  private checkShipLevelUp(): void {
    const coins = this.scoreManager.coins;
    const currentLevel = this.player.shipLevel;
    const nextThreshold = currentLevel * 1000;

    if (currentLevel < 3 && coins >= nextThreshold) {
      this.player.levelUpShip();
      this.hud.showLevelUp(this.player.shipLevel);
      this.hud.updateHealth(this.player.currentHealth, this.player.maxHP);
      this.hud.updateGunLevel(this.player.gunLevel);
    }
  }
}
