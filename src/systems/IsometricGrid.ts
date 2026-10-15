export class IsometricGrid {
  public static readonly TILE_WIDTH = 64;
  public static readonly TILE_HEIGHT = 32;
  public static readonly HALF_WIDTH = 32;
  public static readonly HALF_HEIGHT = 16;

  /**
   * Convert grid coordinates (col, row) to isometric world screen coordinates (x, y)
   */
  public static gridToScreen(col: number, row: number, originX: number = 0, originY: number = 0): { x: number; y: number } {
    const x = (col - row) * this.HALF_WIDTH + originX;
    const y = (col + row) * this.HALF_HEIGHT + originY;
    return { x, y };
  }

  /**
   * Convert isometric world screen coordinates (x, y) to grid coordinates (col, row)
   */
  public static screenToGrid(x: number, y: number, originX: number = 0, originY: number = 0): { col: number; row: number } {
    const dx = x - originX;
    const dy = y - originY;
    const col = (dx / this.HALF_WIDTH + dy / this.HALF_HEIGHT) / 2;
    const row = (dy / this.HALF_HEIGHT - dx / this.HALF_WIDTH) / 2;
    return { col, row };
  }

  /**
   * Calculate depth for isometric sorting based on position
   */
  public static getDepth(y: number, baseOffset: number = 0): number {
    return Math.floor(y) + baseOffset;
  }
}

