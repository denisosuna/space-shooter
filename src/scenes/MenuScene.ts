import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, DEPTH } from '../config/game.config';

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
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.25, 'SPACE\nSHOOTER', {
      fontSize: '64px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
      stroke: '#0066ff',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);

    // Player ship preview
    const ship = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT * 0.5, 'playerShip1');
    ship.setScale(1.5);

    // Start button
    const startBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.7, '[ TAP TO START ]', {
      fontSize: '28px',
      color: '#00ff00',
      fontStyle: 'bold',
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

    // Float animation for ship
    this.tweens.add({
      targets: ship,
      y: ship.y - 15,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // High score
    const highScore = this.getHighScore();
    if (highScore > 0) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.82, `HIGH SCORE: ${highScore}`, {
        fontSize: '18px',
        color: '#ffff00',
      }).setOrigin(0.5);
    }

    // Credits
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.95, 'Assets by Kenney.nl (CC0)', {
      fontSize: '12px',
      color: '#666666',
    }).setOrigin(0.5);

    // Input
    this.input.on('pointerdown', () => {
      this.scene.start('GameScene');
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
