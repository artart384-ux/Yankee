const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

function createPNG(w, h) {
  const png = new PNG({ width: w, height: h });
  png.data.fill(0);
  return png;
}

function setPixel(png, x, y, r, g, b, a = 255) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || x >= png.width || y < 0 || y >= png.height) return;
  const idx = (y * png.width + x) * 4;
  if (a < 255 && png.data[idx + 3] > 0) {
    const srcA = a / 255;
    const dstA = png.data[idx + 3] / 255;
    const outA = srcA + dstA * (1 - srcA);
    png.data[idx] = Math.round((r * srcA + png.data[idx] * dstA * (1 - srcA)) / outA);
    png.data[idx + 1] = Math.round((g * srcA + png.data[idx + 1] * dstA * (1 - srcA)) / outA);
    png.data[idx + 2] = Math.round((b * srcA + png.data[idx + 2] * dstA * (1 - srcA)) / outA);
    png.data[idx + 3] = Math.round(outA * 255);
  } else {
    png.data[idx] = r;
    png.data[idx + 1] = g;
    png.data[idx + 2] = b;
    png.data[idx + 3] = a;
  }
}

function drawLine(png, x0, y0, x1, y1, r, g, b, a = 255, thickness = 1) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let cx = x0;
  let cy = y0;
  while (true) {
    for (let tx = -Math.floor(thickness / 2); tx <= Math.floor(thickness / 2); tx++) {
      for (let ty = -Math.floor(thickness / 2); ty <= Math.floor(thickness / 2); ty++) {
        setPixel(png, cx + tx, cy + ty, r, g, b, a);
      }
    }
    if (Math.abs(cx - x1) <= 1 && Math.abs(cy - y1) <= 1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      cx += sx;
    }
    if (e2 < dx) {
      err += dx;
      cy += sy;
    }
  }
}

function fillIsoDiamond(png, cx, cy, hw, hh, colorCallback) {
  for (let dy = -hh; dy <= hh; dy++) {
    const span = Math.round(hw * (1 - Math.abs(dy) / hh));
    for (let dx = -span; dx <= span; dx++) {
      const col = colorCallback(dx, dy);
      if (col) {
        setPixel(png, cx + dx, cy + dy, col[0], col[1], col[2], col[3] ?? 255);
      }
    }
  }
}

function savePNG(png, outPath) {
  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outPath, PNG.sync.write(png));
  console.log(`Saved: ${outPath} (${png.width}x${png.height})`);
}

// ============================================================================
// 1. ISOMETRIC FLOOR TILES (64 x 32)
// ============================================================================

// 1.1 Authentic Japanese Classroom Wood Parquet Floor (tile_school_wood_parquet.png)
function makeClassroomWoodTile() {
  const png = createPNG(64, 32);
  const cx = 32, cy = 16, hw = 31, hh = 15;

  fillIsoDiamond(png, cx, cy, hw, hh, (dx, dy) => {
    // Plank striping along isometric diagonal (dx - dy*2)
    const plankIdx = Math.floor((dx + dy * 2 + 100) / 10);
    const isSeam = Math.abs((dx + dy * 2 + 100) % 10) === 0;

    // Woodgrain variations
    const grain = Math.sin((dx * 0.7 + dy * 1.8) * 0.5) * 6;
    const baseR = 198 + (plankIdx % 3) * 12 + grain;
    const baseG = 145 + (plankIdx % 3) * 10 + grain * 0.8;
    const baseB = 88 + (plankIdx % 3) * 8 + grain * 0.5;

    if (isSeam) {
      return [110, 72, 38, 255]; // Darker wood joint groove
    }

    // Nail dots at plank ends
    if (Math.abs(dx - dy * 2) % 24 === 0 && Math.abs((dx + dy * 2) % 10) === 4) {
      return [90, 55, 30, 255];
    }

    // Subtle gloss highlight on top
    const spec = dy < 0 ? (15 - Math.abs(dy)) * 2 : 0;
    return [
      Math.min(255, baseR + spec),
      Math.min(255, baseG + spec),
      Math.min(255, baseB + spec),
      255
    ];
  });

  // Diamond 1px edge outline
  drawLine(png, 32, 0, 63, 15, 120, 80, 45, 230);
  drawLine(png, 63, 16, 32, 31, 100, 65, 35, 255);
  drawLine(png, 31, 31, 0, 16, 100, 65, 35, 255);
  drawLine(png, 0, 15, 31, 0, 140, 95, 55, 230);

  savePNG(png, 'public/assets/tiles/tile_school_wood_parquet.png');
}

