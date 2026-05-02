import Phaser from 'phaser';
import { GAME_WIDTH, ENEMY_POOL_SIZE } from '../config/game.config';
import { WAVES, ENEMY_CONFIGS, type WaveDefinition, type Formation } from '../config/waves.config';
import { BossManager } from './BossManager';
import type { Enemy } from '../entities/Enemy';
import { createEnemyPool, createEnemyBulletPool } from '../entities/Enemy';

export class WaveManager {
  private scene: Phaser.Scene;
  private enemyPool: Phaser.Physics.Arcade.Group;
  private enemyBulletPool: Phaser.Physics.Arcade.Group;
  private currentWaveIndex = 0;
  private spawning = false;
  private waveCleared = false;
  private waitingForBoss = false;
  private onWaveComplete?: (waveNum: number) => void;
  private bossManager?: BossManager;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.enemyPool = createEnemyPool(scene, ENEMY_POOL_SIZE);
    this.enemyBulletPool = createEnemyBulletPool(scene);
  }

  get enemies(): Phaser.Physics.Arcade.Group {
    return this.enemyPool;
  }

  get enemyBullets(): Phaser.Physics.Arcade.Group {
    return this.enemyBulletPool;
  }

  get currentWave(): number {
    return this.currentWaveIndex + 1;
  }

  setBossManager(bm: BossManager): void {
    this.bossManager = bm;
  }

  setOnWaveComplete(callback: (waveNum: number) => void): void {
    this.onWaveComplete = callback;
  }

  /** Called by BossManager/GameScene when boss is defeated */
  notifyBossDefeated(): void {
    if (!this.waitingForBoss) return;
    this.waitingForBoss = false;
    this.waveCleared = true;
    this.onWaveComplete?.(this.currentWaveIndex + 1);
    this.nextWave();
  }

  startWaves(): void {
    this.currentWaveIndex = 0;
    this.spawnWave(WAVES[0]);
  }

  update(): void {
    // Clean up off-screen bullets
    for (const bullet of this.enemyBulletPool.children) {
      const b = bullet as Phaser.Physics.Arcade.Sprite;
      if (b.active && b.y > 850) {
        b.setActive(false);
        b.setVisible(false);
      }
    }

    // Do not auto-clear while waiting for boss
    if (this.waitingForBoss) return;

    // Check if wave is cleared
    if (!this.spawning && !this.waveCleared) {
      const activeEnemies = this.enemyPool.countActive(true);
      if (activeEnemies === 0) {
        this.waveCleared = true;

        const nextWave = this.currentWaveIndex + 1; // 1-based wave that just ended
        if (BossManager.isBossWave(nextWave) && this.bossManager) {
          // Boss wave: fire callback, spawn boss, hold until boss dies
          this.onWaveComplete?.(nextWave);
          this.currentWaveIndex = nextWave - 1; // keep index pointing at this wave
          const delay = 1500;
          this.scene.time.delayedCall(delay, () => {
            this.waitingForBoss = true;
            this.bossManager!.trySpawnBoss(nextWave);
          });
        } else {
          this.onWaveComplete?.(nextWave);
          this.nextWave();
        }
      }
    }
  }

  private nextWave(): void {
    this.currentWaveIndex++;

    const wave = this.getWaveDefinition();
    const delay = WAVES[Math.min(this.currentWaveIndex - 1, WAVES.length - 1)]?.delayAfterWave ?? 2000;

    this.scene.time.delayedCall(delay, () => {
      this.spawnWave(wave);
    });
  }

  private getWaveDefinition(): WaveDefinition {
    if (this.currentWaveIndex < WAVES.length) {
      return WAVES[this.currentWaveIndex];
    }

    // Beyond defined waves: generate harder ones procedurally
    const base = WAVES[WAVES.length - 1];
    const scale = 1 + (this.currentWaveIndex - WAVES.length) * 0.15;
    return {
      enemies: base.enemies.map((e) => ({
        ...e,
        count: Math.ceil(e.count * scale),
      })),
      delayBetweenSpawns: Math.max(100, base.delayBetweenSpawns - (this.currentWaveIndex - WAVES.length) * 10),
      delayAfterWave: base.delayAfterWave,
    };
  }

  private spawnWave(wave: WaveDefinition): void {
    this.spawning = true;
    this.waveCleared = false;

    const allSpawns: { x: number; y: number; configKey: string }[] = [];

    for (const group of wave.enemies) {
      const positions = this.getFormationPositions(group.count, group.formation);
      const config = ENEMY_CONFIGS[group.type];
      for (const pos of positions) {
        allSpawns.push({ x: pos.x, y: pos.y, configKey: config.textureKey });
      }
    }

    let spawnIndex = 0;
    const spawnTimer = this.scene.time.addEvent({
      delay: wave.delayBetweenSpawns,
      repeat: allSpawns.length - 1,
      callback: () => {
        const spawn = allSpawns[spawnIndex];
        if (!spawn) return;

        const configEntry = wave.enemies.find((_e, i) => {
          const prevCount = wave.enemies.slice(0, i).reduce((sum, g) => sum + g.count, 0);
          return spawnIndex >= prevCount && spawnIndex < prevCount + wave.enemies[i].count;
        });
        if (!configEntry) return;

        const config = ENEMY_CONFIGS[configEntry.type];
        const enemy = this.enemyPool.get(spawn.x, spawn.y, config.textureKey) as Enemy | null;

        if (enemy) {
          enemy.init(config, this.enemyBulletPool);
        }

        spawnIndex++;
        if (spawnIndex >= allSpawns.length) {
          spawnTimer.destroy();
          this.spawning = false;
        }
      },
    });
  }

  private getFormationPositions(count: number, formation: Formation): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    const margin = 60;
    const usableWidth = GAME_WIDTH - margin * 2;

    switch (formation) {
      case 'line': {
        const spacing = usableWidth / (count + 1);
        for (let i = 0; i < count; i++) {
          positions.push({
            x: margin + spacing * (i + 1),
            y: -30 - i * 10,
          });
        }
        break;
      }
      case 'v-shape': {
        const mid = Math.floor(count / 2);
        const spacing = usableWidth / (count + 1);
        for (let i = 0; i < count; i++) {
          positions.push({
            x: margin + spacing * (i + 1),
            y: -30 - Math.abs(i - mid) * 40,
          });
        }
        break;
      }
      case 'grid': {
        const cols = Math.ceil(Math.sqrt(count));
        const spacingX = usableWidth / (cols + 1);
        const spacingY = 50;
        for (let i = 0; i < count; i++) {
          const col = i % cols;
          const row = Math.floor(i / cols);
          positions.push({
            x: margin + spacingX * (col + 1),
            y: -30 - row * spacingY,
          });
        }
        break;
      }
      case 'random': {
        for (let i = 0; i < count; i++) {
          positions.push({
            x: Phaser.Math.Between(margin, GAME_WIDTH - margin),
            y: Phaser.Math.Between(-100, -30),
          });
        }
        break;
      }
    }

    return positions;
  }
}
