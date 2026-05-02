import { SCORE } from '../config/game.config';

export class ScoreManager {
  private _score = 0;
  private _coins = 0;
  private _highScore: number;

  constructor() {
    this._highScore = this.loadHighScore();
  }

  get score(): number {
    return this._score;
  }

  get coins(): number {
    return this._coins;
  }

  get highScore(): number {
    return this._highScore;
  }

  addKillScore(baseScore: number): void {
    this._score += baseScore;
  }

  addWaveBonus(): void {
    this._score += SCORE.waveBonus;
  }

  addCoin(): void {
    this._coins += SCORE.coinValue;
  }

  saveHighScore(): void {
    if (this._score > this._highScore) {
      this._highScore = this._score;
      localStorage.setItem('spaceShooter_highScore', String(this._highScore));
    }
  }

  reset(): void {
    this._score = 0;
    this._coins = 0;
  }

  private loadHighScore(): number {
    const saved = localStorage.getItem('spaceShooter_highScore');
    return saved ? parseInt(saved, 10) : 0;
  }
}