// 1.2 School Corridor Wood Floor (tile_school_corridor_wood.png)
function makeCorridorWoodTile() {
  const png = createPNG(64, 32);
  const cx = 32, cy = 16, hw = 31, hh = 15;

  fillIsoDiamond(png, cx, cy, hw, hh, (dx, dy) => {
    const plankIdx = Math.floor((dx - dy * 2 + 100) / 12);
    const isSeam = Math.abs((dx - dy * 2 + 100) % 12) === 0;
    const wear = ((dx * 3 + dy * 7) % 13 === 0) ? -15 : 0; // Scuff marks

    const baseR = 175 + (plankIdx % 3) * 10 + wear;
    const baseG = 125 + (plankIdx % 3) * 8 + wear;
    const baseB = 75 + (plankIdx % 3) * 6 + wear;

    if (isSeam) return [95, 60, 32, 255];
    return [Math.max(0, baseR), Math.max(0, baseG), Math.max(0, baseB), 255];
  });

  drawLine(png, 32, 0, 63, 15, 110, 75, 40, 220);
  drawLine(png, 63, 16, 32, 31, 90, 55, 28, 255);
  drawLine(png, 31, 31, 0, 16, 90, 55, 28, 255);
  drawLine(png, 0, 15, 31, 0, 125, 85, 48, 220);

  savePNG(png, 'public/assets/tiles/tile_school_corridor_wood.png');
}

// 1.3 School Restroom Mint Green Ceramic Tiles (tile_school_restroom_tile.png)
function makeRestroomTile() {
  const png = createPNG(64, 32);
  const cx = 32, cy = 16, hw = 31, hh = 15;

  fillIsoDiamond(png, cx, cy, hw, hh, (dx, dy) => {
    // Checkerboard sub-grid (4x4 tiles within 64x32)
    const tx = Math.floor((dx + hw) / 8);
    const ty = Math.floor((dy + hh) / 4);
    const isGrout = (dx + hw) % 8 === 0 || (dy + hh) % 4 === 0;

    if (isGrout) return [215, 235, 230, 255]; // Crisp white-mint grout

    const isAlt = (tx + ty) % 2 === 0;
    const baseR = isAlt ? 130 : 100;
    const baseG = isAlt ? 190 : 165;
    const baseB = isAlt ? 180 : 155;

    // Water sheen reflection
    const sheen = (dx * 5 + dy * 11) % 17 === 0 ? 35 : 0;
    return [
      Math.min(255, baseR + sheen),
      Math.min(255, baseG + sheen),
      Math.min(255, baseB + sheen),
      255
    ];
  });

  drawLine(png, 32, 0, 63, 15, 150, 210, 200, 240);
  drawLine(png, 63, 16, 32, 31, 80, 130, 120, 255);
  drawLine(png, 31, 31, 0, 16, 80, 130, 120, 255);
  drawLine(png, 0, 15, 31, 0, 170, 225, 215, 240);

  savePNG(png, 'public/assets/tiles/tile_school_restroom_tile.png');
}

