import Phaser from 'phaser';
import { SchoolZoneData } from '../data/SchoolZonesConfig';
import { WorldScene } from '../scenes/WorldScene';

export interface ZoneBounds {
  mapWidth: number;
  mapHeight: number;
  walkableBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export class ZoneBoundaryManager {
  private scene: WorldScene;
  private boundaryColliders: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: WorldScene) {
    this.scene = scene;
  }

  public applyZoneBoundaries(zoneData: SchoolZoneData) {
    // 1. Clear previous boundary objects
    this.clearBoundaries();

    // 2. Resolve Zone Dimensions & Walkable Room Area
    const mapW = zoneData.mapWidth ?? 1600;
    const mapH = zoneData.mapHeight ?? 1200;
    const bounds = zoneData.walkableBounds ?? {
      x: 120,
      y: 220,
      width: mapW - 240,
      height: mapH - 340
    };

    // 3. Set World Physics Bounds (Walkable Floor)
    this.scene.physics.world.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);

    // 4. Set Camera Bounds (Enclosing entire room including walls)
    this.scene.cameras.main.setBounds(0, 0, mapW, mapH);

    // 5. Ensure Player collides with World Bounds
    if (this.scene.player) {
      this.scene.player.setCollideWorldBounds(true);
    }

    // 6. Build Static Perimeter Boundary Walls
    const wallThickness = 48;
    const perimeterWalls = [
      // Top wall (below back cutaway walls)
      { x: mapW / 2, y: bounds.y - wallThickness / 2, w: mapW, h: wallThickness },
      // Bottom boundary (foreground room edge)
      { x: mapW / 2, y: bounds.y + bounds.height + wallThickness / 2, w: mapW, h: wallThickness },
      // Left boundary wall
      { x: bounds.x - wallThickness / 2, y: mapH / 2, w: wallThickness, h: mapH },
      // Right boundary wall
      { x: bounds.x + bounds.width + wallThickness / 2, y: mapH / 2, w: wallThickness, h: mapH }
    ];

    perimeterWalls.forEach(pw => {
      const zone = this.scene.add.zone(pw.x, pw.y, pw.w, pw.h);
      this.scene.physics.add.existing(zone, true);
      this.scene.zoneManager.roomObstacles.add(zone);
      this.boundaryColliders.push(zone);
    });

    // 7. Clamp existing enemies inside the walkable bounds
    this.scene.enemies.forEach(enemy => {
      enemy.setCollideWorldBounds(true);
      enemy.x = Phaser.Math.Clamp(enemy.x, bounds.x + 30, bounds.x + bounds.width - 30);
      enemy.y = Phaser.Math.Clamp(enemy.y, bounds.y + 30, bounds.y + bounds.height - 30);
    });
  }

  public clearBoundaries() {
    this.boundaryColliders.forEach(b => {
      try {
        b.destroy();
      } catch {
        // Ignore
      }
    });
    this.boundaryColliders = [];
  }
}

