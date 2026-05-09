import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, DEPTH, FONT_FAMILY, isReducedEffects, setReducedEffects } from '../config/game.config';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // Background
    const bg = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'bgDarkPurple');
    bg.setOrigin(0, 0);
    bg.setDepth(DEPTH.background);

    // Title
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.2, 'SPACE\nSHOOTER', {
      fontFamily: FONT_FAMILY,
      fontSize: '32px',
      color: '#ffffff',
      align: 'center',
      stroke: '#0066ff',
      strokeThickness: 6,
      lineSpacing: 8,
    });
    title.setOrigin(0.5);

    // Player ship preview
    const ship = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT * 0.45, 'playerShip1');
    ship.setScale(1.5);

    // Float animation for ship
    this.tweens.add({
      targets: ship,
      y: ship.y - 15,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Start button
    const startBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.62, '[ TAP TO START ]', {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: '#00ff00',
    });
    startBtn.setOrigin(0.5);

    // Blink animation
    this.tweens.add({
      targets: startBtn,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Controls info
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.72, 'ARROWS / DRAG = Move\nB = Bomb   ESC = Pause', {
      fontFamily: FONT_FAMILY,
      fontSize: '7px',
      color: '#aaaaaa',
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5);

    // Accessibility toggle
    const reduced = isReducedEffects();
    const a11yBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.82, 
      reduced ? '[x] REDUCE EFFECTS' : '[ ] REDUCE EFFECTS', {
      fontFamily: FONT_FAMILY,
      fontSize: '7px',
      color: reduced ? '#00ff00' : '#666666',
    });
    a11yBtn.setOrigin(0.5);
    a11yBtn.setInteractive({ useHandCursor: true });
    a11yBtn.on('pointerdown', () => {
      const newVal = !isReducedEffects();
      setReducedEffects(newVal);
      a11yBtn.setText(newVal ? '[x] REDUCE EFFECTS' : '[ ] REDUCE EFFECTS');
      a11yBtn.setColor(newVal ? '#00ff00' : '#666666');
    });

    // High score
    const highScore = this.getHighScore();
    if (highScore > 0) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.89, `HIGH SCORE: ${highScore}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '8px',
        color: '#ffff00',
      }).setOrigin(0.5);
    }

    // Credits
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.95, 'Assets by Kenney.nl (CC0)', {
      fontFamily: FONT_FAMILY,
      fontSize: '6px',
      color: '#666666',
    }).setOrigin(0.5);

    // Input
    this.input.on('pointerdown', (_pointer: Phaser.Input.Pointer, targets: Phaser.GameObjects.GameObject[]) => {
      if (targets.length === 0) {
        this.scene.start('GameScene');
      }
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      this.scene.start('GameScene');
    });
  }

  private getHighScore(): number {
    const saved = localStorage.getItem('spaceShooter_highScore');
    return saved ? parseInt(saved, 10) : 0;
  }
}