// 1.4 Cafeteria Retro Checkered Tiles (tile_school_cafeteria_tile.png)
function makeCafeteriaTile() {
  const png = createPNG(64, 32);
  const cx = 32, cy = 16, hw = 31, hh = 15;

  fillIsoDiamond(png, cx, cy, hw, hh, (dx, dy) => {
    const isAlt = (Math.floor((dx + hw) / 16) + Math.floor((dy + hh) / 8)) % 2 === 0;
    const isGrout = (dx + hw) % 16 === 0 || (dy + hh) % 8 === 0;
    if (isGrout) return [180, 175, 165, 255];

    if (isAlt) {
      // Warm ivory cream
      return [235, 226, 212, 255];
    } else {
      // Terracotta red-orange
      return [176, 82, 56, 255];
    }
  });

  drawLine(png, 32, 0, 63, 15, 220, 200, 180, 230);
  drawLine(png, 63, 16, 32, 31, 130, 60, 40, 255);
  drawLine(png, 31, 31, 0, 16, 130, 60, 40, 255);
  drawLine(png, 0, 15, 31, 0, 240, 220, 200, 230);

  savePNG(png, 'public/assets/tiles/tile_school_cafeteria_tile.png');
}

// 1.5 Gymnasium Hardwood Parquet (tile_school_gym_parquet.png)
function makeGymParquetTile() {
  const png = createPNG(64, 32);
  const cx = 32, cy = 16, hw = 31, hh = 15;

  fillIsoDiamond(png, cx, cy, hw, hh, (dx, dy) => {
    const plank = Math.floor((dx + dy * 2 + 100) / 8);
    const isSeam = (dx + dy * 2 + 100) % 8 === 0;

    // Court painted white line across center
    if (Math.abs(dx - dy * 2) < 2) {
      return [255, 255, 255, 255]; // White boundary line
    }

    if (isSeam) return [140, 95, 45, 255];

    const baseR = 220 + (plank % 2) * 14;
    const baseG = 170 + (plank % 2) * 10;
    const baseB = 95 + (plank % 2) * 8;
    return [baseR, baseG, baseB, 255];
  });

  drawLine(png, 32, 0, 63, 15, 245, 195, 120, 240);
  drawLine(png, 63, 16, 32, 31, 150, 105, 50, 255);
  drawLine(png, 31, 31, 0, 16, 150, 105, 50, 255);
  drawLine(png, 0, 15, 31, 0, 255, 210, 135, 240);

  savePNG(png, 'public/assets/tiles/tile_school_gym_parquet.png');
}

// 1.6 Gritty School Gate / Bike Shed Asphalt (tile_school_dirty_asphalt.png)
function makeDirtyAsphaltTile() {
  const png = createPNG(64, 32);
  const cx = 32, cy = 16, hw = 31, hh = 15;

  fillIsoDiamond(png, cx, cy, hw, hh, (dx, dy) => {
    const noise = ((dx * 7 + dy * 13) % 19);
    const base = 42 + noise * 1.5;

    // Oil drip
    if ((dx * dx + dy * dy * 4) < 60 && (dx % 3 === 0)) {
      return [18, 19, 24, 255];
    }

    return [base, base + 2, base + 5, 255];
  });

  drawLine(png, 32, 0, 63, 15, 75, 78, 85, 220);
  drawLine(png, 63, 16, 32, 31, 28, 30, 36, 255);
  drawLine(png, 31, 31, 0, 16, 28, 30, 36, 255);
  drawLine(png, 0, 15, 31, 0, 85, 88, 98, 220);

  savePNG(png, 'public/assets/tiles/tile_school_dirty_asphalt.png');
}

// ============================================================================
// 2. ISOMETRIC SCHOOL WALLS, DOORS, WINDOWS & BOUNDARIES
// ============================================================================

