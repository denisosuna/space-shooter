export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 800;

export const PLAYER = {
  speed: 400,
  fireRate: 200,
  maxHealth: 100,
  bulletSpeed: -600,
  invincibleDuration: 1300,  // shorter grace window
} as const;

export const BULLET_POOL_SIZE = 80;
export const ENEMY_POOL_SIZE = 30;
export const ENEMY_BULLET_POOL_SIZE = 20;

export const POWERUP = {
  dropChance: 0.07,  // less frequent drops
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

export const DAMAGE = {
  enemyBullet: 15,
  bossBullet: 20,
  enemyCollision: 30,
  bombToEnemies: 12,
  bombToBoss: 18,
  collisionInstakill: 999,
  healAmount: 25,
} as const;

export const PROGRESSION = {
  shipThresholds: [750, 1100, 1800, 3000, 5000],
  maxShipLevel: 6,
  healthPerLevel: 10,
} as const;

export const FONT_FAMILY = '"Press Start 2P", monospace';

export function isReducedEffects(): boolean {
  return localStorage.getItem('spaceShooter_reducedEffects') === 'true';
}

export function setReducedEffects(val: boolean): void {
  localStorage.setItem('spaceShooter_reducedEffects', val ? 'true' : 'false');
}
