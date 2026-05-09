import { PROGRESSION } from '../config/game.config';
import type { Player } from '../entities/Player';

export interface ProgressionCallbacks {
  onLevelUp: (newLevel: number, currentHealth: number, maxHealth: number, gunLevel: number) => void;
}

export class ProgressionManager {
  private player: Player;
  private callbacks: ProgressionCallbacks;

  constructor(player: Player, callbacks: ProgressionCallbacks) {
    this.player = player;
    this.callbacks = callbacks;
  }

  /** Check if the player should level up based on current coins. */
  check(coins: number): void {
    const currentLevel = this.player.shipLevel;
    const nextThreshold = PROGRESSION.shipThresholds[currentLevel - 1] ?? Infinity;

    if (currentLevel < PROGRESSION.maxShipLevel && coins >= nextThreshold) {
      this.player.levelUpShip();
      this.callbacks.onLevelUp(
        this.player.shipLevel,
        this.player.currentHealth,
        this.player.maxHP,
        this.player.gunLevel,
      );
    }
  }
}