// 2.1 Japanese Classroom Wood Wainscoting Wall (prop_iso_school_wall_wood.png)
// Slopes down-left (2:1 isometric slope: 128 wide, 112 high)
function makeClassroomWall() {
  const w = 128, h = 112;
  const png = createPNG(w, h);

  // Isometric wall face:
  // Top edge: from (0, 0) to (128, 64)
  // Bottom edge: from (0, 48) to (128, 112)
  for (let x = 0; x < w; x++) {
    const topY = Math.round(x * 0.5);
    const botY = topY + 48;

    for (let y = topY; y <= botY; y++) {
      const relY = y - topY; // 0 (top) to 48 (bottom)

      if (relY <= 2) {
        // Top crown molding (dark wood)
        setPixel(png, x, y, 78, 48, 28, 255);
      } else if (relY < 24) {
        // Upper wall: Pale warm cream plaster (school wall)
        const plasterTone = 232 - Math.round(relY * 0.8);
        setPixel(png, x, y, plasterTone, plasterTone - 8, plasterTone - 22, 255);

        // Wall vertical seam every 32px
        if (x % 32 === 0) setPixel(png, x, y, 200, 185, 160, 255);
      } else if (relY <= 26) {
        // Middle chair rail molding (wood rail)
        setPixel(png, x, y, 105, 65, 35, 255);
      } else if (relY < 44) {
        // Lower wainscoting: Amber polished wood slats
        const slatIdx = Math.floor(x / 8);
        const isSlatSeam = x % 8 === 0;
        const woodR = isSlatSeam ? 95 : (150 + (slatIdx % 2) * 12);
        const woodG = isSlatSeam ? 58 : (98 + (slatIdx % 2) * 8);
        const woodB = isSlatSeam ? 32 : (52 + (slatIdx % 2) * 5);
        setPixel(png, x, y, woodR, woodG, woodB, 255);
      } else {
        // Baseboard (巾木 - dark sturdy wood)
        setPixel(png, x, y, 62, 38, 20, 255);
      }
    }
  }

  // Outline
  drawLine(png, 0, 0, 127, 63, 40, 25, 15, 255);
  drawLine(png, 0, 48, 127, 111, 35, 20, 10, 255);
  drawLine(png, 0, 0, 0, 48, 50, 32, 18, 255);
  drawLine(png, 127, 63, 127, 111, 40, 25, 15, 255);

  savePNG(png, 'public/assets/props/prop_iso_school_wall_wood.png');
}

// 2.2 Japanese School Large Multi-Pane Window (prop_iso_school_window.png)
function makeSchoolWindow() {
  const w = 128, h = 112;
  const png = createPNG(w, h);

  // Background wall structure
  for (let x = 0; x < w; x++) {
    const topY = Math.round(x * 0.5);
    const botY = topY + 48;
    for (let y = topY; y <= botY; y++) {
      const relY = y - topY;
      if (relY < 6 || relY > 42) {
        setPixel(png, x, y, 95, 62, 35, 255); // Outer wooden window casing
      } else {
        // Inside window frame (glass panes)
        const paneX = x % 32;
        const paneY = relY % 18;
        const isMullion = paneX <= 2 || paneY <= 2;

        if (isMullion) {
          setPixel(png, x, y, 75, 48, 26, 255); // Dark wood window mullion
        } else {
          // Glass showing outdoor sky & sunset glow beam
          const glassToneB = 180 + Math.round((x / w) * 50);
          const glassToneG = 150 + Math.round((relY / 36) * 60);
          const glassToneR = 120 + Math.round(((w - x) / w) * 80); // Sunset orange tint
          setPixel(png, x, y, glassToneR, glassToneG, glassToneB, 240);

          // Diagonal glass specular reflection streak
          if (Math.abs(paneX - paneY) <= 1) {
            setPixel(png, x, y, 255, 255, 255, 220);
          }
        }
      }
    }
  }

  // Window Sill protruding slightly
  for (let x = 0; x < w; x++) {
    const topY = Math.round(x * 0.5);
    setPixel(png, x, topY + 43, 130, 85, 48, 255);
    setPixel(png, x, topY + 44, 75, 48, 26, 255);
  }

  // Outlines
  drawLine(png, 0, 0, 127, 63, 40, 25, 15, 255);
  drawLine(png, 0, 48, 127, 111, 35, 20, 10, 255);
  drawLine(png, 0, 0, 0, 48, 50, 32, 18, 255);
  drawLine(png, 127, 63, 127, 111, 40, 25, 15, 255);

  savePNG(png, 'public/assets/props/prop_iso_school_window.png');
}

