export const EnemyType = {
  Black: 'black',
  Blue: 'blue',
  Green: 'green',
  Red: 'red',
} as const;

export type EnemyType = (typeof EnemyType)[keyof typeof EnemyType];

export interface EnemyConfig {
  type: EnemyType;
  health: number;
  speed: number;
  score: number;
  fireRate: number;
  textureKey: string;
}

// ─── Boss types ───────────────────────────────────────────────────────────────

export type BossPattern = 'spread' | 'aimed' | 'barrage' | 'circle' | 'charge';
export type BossMovement = 'lateral' | 'zigzag' | 'idle';

export interface BossPhase {
  /** HP % threshold to enter this phase (1.0 = full HP, 0.0 = dead) */
  hpThreshold: number;
  pattern: BossPattern;
  fireRate: number;   // ms between attacks
  bulletCount: number;
  spreadAngle: number; // degrees total spread
  movement: BossMovement;
  movementSpeed: number;
}

export interface BossConfig {
  name: string;
  textureKey: string;
  baseHp: number;
  scale: number;
  score: number;
  coinReward: number;
  phases: BossPhase[];
}

/** 3 archetypal bosses. Cycle repeats every 15 waves, scaled up each cycle. */
export const BOSS_ARCHETYPES: BossConfig[] = [
  {
    // Raider — wave 5, 20, 35 …
    name: 'RAIDER',
    textureKey: 'enemyRed5',
    baseHp: 80,
    scale: 2.0,
    score: 800,
    coinReward: 50,
    phases: [
      { hpThreshold: 1.0, pattern: 'spread', fireRate: 1300, bulletCount: 3, spreadAngle: 45, movement: 'lateral', movementSpeed: 110 },
      { hpThreshold: 0.5, pattern: 'aimed',  fireRate: 850,  bulletCount: 2, spreadAngle: 15, movement: 'lateral', movementSpeed: 160 },
    ],
  },
  {
    // Destroyer — wave 10, 25, 40 …
    name: 'DESTROYER',
    textureKey: 'enemyGreen5',
    baseHp: 130,
    scale: 2.5,
    score: 1200,
    coinReward: 80,
    phases: [
      { hpThreshold: 1.0, pattern: 'spread',  fireRate: 1100, bulletCount: 3, spreadAngle: 50, movement: 'zigzag',  movementSpeed: 110 },
      { hpThreshold: 0.6, pattern: 'aimed',   fireRate: 800,  bulletCount: 2, spreadAngle: 15, movement: 'zigzag',  movementSpeed: 160 },
      { hpThreshold: 0.3, pattern: 'barrage', fireRate: 600,  bulletCount: 4, spreadAngle: 60, movement: 'lateral', movementSpeed: 190 },
    ],
  },
  {
    // Overlord — wave 15, 30, 45 …
    name: 'OVERLORD',
    textureKey: 'enemyBlue5',
    baseHp: 200,
    scale: 3.0,
    score: 2000,
    coinReward: 120,
    phases: [
      { hpThreshold: 1.0, pattern: 'spread',  fireRate: 1000, bulletCount: 4, spreadAngle: 60,  movement: 'lateral', movementSpeed: 90  },
      { hpThreshold: 0.66, pattern: 'circle', fireRate: 750,  bulletCount: 7, spreadAngle: 360, movement: 'zigzag',  movementSpeed: 70  },
      { hpThreshold: 0.33, pattern: 'barrage', fireRate: 450, bulletCount: 5, spreadAngle: 75,  movement: 'zigzag',  movementSpeed: 170 },
    ],
  },
];

