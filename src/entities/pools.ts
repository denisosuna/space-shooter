import Phaser from 'phaser';
import { ENEMY_BULLET_POOL_SIZE } from '../config/game.config';
import { Enemy } from './Enemy';
import { PowerUp } from './PowerUp';

export function createEnemyPool(scene: Phaser.Scene, size: number): Phaser.Physics.Arcade.Group {
  return scene.physics.add.group({
    classType: Enemy,
    maxSize: size,
    runChildUpdate: true,
    allowGravity: false,
  });
}

export function createEnemyBulletPool(scene: Phaser.Scene): Phaser.Physics.Arcade.Group {
  return scene.physics.add.group({
    maxSize: ENEMY_BULLET_POOL_SIZE,
    allowGravity: false,
  });
}

export function createPowerUpPool(scene: Phaser.Scene, size: number): Phaser.Physics.Arcade.Group {
  return scene.physics.add.group({
    classType: PowerUp,
    maxSize: size,
    runChildUpdate: true,
    allowGravity: false,
  });
}
