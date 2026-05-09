import { SCORE } from '../config/game.config';

export class ScoreManager {
  private _score = 0;
  private _coins = 0;
  private _highScore: number;
  private _combo = 1;
  private _comboTimer = 0;
  private static readonly COMBO_WINDOW = 2500; // ms between kills to maintain combo
  private static readonly MAX_COMBO = 8;

  constructor() {
    this._highScore = this.loadHighScore();
  }

  get score(): number { return this._score; }
  get coins(): number { return this._coins; }
  get highScore(): number { return this._highScore; }
  get combo(): number { return this._combo; }

  /** Call each frame with delta. Returns true if combo just expired. */
  update(delta: number): boolean {
    if (this._combo <= 1) return false;
    this._comboTimer += delta;
    if (this._comboTimer >= ScoreManager.COMBO_WINDOW) {
      this._combo = 1;
      this._comboTimer = 0;
      return true;
    }
    return false;
  }

  addKillScore(baseScore: number): void {
    this._score += baseScore * this._combo;
    this._combo = Math.min(ScoreManager.MAX_COMBO, this._combo + 1);
    this._comboTimer = 0;
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
    this._combo = 1;
    this._comboTimer = 0;
  }

  private loadHighScore(): number {
    const saved = localStorage.getItem('spaceShooter_highScore');
    return saved ? parseInt(saved, 10) : 0;
  }
}
