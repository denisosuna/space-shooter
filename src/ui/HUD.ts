import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER, DEPTH, FONT_FAMILY } from '../config/game.config';

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
  // Combo
  private comboText!: Phaser.GameObjects.Text;
  // Bombs
  private bombText!: Phaser.GameObjects.Text;
  private bombBtn!: Phaser.GameObjects.Text;
  // Shield
  private shieldText!: Phaser.GameObjects.Text;
  // Pause button
  private pauseBtn!: Phaser.GameObjects.Text;

  // Boss HP bar
  private bossBarContainer!: Phaser.GameObjects.Container;
  private bossBarBg!: Phaser.GameObjects.Graphics;
  private bossBarFill!: Phaser.GameObjects.Graphics;
  private bossNameText!: Phaser.GameObjects.Text;

  private onPauseCallback?: () => void;
  private onBombCallback?: () => void;

  // Derived layout positions
  private readonly HEALTH_BAR_Y = GAME_HEIGHT - 30;
  private readonly BOTTOM_ROW_Y = GAME_HEIGHT - 52;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
  }

  setOnPause(cb: () => void): void {
    this.onPauseCallback = cb;
  }

  setOnBomb(cb: () => void): void {
    this.onBombCallback = cb;
  }

  private create(): void {
    const depth = DEPTH.hud;
    const font = FONT_FAMILY;

    // Score
    this.scoreText = this.scene.add.text(GAME_WIDTH / 2, 15, 'SCORE: 0', {
      fontFamily: font,
      fontSize: '12px',
      color: '#ffffff',
    });
    this.scoreText.setOrigin(0.5, 0);
    this.scoreText.setDepth(depth);

    // Coins
    this.coinIcon = this.scene.add.image(15, 15, 'star');
    this.coinIcon.setScale(0.5);
    this.coinIcon.setOrigin(0, 0);
    this.coinIcon.setDepth(depth);

    this.coinText = this.scene.add.text(45, 16, '0', {
      fontFamily: font,
      fontSize: '10px',
      color: '#ffff00',
    });
    this.coinText.setDepth(depth);

    // Wave indicator
    this.waveText = this.scene.add.text(GAME_WIDTH - 50, 15, 'WAVE 1', {
      fontFamily: font,
      fontSize: '10px',
      color: '#00ffff',
    });
    this.waveText.setOrigin(1, 0);
    this.waveText.setDepth(depth);

    // Pause button (top-right corner)
    this.pauseBtn = this.scene.add.text(GAME_WIDTH - 10, 12, '||', {
      fontFamily: font,
      fontSize: '14px',
      color: '#aaaaaa',
    });
    this.pauseBtn.setOrigin(1, 0);
    this.pauseBtn.setDepth(depth);
    this.pauseBtn.setInteractive({ useHandCursor: true });
    this.pauseBtn.on('pointerdown', () => this.onPauseCallback?.());

    // Health bar background
    this.healthBarBg = this.scene.add.graphics();
    this.healthBarBg.setDepth(depth);
    this.healthBarBg.fillStyle(0x333333, 0.8);
    this.healthBarBg.fillRect(15, this.HEALTH_BAR_Y, GAME_WIDTH - 30, 12);

    // Health bar fill
    this.healthBarFill = this.scene.add.graphics();
    this.healthBarFill.setDepth(depth);

    // Gun level indicator
    this.gunLevelIcon = this.scene.add.image(GAME_WIDTH - 50, 32, 'powerupBolt');
    this.gunLevelIcon.setScale(0.4);
    this.gunLevelIcon.setOrigin(1, 0);
    this.gunLevelIcon.setDepth(depth);

    this.gunLevelText = this.scene.add.text(GAME_WIDTH - 72, 34, 'Lv.1', {
      fontFamily: font,
      fontSize: '8px',
      color: '#ffcc00',
    });
    this.gunLevelText.setOrigin(1, 0);
    this.gunLevelText.setDepth(depth);

    // Bomb counter (bottom-left)
    this.bombText = this.scene.add.text(15, this.BOTTOM_ROW_Y, 'BOMB x2', {
      fontFamily: font,
      fontSize: '8px',
      color: '#ff8800',
    });
    this.bombText.setDepth(depth);

    // Bomb touch button (bottom-right, large tap target)
    this.bombBtn = this.scene.add.text(GAME_WIDTH - 15, this.BOTTOM_ROW_Y - 8, '💣', {
      fontSize: '28px',
    });
    this.bombBtn.setOrigin(1, 0.5);
    this.bombBtn.setDepth(depth);
    this.bombBtn.setInteractive({ useHandCursor: true });
    this.bombBtn.on('pointerdown', () => this.onBombCallback?.());

    // Shield counter (next to bombs)
    this.shieldText = this.scene.add.text(110, this.BOTTOM_ROW_Y, '', {
      fontFamily: font,
      fontSize: '8px',
      color: '#44aaff',
    });
    this.shieldText.setDepth(depth);

    // Combo (center, just below score) — hidden when combo = 1
    this.comboText = this.scene.add.text(GAME_WIDTH / 2, 32, '', {
      fontFamily: font,
      fontSize: '12px',
      color: '#ff6600',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.comboText.setOrigin(0.5, 0);
    this.comboText.setDepth(depth);
    this.comboText.setVisible(false);

    // Boss HP bar (hidden by default)
    this.bossBarBg = this.scene.add.graphics();
    this.bossBarFill = this.scene.add.graphics();
    this.bossNameText = this.scene.add.text(GAME_WIDTH / 2, 44, '', {
      fontFamily: font,
      fontSize: '8px',
      color: '#ff4444',
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
    this.healthBarFill.fillRect(15, this.HEALTH_BAR_Y, barWidth, 12);
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

  updateCombo(combo: number, expired = false): void {
    if (combo <= 1) {
      if (expired && this.comboText.visible) {
        this.scene.tweens.add({
          targets: this.comboText, alpha: 0, duration: 300,
          onComplete: () => { this.comboText.setVisible(false); this.comboText.setAlpha(1); },
        });
      } else {
        this.comboText.setVisible(false);
      }
      return;
    }
    const colors = ['', '', '#ffcc00', '#ff8800', '#ff4400', '#ff0000', '#cc00ff', '#ff00cc', '#ffffff'];
    this.comboText.setText(`${combo}x COMBO`);
    this.comboText.setColor(colors[Math.min(combo, colors.length - 1)]);
    this.comboText.setVisible(true);
    this.scene.tweens.add({ targets: this.comboText, scale: { from: 1.3, to: 1 }, duration: 150, ease: 'Back.easeOut' });
  }

  updateBombs(count: number): void {
    this.bombText.setText(`BOMB x${count}`);
    this.bombText.setAlpha(count > 0 ? 1 : 0.3);
    this.bombBtn.setAlpha(count > 0 ? 1 : 0.3);
  }

  updateShield(hits: number): void {
    if (hits <= 0) { this.shieldText.setText(''); return; }
    this.shieldText.setText(`SHD x${hits}`);
  }

  showLevelUp(shipLevel: number): void {
    const names = ['', 'FIGHTER', 'DESTROYER', 'WARSHIP', 'GOLDEN EAGLE', 'PHANTOM', 'NEMESIS'];
    this.showCenterAnnouncement(`LEVEL UP!\n${names[shipLevel] ?? ''}`, '#ffff00', '#ff3300');
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
    const text = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.3, message, {
      fontFamily: FONT_FAMILY,
      fontSize: '24px',
      color,
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
