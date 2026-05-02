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
  private currentMaxHealth: number = PLAYER.maxHealth;

  // Boss HP bar
  private bossBarContainer!: Phaser.GameObjects.Container;
  private bossBarBg!: Phaser.GameObjects.Graphics;
  private bossBarFill!: Phaser.GameObjects.Graphics;
  private bossNameText!: Phaser.GameObjects.Text;

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

    // Boss HP bar (hidden by default)
    this.bossBarBg = this.scene.add.graphics();
    this.bossBarFill = this.scene.add.graphics();
    this.bossNameText = this.scene.add.text(GAME_WIDTH / 2, 44, '', {
      fontSize: '14px',
      color: '#ff4444',
      fontStyle: 'bold',
    });
    this.bossNameText.setOrigin(0.5, 0);

    this.bossBarContainer = this.scene.add.container(0, 0, [
      this.bossBarBg,
      this.bossBarFill,
      this.bossNameText,
    ]);
    this.bossBarContainer.setDepth(depth);
    this.bossBarContainer.setVisible(false);
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

  updateHealth(currentHealth: number, maxHealth?: number): void {
    if (maxHealth !== undefined) this.currentMaxHealth = maxHealth;
    const ratio = currentHealth / this.currentMaxHealth;
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
    this.showCenterAnnouncement(`WAVE ${wave}`, '#ffffff', '#ff6600');
  }

  showLevelUp(shipLevel: number): void {
    const names = ['', 'FIGHTER', 'DESTROYER', 'WARSHIP'];
    this.showCenterAnnouncement(`LEVEL UP!\n${names[shipLevel]}`, '#ffff00', '#ff3300');
  }

  showBossBar(name: string, hp: number, maxHp: number): void {
    const barW = GAME_WIDTH - 40;
    this.bossBarBg.clear();
    this.bossBarBg.fillStyle(0x220000, 0.9);
    this.bossBarBg.fillRect(20, 38, barW, 14);

    this.bossNameText.setText(name);
    this.updateBossHp(hp, maxHp);

    this.bossBarContainer.setVisible(true);
    this.bossBarContainer.setAlpha(0);
    this.scene.tweens.add({
      targets: this.bossBarContainer,
      alpha: 1,
      duration: 400,
    });
  }

  updateBossHp(hp: number, maxHp: number): void {
    const barW = GAME_WIDTH - 40;
    const ratio = Math.max(0, hp / maxHp);
    this.bossBarFill.clear();
    // Color shifts red → dark red as HP drops
    const r = Math.round(180 + 75 * ratio);
    const color = Phaser.Display.Color.GetColor(r, 20, 20);
    this.bossBarFill.fillStyle(color, 1);
    this.bossBarFill.fillRect(20, 38, Math.floor(barW * ratio), 14);
  }

  hideBossBar(): void {
    this.scene.tweens.add({
      targets: this.bossBarContainer,
      alpha: 0,
      duration: 600,
      onComplete: () => this.bossBarContainer.setVisible(false),
    });
  }

  private showCenterAnnouncement(message: string, color: string, stroke: string): void {
    const text = this.scene.add.text(GAME_WIDTH / 2, 400, message, {
      fontSize: '48px',
      color,
      fontStyle: 'bold',
      stroke,
      strokeThickness: 4,
      align: 'center',
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
