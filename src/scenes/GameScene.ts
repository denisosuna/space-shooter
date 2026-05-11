import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, DEPTH, DAMAGE, FONT_FAMILY, isReducedEffects } from '../config/game.config';
import { Player } from '../entities/Player';
import { createPowerUpPool } from '../entities/pools';
import { WaveManager } from '../systems/WaveManager';
import { BossManager } from '../systems/BossManager';
import { BombManager } from '../systems/BombManager';
import { CollisionManager } from '../systems/CollisionManager';
import { ScoreManager } from '../systems/ScoreManager';
import { ProgressionManager } from '../systems/ProgressionManager';
import { HUD } from '../ui/HUD';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private waveManager!: WaveManager;
  private bossManager!: BossManager;
  private collisionManager!: CollisionManager;
  private scoreManager!: ScoreManager;
  private bombManager!: BombManager;
  private progressionManager!: ProgressionManager;
  private hud!: HUD;
  private bgLayers: Phaser.GameObjects.TileSprite[] = [];
  private powerUpPool!: Phaser.Physics.Arcade.Group;
  private gameOver = false;
  private bombKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;
  private isPaused = false;
  private pauseOverlay!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.gameOver = false;
    this.isPaused = false;

    this.createBackground();

    this.player = new Player(this);

    this.scoreManager = new ScoreManager();
    this.scoreManager.reset();

    this.hud = new HUD(this);
    this.hud.updateHealth(this.player.currentHealth);
    this.hud.updateBombs(this.player.bombs);
    this.hud.setOnPause(() => this.togglePause());
    this.hud.setOnBomb(() => {
      if (!this.gameOver && !this.isPaused) this.bombManager?.trigger();
    });

    // Keys
    this.bombKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B);
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.waveManager = new WaveManager(this, this.player);
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
        const warnText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.35, `⚠ ${name} ⚠`, {
          fontFamily: FONT_FAMILY,
          fontSize: '18px', color: '#ff2222',
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
        this.progressionManager.check(this.scoreManager.coins);
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
        this.progressionManager.check(this.scoreManager.coins);
      },
      onPlayerHit: (damage) => {
        const hadGunLevel = this.player.gunLevel;
        this.player.takeDamage(damage);
        this.player.downgradeGun();
        this.hud.updateHealth(this.player.currentHealth);
        this.hud.updateGunLevel(this.player.gunLevel);
        this.hud.updateShield(this.player.shieldHits);
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
          this.player.heal(DAMAGE.healAmount);
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

    // Unified boss collisions via CollisionManager
    this.collisionManager.setupBossCollisions(this.bossManager);

    // Progression manager
    this.progressionManager = new ProgressionManager(this.player, {
      onLevelUp: (level, health, maxHp, gunLevel) => {
        this.hud.showLevelUp(level);
        this.hud.updateHealth(health, maxHp);
        this.hud.updateGunLevel(gunLevel);
      },
    });

    // Bomb manager
    this.bombManager = new BombManager(this.player, this.waveManager, this.bossManager, {
      onBombUsed: (bombsLeft) => this.hud.updateBombs(bombsLeft),
      onEnemyKilled: (score) => {
        this.scoreManager.addKillScore(score);
        this.scoreManager.addCoin();
        this.hud.updateScore(this.scoreManager.score);
        this.hud.updateCoins(this.scoreManager.coins);
        this.hud.updateCombo(this.scoreManager.combo);
      },
    });

    // Pause overlay (hidden by default)
    this.createPauseOverlay();

    this.waveManager.startWaves();
    this.hud.showWaveAnnouncement(1);

    // Tutorial on first play
    this.showTutorialIfNeeded();
  }

  update(time: number, delta: number): void {
    if (this.gameOver) return;

    // Pause toggle
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.togglePause();
    }
    if (this.isPaused) return;

    // Parallax scroll
    this.bgLayers[0].tilePositionY -= 0.3;
    this.bgLayers[1].tilePositionY -= 0.8;
    this.bgLayers[2].tilePositionY -= 1.5;

    // Bomb trigger
    if (Phaser.Input.Keyboard.JustDown(this.bombKey)) {
      this.bombManager.trigger();
    }

    // Combo timer
    const comboExpired = this.scoreManager.update(delta);
    if (comboExpired) this.hud.updateCombo(1, true);

    this.player.update(time, delta);
    this.waveManager.update();
    this.bossManager.update();
    this.collisionManager.update();
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.physics.pause();
      this.pauseOverlay.setVisible(true);
      this.tweens.add({ targets: this.pauseOverlay, alpha: { from: 0, to: 1 }, duration: 200 });
    } else {
      this.physics.resume();
      this.pauseOverlay.setVisible(false);
    }
  }

  private createPauseOverlay(): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.35, 'PAUSED', {
      fontFamily: FONT_FAMILY,
      fontSize: '28px',
      color: '#ffffff',
    });
    title.setOrigin(0.5);

    const resumeBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.5, '[ RESUME ]', {
      fontFamily: FONT_FAMILY,
      fontSize: '14px',
      color: '#00ff00',
    });
    resumeBtn.setOrigin(0.5);
    resumeBtn.setInteractive({ useHandCursor: true });
    resumeBtn.on('pointerdown', () => this.togglePause());

    const menuBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.6, '[ MENU ]', {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: '#888888',
    });
    menuBtn.setOrigin(0.5);
    menuBtn.setInteractive({ useHandCursor: true });
    menuBtn.on('pointerdown', () => {
      this.isPaused = false;
      this.physics.resume();
      this.scene.start('MenuScene');
    });

    const controls = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.75, 
      'DRAG / ARROWS = Move\nBomb button / B = Bomb\nESC / || = Pause', {
      fontFamily: FONT_FAMILY,
      fontSize: '8px',
      color: '#aaaaaa',
      align: 'center',
      lineSpacing: 8,
    });
    controls.setOrigin(0.5);

    this.pauseOverlay = this.add.container(0, 0, [bg, title, resumeBtn, menuBtn, controls]);
    this.pauseOverlay.setDepth(DEPTH.hud + 10);
    this.pauseOverlay.setVisible(false);
  }

  private showTutorialIfNeeded(): void {
    if (localStorage.getItem('spaceShooter_tutorialSeen') === 'true') return;
    localStorage.setItem('spaceShooter_tutorialSeen', 'true');

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.6);
    bg.fillRect(0, GAME_HEIGHT * 0.4, GAME_WIDTH, GAME_HEIGHT * 0.25);

    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.5, 
      'DRAG or ARROWS to move\nTap bomb button or B\nCollect power-ups!', {
      fontFamily: FONT_FAMILY,
      fontSize: '9px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 10,
    });
    text.setOrigin(0.5);

    const tapHint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.62, 'TAP TO DISMISS', {
      fontFamily: FONT_FAMILY,
      fontSize: '7px',
      color: '#00ff00',
    });
    tapHint.setOrigin(0.5);

    const container = this.add.container(0, 0, [bg, text, tapHint]);
    container.setDepth(DEPTH.hud + 5);

    // Auto-dismiss after 5s or on tap
    const dismiss = () => {
      this.tweens.add({
        targets: container, alpha: 0, duration: 400,
        onComplete: () => container.destroy(),
      });
    };

    this.time.delayedCall(5000, dismiss);
    this.input.once('pointerdown', dismiss);
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

    // Slow-motion death effect
    this.physics.world.timeScale = 3;
    this.cameras.main.zoomTo(1.1, 1000);
    if (!isReducedEffects()) {
      this.cameras.main.shake(500, 0.01);
    }

    // Fade to red vignette
    const vignette = this.add.graphics();
    vignette.setDepth(DEPTH.hud + 2);
    vignette.fillStyle(0x220000, 0);
    vignette.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.tweens.add({ targets: vignette, alpha: { from: 0, to: 0.5 }, duration: 1200 });

    const gameOverText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.4, 'GAME OVER', {
      fontFamily: FONT_FAMILY,
      fontSize: '22px',
      color: '#ff3333',
      stroke: '#000000',
      strokeThickness: 4,
    });
    gameOverText.setOrigin(0.5).setDepth(DEPTH.hud + 3).setAlpha(0);
    this.tweens.add({ targets: gameOverText, alpha: 1, duration: 800, delay: 400 });

    this.time.delayedCall(2500, () => {
      this.physics.world.timeScale = 1;
      this.scene.start('GameOverScene', {
        score: this.scoreManager.score,
        coins: this.scoreManager.coins,
        wave: this.waveManager.currentWave,
        highScore: this.scoreManager.highScore,
      });
    });
  }
}

