export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 800;

export const PLAYER = {
  speed: 400,
  fireRate: 200,
  maxHealth: 100,
  bulletSpeed: -600,
  invincibleDuration: 1100,  // shorter grace window
} as const;

export const BULLET_POOL_SIZE = 80;
export const ENEMY_POOL_SIZE = 30;
export const ENEMY_BULLET_POOL_SIZE = 20;

export const POWERUP = {
  dropChance: 0.06,  // less frequent drops
  shieldDuration: 5000,
  speedBoostDuration: 4000,
} as const;

export const SCORE = {
  enemyKill: 100,
  bossKill: 500,
  waveBonus: 250,
  coinValue: 10,
} as const;

export const DEPTH = {
  background: 0,
  stars: 1,
  enemies: 10,
  bullets: 15,
  player: 20,
  explosions: 25,
  powerups: 30,
  hud: 100,
} as const;
