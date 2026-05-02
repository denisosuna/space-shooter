import Phaser from 'phaser';
import { GAME_WIDTH, PLAYER, DEPTH } from '../config/game.config';

export class HUD {
  private scene: Phaser.Scene;
  private scoreText!: Phaser.GameObjects.Text;
  private coinText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private healthBarBg!: Phaser.GameObjects.Graphics;
  private healthBarFill!: Phaser.GameObjects.Graphics;
  private coinIcon!: Phaser.GameObjects.Image;
  private gunLevelText!: Phaser.GameObjects.Text;
  private gunLevelIcon!: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
  }

  private create(): void {
    const depth = DEPTH.hud;

    // Score
    this.scoreText = this.scene.add.text(GAME_WIDTH / 2, 15, 'SCORE: 0', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.scoreText.setOrigin(0.5, 0);
    this.scoreText.setDepth(depth);

    // Coins
    this.coinIcon = this.scene.add.image(15, 15, 'star');
    this.coinIcon.setScale(0.5);
    this.coinIcon.setOrigin(0, 0);
    this.coinIcon.setDepth(depth);

    this.coinText = this.scene.add.text(45, 16, '0', {
      fontSize: '18px',
      color: '#ffff00',
      fontStyle: 'bold',
    });
    this.coinText.setDepth(depth);

    // Wave indicator
    this.waveText = this.scene.add.text(GAME_WIDTH - 15, 15, 'WAVE 1', {
      fontSize: '16px',
      color: '#00ffff',
      fontStyle: 'bold',
    });
    this.waveText.setOrigin(1, 0);
    this.waveText.setDepth(depth);

    // Health bar background
    this.healthBarBg = this.scene.add.graphics();
    this.healthBarBg.setDepth(depth);
    this.healthBarBg.fillStyle(0x333333, 0.8);
    this.healthBarBg.fillRect(15, GAME_WIDTH < 500 ? 770 : 770, GAME_WIDTH - 30, 12);

    // Health bar fill
    this.healthBarFill = this.scene.add.graphics();
    this.healthBarFill.setDepth(depth);

    // Gun level indicator
    this.gunLevelIcon = this.scene.add.image(GAME_WIDTH - 15, 38, 'powerupBolt');
    this.gunLevelIcon.setScale(0.4);
    this.gunLevelIcon.setOrigin(1, 0);
    this.gunLevelIcon.setDepth(depth);

    this.gunLevelText = this.scene.add.text(GAME_WIDTH - 40, 40, 'Lv.1', {
      fontSize: '14px',
      color: '#ffcc00',
      fontStyle: 'bold',
    });
    this.gunLevelText.setOrigin(1, 0);
    this.gunLevelText.setDepth(depth);
  }

  updateScore(score: number): void {
    this.scoreText.setText(`SCORE: ${score}`);
  }

  updateCoins(coins: number): void {
    this.coinText.setText(String(coins));
  }

  updateWave(wave: number): void {
    this.waveText.setText(`WAVE ${wave}`);

    // Flash wave text
    this.scene.tweens.add({
      targets: this.waveText,
      scale: 1.5,
      duration: 300,
      yoyo: true,
      ease: 'Bounce.easeOut',
    });
  }

  updateHealth(currentHealth: number): void {
    const ratio = currentHealth / PLAYER.maxHealth;
    const barWidth = (GAME_WIDTH - 30) * ratio;

    this.healthBarFill.clear();

    let color = 0x00ff00;
    if (ratio < 0.3) color = 0xff0000;
    else if (ratio < 0.6) color = 0xffff00;

    this.healthBarFill.fillStyle(color, 1);
    this.healthBarFill.fillRect(15, 770, barWidth, 12);
  }

  updateGunLevel(level: number): void {
    this.gunLevelText.setText(`Lv.${level}`);

    this.scene.tweens.add({
      targets: [this.gunLevelText, this.gunLevelIcon],
      scale: 1.4,
      duration: 200,
      yoyo: true,
      ease: 'Back.easeOut',
    });
  }

  showWaveAnnouncement(wave: number): void {
    const text = this.scene.add.text(GAME_WIDTH / 2, 400, `WAVE ${wave}`, {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#ff6600',
      strokeThickness: 4,
    });
    text.setOrigin(0.5);
    text.setDepth(DEPTH.hud + 1);
    text.setAlpha(0);

    this.scene.tweens.add({
      targets: text,
      alpha: 1,
      scale: 1.2,
      duration: 500,
      yoyo: true,
      hold: 800,
      onComplete: () => text.destroy(),
    });
  }
}
