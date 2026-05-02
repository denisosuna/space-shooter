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

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  [EnemyType.Black]: {
    type: EnemyType.Black,
    health: 1,
    speed: 80,
    score: 100,
    fireRate: 0,
    textureKey: 'enemyBlack1',
  },
  [EnemyType.Blue]: {
    type: EnemyType.Blue,
    health: 2,
    speed: 100,
    score: 150,
    fireRate: 2000,
    textureKey: 'enemyBlue1',
  },
  [EnemyType.Green]: {
    type: EnemyType.Green,
    health: 3,
    speed: 60,
    score: 200,
    fireRate: 1500,
    textureKey: 'enemyGreen1',
  },
  [EnemyType.Red]: {
    type: EnemyType.Red,
    health: 5,
    speed: 50,
    score: 300,
    fireRate: 1200,
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
