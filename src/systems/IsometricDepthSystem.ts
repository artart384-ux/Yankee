import Phaser from 'phaser';

export interface DepthSortable {
  y: number;
  depthOffset?: number;
  setDepth(depth: number): this;
}

export class IsometricDepthSystem {
  private static instance: IsometricDepthSystem;
  private objects: Set<DepthSortable> = new Set();

  public static getInstance(): IsometricDepthSystem {
    if (!IsometricDepthSystem.instance) {
      IsometricDepthSystem.instance = new IsometricDepthSystem();
    }
    return IsometricDepthSystem.instance;
  }

  public register(obj: DepthSortable) {
    this.objects.add(obj);
    this.sortObject(obj);
  }

  public unregister(obj: DepthSortable) {
    this.objects.delete(obj);
  }

  public clear() {
    this.objects.clear();
  }

  public sortObject(obj: DepthSortable) {
    const offset = obj.depthOffset ?? 0;
    obj.setDepth(Math.round(obj.y + offset));
  }

  public update() {
    for (const obj of this.objects) {
      this.sortObject(obj);
    }
  }
}

