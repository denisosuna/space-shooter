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
  private bgLayers: Phaser.GameObjects.TileSprite[] = [];
  private powerUpPool!: Phaser.Physics.Arcade.Group;
  private gameOver = false;
  private bombKey!: Phaser.Input.Keyboard.Key;

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
    this.hud.updateBombs(this.player.bombs);

    // Bomb key (keyboard B)
    this.bombKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B);

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
        const warnText = this.add.text(GAME_WIDTH / 2, 380, `⚠ ${name} ⚠`, {
          fontSize: '36px', color: '#ff2222', fontStyle: 'bold',
          stroke: '#000000', strokeThickness: 5,
        });
        warnText.setOrigin(0.5).setDepth(DEPTH.hud + 1);
        this.tweens.add({ targets: warnText, alpha: 0, scale: 1.4, duration: 1800, onComplete: () => warnText.destroy() });
      },
      onBossHpChanged: (hp, maxHp) => { this.hud.updateBossHp(hp, maxHp); },
      onBossDefeated: (score, coins) => {
        this.hud.hideBossBar();
        for (let i = 0; i < coins; i++) this.scoreManager.addCoin();
        this.scoreManager.addKillScore(score);
        this.hud.updateScore(this.scoreManager.score);
        this.hud.updateCoins(this.scoreManager.coins);
        this.collisionManager.spawnRecoverablePowerUp(GAME_WIDTH / 2, 200);
        this.waveManager.notifyBossDefeated();
        this.checkShipLevelUp();
      },
    });

    this.waveManager.setBossManager(this.bossManager);

    this.powerUpPool = createPowerUpPool(this, 20);

    this.collisionManager = new CollisionManager(this, this.player, {
      onEnemyHit: (_enemy, score) => {
        this.scoreManager.addKillScore(score);
        this.scoreManager.addCoin();
        this.hud.updateScore(this.scoreManager.score);
        this.hud.updateCoins(this.scoreManager.coins);
        this.hud.updateCombo(this.scoreManager.combo);
        this.checkShipLevelUp();
      },
      onPlayerHit: (damage) => {
        const hadGunLevel = this.player.gunLevel;
        this.player.takeDamage(damage);
        this.player.downgradeGun();
        this.hud.updateHealth(this.player.currentHealth);
        this.hud.updateGunLevel(this.player.gunLevel);
        if (hadGunLevel > 1 && this.player.isAlive) {
          this.collisionManager.spawnRecoverablePowerUp(this.player.x, this.player.y - 40);
        }
        if (!this.player.isAlive) this.handleGameOver();
      },
      onPowerUpCollected: (type) => {
        if (type === 'gun') {
          this.player.upgradeGun();
          this.hud.updateGunLevel(this.player.gunLevel);
        } else if (type === 'health') {
          this.player.heal(25);
          this.hud.updateHealth(this.player.currentHealth);
        } else if (type === 'bomb') {
          this.player.addBomb();
          this.hud.updateBombs(this.player.bombs);
        } else if (type === 'shield') {
          this.player.addShield(3);
          this.hud.updateShield(this.player.shieldHits);
        }
      },
    });

    this.collisionManager.setup(
      this.waveManager.enemies,
      this.waveManager.enemyBullets,
      this.powerUpPool,
    );

    // Boss collision: player bullets vs boss
    this.physics.add.overlap(this.player.bullets, this.bossManager.bossGroup, (_bullet) => {
      this.bossManager.hitBoss(_bullet as Phaser.Physics.Arcade.Sprite, this.player.bulletDamage);
    });

    // Boss bullets vs player (Phaser 4 arg-swap)
    this.physics.add.overlap(this.bossManager.bossBullets, this.player, (_swappedPlayer, _swappedBullet) => {
      const bullet = _swappedBullet as Phaser.Physics.Arcade.Sprite;
      if (!bullet.active) return;
      bullet.setActive(false).setVisible(false);
      (bullet.body as Phaser.Physics.Arcade.Body).enable = false;

      if (this.player.invincible) return;
      if (!this.player.tryShieldAbsorb()) {
        const hadGunLevel = this.player.gunLevel;
        this.player.takeDamage(20);
        this.player.downgradeGun();
        this.hud.updateHealth(this.player.currentHealth);
        this.hud.updateGunLevel(this.player.gunLevel);
        this.hud.updateShield(this.player.shieldHits);
        if (hadGunLevel > 1 && this.player.isAlive) {
          this.collisionManager.spawnRecoverablePowerUp(this.player.x, this.player.y - 40);
        }
      } else {
        this.hud.updateShield(this.player.shieldHits);
      }
      if (!this.player.isAlive) this.handleGameOver();
    });

    this.waveManager.startWaves();
    this.hud.showWaveAnnouncement(1);
  }

  update(time: number, delta: number): void {
    if (this.gameOver) return;

    // Parallax scroll
    this.bgLayers[0].tilePositionY -= 0.3;
    this.bgLayers[1].tilePositionY -= 0.8;
    this.bgLayers[2].tilePositionY -= 1.5;

    // Bomb trigger
    if (Phaser.Input.Keyboard.JustDown(this.bombKey)) {
      this.triggerBomb();
    }

    // Combo timer
    const comboExpired = this.scoreManager.update(delta);
    if (comboExpired) this.hud.updateCombo(1, true);

    this.player.update(time, delta);
    this.waveManager.update();
    this.bossManager.update();
    this.collisionManager.update();
  }

  private triggerBomb(): void {
    if (!this.player.useBomb()) return;
    this.hud.updateBombs(this.player.bombs);

    // Clear all enemy bullets
    for (const b of this.waveManager.enemyBullets.children) {
      const bullet = b as Phaser.Physics.Arcade.Sprite;
      if (bullet.active) { bullet.setActive(false).setVisible(false); (bullet.body as Phaser.Physics.Arcade.Body).enable = false; }
    }
    for (const b of this.bossManager.bossBullets.children) {
      const bullet = b as Phaser.Physics.Arcade.Sprite;
      if (bullet.active) { bullet.setActive(false).setVisible(false); (bullet.body as Phaser.Physics.Arcade.Body).enable = false; }
    }

    // Damage all active enemies
    for (const e of this.waveManager.enemies.children) {
      const enemy = e as unknown as { active: boolean; takeDamage?: (n: number) => boolean; getScore?: () => number; x: number; y: number };
      if (enemy.active && enemy.takeDamage) {
        const killed = enemy.takeDamage(12);
        if (killed && enemy.getScore) {
          this.scoreManager.addKillScore(enemy.getScore());
          this.scoreManager.addCoin();
          this.hud.updateScore(this.scoreManager.score);
          this.hud.updateCoins(this.scoreManager.coins);
          this.hud.updateCombo(this.scoreManager.combo);
        }
      }
    }
    // Damage boss
    if (this.bossManager.isBossActive) this.bossManager.hitBossDirectly(18);
  }

  private createBackground(): void {
    // 3 parallax star layers generated at runtime
    const texKeys = ['bgLayer0', 'bgLayer1', 'bgLayer2'];
    const starCounts = [120, 60, 30];
    const sizes = [1, 1.5, 2];

    for (let i = 0; i < 3; i++) {
      const g = this.make.graphics();
      g.fillStyle(0x000011, 1);
      g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      for (let s = 0; s < starCounts[i]; s++) {
        const alpha = 0.4 + Math.random() * 0.6;
        g.fillStyle(0xffffff, alpha);
        const sx = Math.floor(Math.random() * GAME_WIDTH);
        const sy = Math.floor(Math.random() * GAME_HEIGHT);
        g.fillRect(sx, sy, sizes[i], sizes[i]);
      }
      g.generateTexture(texKeys[i], GAME_WIDTH, GAME_HEIGHT);
      g.destroy();

      const layer = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, texKeys[i]);
      layer.setOrigin(0, 0);
      layer.setDepth(DEPTH.background + i);
      layer.setAlpha(i === 0 ? 1 : 0.6 + i * 0.2);
      this.bgLayers.push(layer);
    }
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
    const THRESHOLDS = [750, 1100, 1800, 3000, 5000];
    const nextThreshold = THRESHOLDS[currentLevel - 1] ?? Infinity;
    if (currentLevel < 6 && coins >= nextThreshold) {
      this.player.levelUpShip();
      this.hud.showLevelUp(this.player.shipLevel);
      this.hud.updateHealth(this.player.currentHealth, this.player.maxHP);
      this.hud.updateGunLevel(this.player.gunLevel);
    }
  }
}

