import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, DEPTH, FONT_FAMILY } from '../config/game.config';

interface GameOverData {
  score: number;
  coins: number;
  wave: number;
  highScore: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    const bg = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'bgDarkPurple');
    bg.setOrigin(0, 0);
    bg.setDepth(DEPTH.background);

    // Game Over text
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.2, 'GAME OVER', {
      fontFamily: FONT_FAMILY,
      fontSize: '24px',
      color: '#ff3333',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // Stats
    const statsY = GAME_HEIGHT * 0.4;
    const lineHeight = 45;

    this.add.text(GAME_WIDTH / 2, statsY, `Score: ${data.score}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '12px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, statsY + lineHeight, `Coins: ${data.coins}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: '#ffff00',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, statsY + lineHeight * 2, `Wave: ${data.wave}`, {
      fontFamily: FONT_FAMILY,
      fontSize: '10px',
      color: '#00ffff',
    }).setOrigin(0.5);

    // High score
    const isNewHighScore = data.score >= data.highScore && data.score > 0;
    const highScoreText = this.add.text(
      GAME_WIDTH / 2,
      statsY + lineHeight * 3,
      isNewHighScore ? 'NEW HIGH SCORE!' : `Best: ${data.highScore}`,
      {
        fontFamily: FONT_FAMILY,
        fontSize: isNewHighScore ? '14px' : '10px',
        color: isNewHighScore ? '#ff0' : '#aaa',
      },
    ).setOrigin(0.5);

    if (isNewHighScore) {
      this.tweens.add({
        targets: highScoreText,
        scale: 1.15,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    }

    // Restart button
    const restartBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.75, '[ TAP TO RESTART ]', {
      fontFamily: FONT_FAMILY,
      fontSize: '11px',
      color: '#00ff00',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: restartBtn,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Menu button
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.85, '[ MENU ]', {
      fontFamily: FONT_FAMILY,
      fontSize: '9px',
      color: '#888888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      this.scene.start('MenuScene');
    });

    // Delay input to avoid accidental restart
    this.time.delayedCall(500, () => {
      this.input.on('pointerdown', (_pointer: Phaser.Input.Pointer, targets: Phaser.GameObjects.GameObject[]) => {
        // Only restart if not clicking menu button
        if (targets.length === 0) {
          this.scene.start('GameScene');
        }
      });

      this.input.keyboard?.on('keydown-SPACE', () => {
        this.scene.start('GameScene');
      });
    });
  }
}