// 2.3 Japanese Classroom Sliding Door (prop_iso_school_door.png)
function makeSchoolDoor() {
  const w = 128, h = 112;
  const png = createPNG(w, h);

  for (let x = 0; x < w; x++) {
    const topY = Math.round(x * 0.5);
    const botY = topY + 48;

    for (let y = topY; y <= botY; y++) {
      const relY = y - topY;

      // Outer door lintel & frame
      if (x < 12 || x > 115 || relY < 5 || relY > 44) {
        setPixel(png, x, y, 90, 58, 32, 255);
      } else {
        // Sliding door panel
        const doorX = x - 12;
        const isDoorSplit = Math.abs(doorX - 52) <= 1; // Door split line

        if (isDoorSplit) {
          setPixel(png, x, y, 45, 28, 15, 255);
        } else if (relY < 24) {
          // Upper door glass panels with frosted grid
          const isGrid = (doorX % 16 <= 1) || (relY % 10 <= 1);
          if (isGrid) {
            setPixel(png, x, y, 110, 75, 42, 255);
          } else {
            setPixel(png, x, y, 175, 205, 215, 230); // Frosted translucent glass
          }
        } else {
          // Lower door solid wood recessed panels
          const isRecess = (doorX % 24 > 3 && doorX % 24 < 21) && (relY > 26 && relY < 41);
          if (isRecess) {
            setPixel(png, x, y, 142, 92, 50, 255);
          } else {
            setPixel(png, x, y, 115, 75, 40, 255);
          }
        }

        // Brass handle on right panel
        if (Math.abs(doorX - 48) <= 1 && Math.abs(relY - 26) <= 4) {
          setPixel(png, x, y, 235, 190, 60, 255); // Golden brass handle
        }
      }
    }
  }

  // Wooden Class Placard atop door frame ("3年D組")
  for (let px = 46; px <= 82; px++) {
    const py = Math.round(px * 0.5) - 4;
    for (let dy = 0; dy < 8; dy++) {
      if (dy === 0 || dy === 7 || px === 46 || px === 82) {
        setPixel(png, px, py + dy, 70, 45, 25, 255);
      } else {
        setPixel(png, px, py + dy, 240, 225, 195, 255); // Cream sign plate
      }
    }
  }
  // Black lettering dots for "3-D"
  setPixel(png, 56, 26, 20, 20, 20, 255);
  setPixel(png, 64, 30, 20, 20, 20, 255);
  setPixel(png, 72, 34, 20, 20, 20, 255);

  // Outlines
  drawLine(png, 0, 0, 127, 63, 40, 25, 15, 255);
  drawLine(png, 0, 48, 127, 111, 35, 20, 10, 255);
  drawLine(png, 0, 0, 0, 48, 50, 32, 18, 255);
  drawLine(png, 127, 63, 127, 111, 40, 25, 15, 255);

  savePNG(png, 'public/assets/props/prop_iso_school_door.png');
}

