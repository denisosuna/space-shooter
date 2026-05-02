import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.createLoadingBar();
    this.loadImages();
    this.loadAudio();
  }

  create(): void {
    this.scene.start('MenuScene');
  }

  private createLoadingBar(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      fontSize: '20px',
      color: '#ffffff',
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.add.text(width / 2, height / 2, '0%', {
      fontSize: '18px',
      color: '#ffffff',
    });
    percentText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      percentText.setText(`${Math.round(value * 100)}%`);
      progressBar.clear();
      progressBar.fillStyle(0x00ff00, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });
  }

  private loadImages(): void {
    // Player
    this.load.image('playerShip1', 'assets/images/player/playerShip1.png');
    this.load.image('playerShip2', 'assets/images/player/playerShip2.png');
    this.load.image('playerShip3', 'assets/images/player/playerShip3.png');

    // Enemies
    const enemyColors = ['Black', 'Blue', 'Green', 'Red'];
    for (const color of enemyColors) {
      for (let i = 1; i <= 5; i++) {
        this.load.image(`enemy${color}${i}`, `assets/images/enemies/enemy${color}${i}.png`);
      }
    }

    // Bullets
    this.load.image('laserBlue01', 'assets/images/bullets/laserBlue01.png');
    this.load.image('laserBlue02', 'assets/images/bullets/laserBlue02.png');
    this.load.image('laserRed01', 'assets/images/bullets/laserRed01.png');
    this.load.image('laserRed02', 'assets/images/bullets/laserRed02.png');
    this.load.image('laserGreen01', 'assets/images/bullets/laserGreen01.png');

    // Backgrounds
    this.load.image('bgBlack', 'assets/images/backgrounds/black.png');
    this.load.image('bgBlue', 'assets/images/backgrounds/blue.png');
    this.load.image('bgDarkPurple', 'assets/images/backgrounds/darkPurple.png');
    this.load.image('bgPurple', 'assets/images/backgrounds/purple.png');

    // UI
    this.load.image('powerupBolt', 'assets/images/ui/bolt_gold.png');
    this.load.image('powerupShield', 'assets/images/ui/shield_gold.png');
    this.load.image('star', 'assets/images/ui/star_gold.png');

    // Explosions / Effects
    this.load.image('fire00', 'assets/images/explosions/fire00.png');
    this.load.image('fire01', 'assets/images/explosions/fire01.png');
  }

  private loadAudio(): void {
    this.load.audio('sfxLaser1', 'assets/audio/sfx/sfx_laser1.ogg');
    this.load.audio('sfxLaser2', 'assets/audio/sfx/sfx_laser2.ogg');
    this.load.audio('sfxLose', 'assets/audio/sfx/sfx_lose.ogg');
    this.load.audio('sfxShieldDown', 'assets/audio/sfx/sfx_shieldDown.ogg');
    this.load.audio('sfxShieldUp', 'assets/audio/sfx/sfx_shieldUp.ogg');
    this.load.audio('sfxTwoTone', 'assets/audio/sfx/sfx_twoTone.ogg');
    this.load.audio('sfxZap', 'assets/audio/sfx/sfx_zap.ogg');
  }
}