/** Returns scaled BossConfig for a given wave number (1-based). */
export function getBossConfig(wave: number): BossConfig | null {
  if (wave % 5 !== 0) return null;

  const cycleWave = ((wave - 1) % 15) + 1; // position within 15-wave cycle: 5, 10, 15
  const cycle = Math.floor((wave - 1) / 15); // 0, 1, 2, …
  const archetypeIndex = Math.floor((cycleWave - 1) / 5); // 0→Raider, 1→Destroyer, 2→Overlord
  const base = BOSS_ARCHETYPES[archetypeIndex];

  const hpScale = Math.pow(1.6, cycle);    // +60% HP per cycle (was 25%)
  const speedScale = Math.pow(1.1, cycle);
  const rateScale = Math.pow(0.94, cycle);
  const minRate = 380 + cycle * 50;

  return {
    ...base,
    name: cycle > 0 ? `${base.name} MK.${['II','III','IV','V','VI'][cycle - 1] ?? cycle + 1}` : base.name,
    baseHp: Math.round(base.baseHp * hpScale),
    score: Math.round(base.score * hpScale),
    coinReward: Math.round(base.coinReward * hpScale),
    phases: base.phases.map((p) => ({
      ...p,
      fireRate: Math.max(minRate, Math.round(p.fireRate * rateScale)),
      movementSpeed: Math.round(p.movementSpeed * speedScale),
      // +1 bullet only every 3 cycles, capped at base + 2
      bulletCount: Math.min(p.bulletCount + 2, p.bulletCount + Math.floor(cycle / 3)),
    })),
  };
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  [EnemyType.Black]: {
    type: EnemyType.Black,
    health: 4,
    speed: 95,
    score: 100,
    fireRate: 3500,
    textureKey: 'enemyBlack1',
  },
  [EnemyType.Blue]: {
    type: EnemyType.Blue,
    health: 6,
    speed: 105,
    score: 150,
    fireRate: 1700,
    textureKey: 'enemyBlue1',
  },
  [EnemyType.Green]: {
    type: EnemyType.Green,
    health: 10,
    speed: 75,
    score: 200,
    fireRate: 1300,
    textureKey: 'enemyGreen1',
  },
  [EnemyType.Red]: {
    type: EnemyType.Red,
    health: 14,
    speed: 55,
    score: 300,
    fireRate: 1100,
    textureKey: 'enemyRed1',
  },
};

export interface WaveDefinition {
  enemies: { type: EnemyType; count: number; formation: Formation }[];
  delayBetweenSpawns: number;
  delayAfterWave: number;
}

export type Formation = 'line' | 'v-shape' | 'grid' | 'random';

export const WAVES: WaveDefinition[] = [
  {
    enemies: [{ type: EnemyType.Black, count: 5, formation: 'line' }],
    delayBetweenSpawns: 600,
    delayAfterWave: 2000,
  },
  {
    enemies: [{ type: EnemyType.Black, count: 8, formation: 'v-shape' }],
    delayBetweenSpawns: 500,
    delayAfterWave: 2000,
  },
  {
    enemies: [
      { type: EnemyType.Black, count: 4, formation: 'line' },
      { type: EnemyType.Blue, count: 3, formation: 'line' },
    ],
    delayBetweenSpawns: 500,
    delayAfterWave: 2500,
  },
  {
    enemies: [{ type: EnemyType.Blue, count: 8, formation: 'grid' }],
    delayBetweenSpawns: 400,
    delayAfterWave: 2500,
  },
  {
    enemies: [
      { type: EnemyType.Blue, count: 4, formation: 'v-shape' },
      { type: EnemyType.Green, count: 3, formation: 'line' },
    ],
    delayBetweenSpawns: 400,
    delayAfterWave: 3000,
  },
  {
    enemies: [
      { type: EnemyType.Green, count: 6, formation: 'grid' },
      { type: EnemyType.Blue, count: 4, formation: 'random' },
    ],
    delayBetweenSpawns: 350,
    delayAfterWave: 3000,
  },
  {
    enemies: [{ type: EnemyType.Red, count: 1, formation: 'line' }],
    delayBetweenSpawns: 0,
    delayAfterWave: 3000,
  },
  {
    enemies: [
      { type: EnemyType.Red, count: 2, formation: 'line' },
      { type: EnemyType.Green, count: 6, formation: 'v-shape' },
    ],
    delayBetweenSpawns: 300,
    delayAfterWave: 3000,
  },
  {
    enemies: [
      { type: EnemyType.Red, count: 3, formation: 'grid' },
      { type: EnemyType.Blue, count: 5, formation: 'random' },
      { type: EnemyType.Green, count: 4, formation: 'v-shape' },
    ],
    delayBetweenSpawns: 250,
    delayAfterWave: 3500,
  },
  {
    enemies: [
      { type: EnemyType.Red, count: 5, formation: 'v-shape' },
      { type: EnemyType.Green, count: 6, formation: 'grid' },
    ],
    delayBetweenSpawns: 200,
    delayAfterWave: 4000,
  },
];