// 2.4 Japanese Classroom Green Chalkboard (prop_iso_school_chalkboard.png)
function makeChalkboard() {
  const w = 128, h = 96;
  const png = createPNG(w, h);

  for (let x = 0; x < w; x++) {
    const topY = Math.round(x * 0.5);
    const botY = topY + 40;

    for (let y = topY; y <= botY; y++) {
      const relY = y - topY;

      // Wooden frame border
      if (x < 6 || x > 121 || relY < 4 || relY > 36) {
        setPixel(png, x, y, 105, 68, 38, 255);
      } else {
        // Deep matte green slate chalkboard
        const boardNoise = ((x * 3 + y * 7) % 5);
        setPixel(png, x, y, 28 + boardNoise, 68 + boardNoise * 2, 48 + boardNoise, 255);

        // White/yellow chalk scrawls & graffiti ("APEX CROWS // 鈴蘭")
        if ((x > 25 && x < 45 && Math.abs(relY - 18) <= 1) ||
            (x > 32 && x < 35 && relY > 12 && relY < 26)) {
          setPixel(png, x, y, 240, 245, 250, 220); // Chalk stroke
        }
        if ((x > 60 && x < 90 && Math.abs(relY - 22) <= 1) ||
            (x > 75 && x < 78 && relY > 16 && relY < 28)) {
          setPixel(png, x, y, 255, 235, 140, 220); // Yellow chalk stroke
        }
      }
    }

    // Bottom aluminum chalk tray
    setPixel(png, x, topY + 37, 185, 190, 200, 255);
    setPixel(png, x, topY + 38, 140, 145, 155, 255);
    // Chalk sticks on tray
    if (x === 40 || x === 44 || x === 48) setPixel(png, x, topY + 36, 255, 255, 255, 255);
    if (x === 65 || x === 69) setPixel(png, x, topY + 36, 255, 160, 180, 255);
  }

  savePNG(png, 'public/assets/props/prop_iso_school_chalkboard.png');
}

// 2.5 Japanese School Entrance Shoe Lockers (prop_iso_shoe_lockers.png)
function makeShoeLockers() {
  const w = 128, h = 96;
  const png = createPNG(w, h);

  for (let x = 0; x < w; x++) {
    const topY = Math.round(x * 0.5);
    const botY = topY + 44;

    for (let y = topY; y <= botY; y++) {
      const relY = y - topY;

      // Outer shelf casing
      if (x < 5 || x > 122 || relY < 4 || relY > 40) {
        setPixel(png, x, y, 125, 85, 48, 255); // Medium wood
      } else {
        // Locker cubbies grid (4 cols x 3 rows)
        const isColDivider = (x % 28 <= 1);
        const isRowDivider = (relY % 12 <= 1);

        if (isColDivider || isRowDivider) {
          setPixel(png, x, y, 95, 62, 34, 255);
        } else {
          // Inside cubby (dark recess)
          setPixel(png, x, y, 55, 36, 20, 255);

          // Shoes/slippers inside cubby
          if (relY % 12 > 6) {
            const shoeColor = (x % 3 === 0) ? [240, 240, 240] : [70, 120, 190];
            setPixel(png, x, y, shoeColor[0], shoeColor[1], shoeColor[2], 240);
          }
        }
      }
    }
  }

  savePNG(png, 'public/assets/props/prop_iso_shoe_lockers.png');
}

// 2.6 School Cork Bulletin Board (prop_iso_bulletin_board.png)
function makeBulletinBoard() {
  const w = 96, h = 80;
  const png = createPNG(w, h);

  for (let x = 0; x < w; x++) {
    const topY = Math.round(x * 0.5);
    const botY = topY + 36;

    for (let y = topY; y <= botY; y++) {
      const relY = y - topY;
      if (x < 4 || x > 91 || relY < 3 || relY > 33) {
        setPixel(png, x, y, 110, 72, 38, 255); // Wooden frame
      } else {
        // Tan textured cork surface
        const corkNoise = ((x * 5 + y * 9) % 7);
        setPixel(png, x, y, 195 + corkNoise, 145 + corkNoise, 95 + corkNoise, 255);

        // Pinned flyer #1 (White flier)
        if (x > 18 && x < 40 && relY > 8 && relY < 24) {
          setPixel(png, x, y, 245, 240, 235, 255);
          if (x === 29 && relY === 9) setPixel(png, x, y, 220, 40, 40, 255); // Red push pin
        }
        // Pinned flyer #2 (Yellow delinquent notice)
        if (x > 50 && x < 78 && relY > 12 && relY < 28) {
          setPixel(png, x, y, 255, 225, 90, 255);
          if (x === 64 && relY === 13) setPixel(png, x, y, 40, 120, 220, 255); // Blue push pin
        }
      }
    }
  }

  savePNG(png, 'public/assets/props/prop_iso_bulletin_board.png');
}

// 2.7 Heavy Steel School Entrance Sliding Gate (prop_iso_school_gate.png)
function makeSchoolGate() {
  const w = 128, h = 96;
  const png = createPNG(w, h);

  for (let x = 0; x < w; x++) {
    const topY = Math.round(x * 0.5);
    const botY = topY + 44;

    for (let y = topY; y <= botY; y++) {
      const relY = y - topY;

      // Gate stone pillar on left and right
      if (x < 18 || x > 110) {
        const stoneNoise = ((x * 3 + y * 5) % 6);
        setPixel(png, x, y, 120 + stoneNoise, 122 + stoneNoise, 128 + stoneNoise, 255);
        if (x === 17 || x === 111) setPixel(png, x, y, 60, 62, 68, 255);
      } else {
        // Iron sliding gate bars
        const isHorizontalBar = relY === 6 || relY === 24 || relY === 40;
        const isVerticalBar = x % 7 === 0;

        if (isHorizontalBar || isVerticalBar) {
          // Rusty iron bar
          const rust = ((x + y) % 5 === 0) ? 25 : 0;
          setPixel(png, x, y, 55 + rust, 50, 48, 255);
          // Highlight on bar
          if (relY % 2 === 0) setPixel(png, x, y, 95 + rust, 90, 88, 255);
        }
      }
    }
  }

  savePNG(png, 'public/assets/props/prop_iso_school_gate.png');
}

// 2.8 Restroom Tiled Wall with Broken Mirror (prop_iso_restroom_wall.png)
function makeRestroomWall() {
  const w = 128, h = 112;
  const png = createPNG(w, h);

  for (let x = 0; x < w; x++) {
    const topY = Math.round(x * 0.5);
    const botY = topY + 48;

    for (let y = topY; y <= botY; y++) {
      const relY = y - topY;

      // Restroom white ceramic wall tiles
      const isGrout = (x % 16 === 0) || (relY % 8 === 0);
      if (isGrout) {
        setPixel(png, x, y, 140, 160, 165, 255);
      } else {
        setPixel(png, x, y, 220, 235, 235, 255);
      }

      // Broken mirror in center (x from 40 to 88, relY from 10 to 34)
      if (x > 40 && x < 88 && relY > 10 && relY < 34) {
        if (x === 41 || x === 87 || relY === 11 || relY === 33) {
          setPixel(png, x, y, 80, 90, 95, 255); // Mirror frame
        } else {
          // Reflective glass
          setPixel(png, x, y, 160, 195, 215, 255);
          // Crack lines
          if (Math.abs((x - 64) - (relY - 22) * 2) <= 1) {
            setPixel(png, x, y, 240, 250, 255, 255);
          }
        }
      }
    }
  }

  savePNG(png, 'public/assets/props/prop_iso_restroom_wall.png');
}

// Execute all generators
console.log('Generating authentic school environment pixel art assets...');
makeClassroomWoodTile();
makeCorridorWoodTile();
makeRestroomTile();
makeCafeteriaTile();
makeGymParquetTile();
makeDirtyAsphaltTile();

makeClassroomWall();
makeSchoolWindow();
makeSchoolDoor();
makeChalkboard();
makeShoeLockers();
makeBulletinBoard();
makeSchoolGate();
makeRestroomWall();
console.log('All school environment assets generated successfully!');

