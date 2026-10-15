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
    // alpha blend
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

// 1. Comic Action Badges: KRSH!! (72x48)
function generateKrshBadge() {
  const w = 76, h = 50;
  const png = createPNG(w, h);
  const cx = w / 2, cy = h / 2;

  // Starburst points
  const points = [];
  const numSpikes = 14;
  for (let i = 0; i < numSpikes * 2; i++) {
    const angle = (i * Math.PI) / numSpikes;
    const rad = i % 2 === 0 ? 32 + (i % 3) * 4 : 16 + (i % 2) * 3;
    points.push({ x: cx + Math.cos(angle) * rad, y: cy + Math.sin(angle) * (rad * 0.72) });
  }

  // Fill starburst polygon
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = Math.hypot(x - cx, (y - cy) * 1.35);
      if (d < 30) {
        // Yellow/orange gradient
        const t = d / 30;
        const r = 255;
        const g = Math.round(230 - t * 90);
        const b = Math.round(30 - t * 30);
        setPixel(png, x, y, r, g, b, 255);
      }
    }
  }

  // Draw black jagged outline
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    drawLine(png, p1.x, p1.y, p2.x, p2.y, 0, 0, 0, 255, 2);
  }

  // Text: "KRSH!!" in pixel font
  // Render bold comic letters
  const letters = [
    // K
    [[14, 16], [14, 32], [22, 16], [14, 24], [22, 32]],
    // R
    [[26, 16], [26, 32], [33, 16], [35, 22], [26, 24], [34, 32]],
    // S
    [[44, 16], [38, 18], [40, 23], [44, 27], [38, 32]],
    // H
    [[48, 16], [48, 32], [48, 24], [55, 24], [55, 16], [55, 32]],
    // !
    [[59, 16], [59, 26], [59, 31], [59, 32]],
    // !
    [[63, 16], [63, 26], [63, 31], [63, 32]]
  ];

  letters.forEach(strokes => {
    for (let i = 0; i < strokes.length - 1; i += 2) {
      if (strokes[i + 1]) {
        drawLine(png, strokes[i][0], strokes[i][1], strokes[i + 1][0], strokes[i + 1][1], 0, 0, 0, 255, 3);
        drawLine(png, strokes[i][0], strokes[i][1], strokes[i + 1][0], strokes[i + 1][1], 255, 255, 255, 255, 1.5);
      }
    }
  });

  return png;
}

// 2. Comic Exclaim: !!? (56x50)
function generateExclaimBadge() {
  const w = 56, h = 50;
  const png = createPNG(w, h);
  const cx = w / 2, cy = h / 2;

  // Starburst
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = Math.hypot(x - cx, (y - cy) * 1.15);
      if (d < 22) {
        setPixel(png, x, y, 255, 220, 20, 255);
      }
    }
  }

  // Red outline starburst
  const numSpikes = 10;
  for (let i = 0; i < numSpikes * 2; i++) {
    const angle = (i * Math.PI) / numSpikes;
    const rad = i % 2 === 0 ? 24 : 14;
    const px = cx + Math.cos(angle) * rad;
    const py = cy + Math.sin(angle) * rad;
    const nextAngle = ((i + 1) * Math.PI) / numSpikes;
    const nextRad = (i + 1) % 2 === 0 ? 24 : 14;
    drawLine(png, px, py, cx + Math.cos(nextAngle) * nextRad, cy + Math.sin(nextAngle) * nextRad, 220, 20, 20, 255, 2);
  }

  // Draw !!?
  drawLine(png, 18, 14, 18, 26, 220, 0, 0, 255, 3);
  setPixel(png, 18, 31, 220, 0, 0, 255);
  setPixel(png, 18, 32, 220, 0, 0, 255);

  drawLine(png, 26, 14, 26, 26, 220, 0, 0, 255, 3);
  setPixel(png, 26, 31, 220, 0, 0, 255);
  setPixel(png, 26, 32, 220, 0, 0, 255);

  // Question mark
  drawLine(png, 33, 15, 41, 15, 220, 0, 0, 255, 2.5);
  drawLine(png, 41, 15, 41, 22, 220, 0, 0, 255, 2.5);
  drawLine(png, 41, 22, 36, 25, 220, 0, 0, 255, 2.5);
  setPixel(png, 36, 31, 220, 0, 0, 255);
  setPixel(png, 36, 32, 220, 0, 0, 255);

  return png;
}

// 3. Comic CRIT! Badge (64x36)
function generateCritBadge() {
  const w = 64, h = 36;
  const png = createPNG(w, h);
  const cx = w / 2, cy = h / 2;

  // Sharp lime starburst
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = Math.hypot((x - cx) * 0.75, (y - cy) * 1.3);
      if (d < 18) {
        setPixel(png, x, y, 0, 255, 102, 255);
      }
    }
  }

  // Black border
  for (let i = 0; i < 16; i++) {
    const a1 = (i * Math.PI) / 8;
    const a2 = ((i + 1) * Math.PI) / 8;
    const r1 = i % 2 === 0 ? 28 : 15;
    const r2 = (i + 1) % 2 === 0 ? 28 : 15;
    drawLine(png, cx + Math.cos(a1) * (r1 * 1.1), cy + Math.sin(a1) * (r1 * 0.65), cx + Math.cos(a2) * (r2 * 1.1), cy + Math.sin(a2) * (r2 * 0.65), 0, 0, 0, 255, 2);
  }

  // C R I T !
  // C
  drawLine(png, 15, 13, 20, 13, 0, 0, 0, 2.5);
  drawLine(png, 15, 13, 15, 23, 0, 0, 0, 2.5);
  drawLine(png, 15, 23, 20, 23, 0, 0, 0, 2.5);
  drawLine(png, 15, 13, 20, 13, 255, 255, 255, 1.5);
  drawLine(png, 15, 13, 15, 23, 255, 255, 255, 1.5);
  drawLine(png, 15, 23, 20, 23, 255, 255, 255, 1.5);

  // R
  drawLine(png, 24, 13, 24, 23, 0, 0, 0, 2.5);
  drawLine(png, 24, 13, 28, 13, 0, 0, 0, 2.5);
  drawLine(png, 28, 13, 28, 18, 0, 0, 0, 2.5);
  drawLine(png, 24, 18, 28, 18, 0, 0, 0, 2.5);
  drawLine(png, 26, 18, 29, 23, 0, 0, 0, 2.5);
  drawLine(png, 24, 13, 24, 23, 255, 255, 255, 1.5);
  drawLine(png, 24, 13, 28, 13, 255, 255, 255, 1.5);
  drawLine(png, 28, 13, 28, 18, 255, 255, 255, 1.5);
  drawLine(png, 24, 18, 28, 18, 255, 255, 255, 1.5);
  drawLine(png, 26, 18, 29, 23, 255, 255, 255, 1.5);

  // I
  drawLine(png, 33, 13, 33, 23, 0, 0, 0, 2.5);
  drawLine(png, 33, 13, 33, 23, 255, 255, 255, 1.5);

  // T
  drawLine(png, 37, 13, 44, 13, 0, 0, 0, 2.5);
  drawLine(png, 40, 13, 40, 23, 0, 0, 0, 2.5);
  drawLine(png, 37, 13, 44, 13, 255, 255, 255, 1.5);
  drawLine(png, 40, 13, 40, 23, 255, 255, 255, 1.5);

  // !
  drawLine(png, 48, 13, 48, 20, 0, 0, 0, 2.5);
  drawLine(png, 48, 13, 48, 20, 255, 255, 255, 1.5);
  setPixel(png, 48, 23, 255, 255, 255, 255);

  return png;
}

// 4. Vibrant Neon Aura Bursts (Magenta, Cyan, Lime) 96x96
function generateAuraBurst(type) {
  const w = 96, h = 96;
  const png = createPNG(w, h);
  const cx = w / 2, cy = h / 2;

  let r0, g0, b0, r1, g1, b1;
  if (type === 'MAGENTA') {
    r0 = 255; g0 = 0; b0 = 128; // Hot magenta
    r1 = 255; g1 = 180; b1 = 240; // Pastel pink core
  } else if (type === 'CYAN') {
    r0 = 0; g0 = 220; b0 = 255; // Electric cyan
    r1 = 200; g1 = 255; b1 = 255; // Core
  } else {
    r0 = 0; g0 = 255; b0 = 80; // Lime
    r1 = 210; g1 = 255; b1 = 180; // Core
  }

  // Draw 16 dynamic spikes
  const numSpikes = 16;
  for (let s = 0; s < numSpikes; s++) {
    const angle = (s * Math.PI * 2) / numSpikes + (s % 3) * 0.15;
    const len = 25 + (s % 4) * 8;
    const ex = cx + Math.cos(angle) * len;
    const ey = cy + Math.sin(angle) * len;

    // Draw thick tapering spike
    for (let t = 0; t <= 1; t += 0.05) {
      const px = cx + (ex - cx) * t;
      const py = cy + (ey - cy) * t;
      const thick = Math.round((1 - t) * 4);
      for (let tx = -thick; tx <= thick; tx++) {
        for (let ty = -thick; ty <= thick; ty++) {
          const alpha = Math.round((1 - t * 0.7) * 255);
          const cr = Math.round(r0 * (1 - t * 0.5) + r1 * (t * 0.5));
          const cg = Math.round(g0 * (1 - t * 0.5) + g1 * (t * 0.5));
          const cb = Math.round(b0 * (1 - t * 0.5) + b1 * (t * 0.5));
          setPixel(png, px + tx, py + ty, cr, cg, cb, alpha);
        }
      }
    }
  }

  // Bright glowing core
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d < 16) {
        const t = d / 16;
        const cr = Math.round(r1 * (1 - t) + r0 * t);
        const cg = Math.round(g1 * (1 - t) + g0 * t);
        const cb = Math.round(b1 * (1 - t) + b0 * t);
        const a = Math.round((1 - t * 0.5) * 255);
        setPixel(png, x, y, cr, cg, cb, a);
      }
    }
  }

  return png;
}

// 5. Delinquent Cracked Smartphone with stickers (110x180)
function generateCrackedPhone() {
  const w = 110, h = 180;
  const png = createPNG(w, h);

  // Phone body with rounded bezel
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const rx = Math.min(x, w - 1 - x);
      const ry = Math.min(y, h - 1 - y);
      if (rx < 8 && ry < 8 && Math.hypot(8 - rx, 8 - ry) > 8) continue;

      // Outer bezel: dark metal
      if (x < 4 || x >= w - 4 || y < 4 || y >= h - 4) {
        setPixel(png, x, y, 35, 40, 52, 255);
      } else if (x < 6 || x >= w - 6 || y < 8 || y >= h - 8) {
        setPixel(png, x, y, 20, 24, 32, 255);
      } else {
        // Screen background: deep obsidian reflective black
        setPixel(png, x, y, 12, 14, 20, 255);
      }
    }
  }

  // Camera notch top center
  for (let x = w / 2 - 12; x <= w / 2 + 12; x++) {
    for (let y = 5; y <= 9; y++) {
      setPixel(png, x, y, 8, 10, 14, 255);
    }
  }
  setPixel(png, w / 2, 7, 30, 45, 75, 255); // lens reflect

  // REALISTIC CRACKED GLASS LINES (Spiderweb cracks)
  const crackOriginX = 52, crackOriginY = 90;
  const crackRays = [
    [10, 20], [80, 15], [98, 70], [95, 140], [25, 165], [10, 110], [50, 15], [90, 115]
  ];

  crackRays.forEach(([tx, ty]) => {
    // Jagged line
    let curX = crackOriginX, curY = crackOriginY;
    const steps = 14;
    for (let s = 1; s <= steps; s++) {
      const nextX = crackOriginX + ((tx - crackOriginX) * s) / steps + (Math.sin(s * 2.3) * 4);
      const nextY = crackOriginY + ((ty - crackOriginY) * s) / steps + (Math.cos(s * 1.9) * 4);
      drawLine(png, curX, curY, nextX, nextY, 200, 225, 245, 180, 1);
      curX = nextX;
      curY = nextY;
    }
  });

  // Concentric shatter rings
  for (let r = 8; r <= 36; r += 10) {
    for (let a = 0; a < Math.PI * 2; a += 0.08) {
      if (Math.sin(a * 4) > -0.4) {
        const px = crackOriginX + Math.cos(a) * (r + Math.sin(a * 3) * 2);
        const py = crackOriginY + Math.sin(a) * (r + Math.cos(a * 3) * 2);
        setPixel(png, px, py, 220, 240, 255, 140);
      }
    }
  }

  // Cute & Punk Stickers on Corners!
  // Top-Right sticker: Hot pink heart/graffiti sticker
  for (let x = w - 30; x <= w - 8; x++) {
    for (let y = 10; y <= 28; y++) {
      if (Math.hypot(x - (w - 19), y - 19) < 9) {
        setPixel(png, x, y, 255, 50, 120, 255);
      }
    }
  }
  // Bottom-Left sticker: Yellow star / hazard sticker
  for (let x = 8; x <= 26; x++) {
    for (let y = h - 28; y <= h - 10; y++) {
      if (Math.hypot(x - 17, y - (h - 19)) < 8) {
        setPixel(png, x, y, 255, 210, 0, 255);
      }
    }
  }
  // Bottom-Right sticker: Red delinquent badge
  for (let x = w - 24; x <= w - 8; x++) {
    for (let y = h - 24; y <= h - 8; y++) {
      if (Math.hypot(x - (w - 16), y - (h - 16)) < 7) {
        setPixel(png, x, y, 230, 40, 40, 255);
      }
    }
  }

  return png;
}

// 6. Distant Hazy City Skyline (1200x240)
function generateDistantCitySkyline() {
  const w = 1200, h = 240;
  const png = createPNG(w, h);

  // Overcast dusk gradient sky: dusty slate violet to muted orange haze
  for (let y = 0; y < h; y++) {
    const t = y / h;
    const r = Math.round(95 * (1 - t) + 160 * t);
    const g = Math.round(95 * (1 - t) + 130 * t);
    const b = Math.round(120 * (1 - t) + 115 * t);
    for (let x = 0; x < w; x++) {
      setPixel(png, x, y, r, g, b, 255);
    }
  }

  // Silhouette of distant buildings (2 layers)
  // Back layer (faint atmospheric haze)
  let curX = 0;
  while (curX < w) {
    const bw = 30 + Math.floor(Math.sin(curX * 0.05) * 15 + 20);
    const bh = 80 + Math.floor(Math.cos(curX * 0.08) * 35 + 40);
    const topY = h - bh - 30;
    for (let x = curX; x < Math.min(w, curX + bw); x++) {
      for (let y = topY; y < h; y++) {
        setPixel(png, x, y, 120, 110, 125, 220);
      }
    }
    curX += bw + 4;
  }

  // Front building layer (darker silhouette with window dots)
  curX = 0;
  while (curX < w) {
    const bw = 24 + Math.floor(Math.cos(curX * 0.04) * 12 + 18);
    const bh = 50 + Math.floor(Math.sin(curX * 0.07) * 25 + 30);
    const topY = h - bh;
    for (let x = curX; x < Math.min(w, curX + bw); x++) {
      for (let y = topY; y < h; y++) {
        // windows
        if ((x - curX) % 6 === 2 && (y - topY) % 10 === 4 && (x + y) % 5 === 0) {
          setPixel(png, x, y, 255, 220, 140, 230); // warm lit window
        } else {
          setPixel(png, x, y, 70, 72, 85, 255);
        }
      }
    }
    curX += bw + 6;
  }

  return png;
}

// SAVE ALL
const vfxDir = path.join(__dirname, '..', 'public', 'assets', 'vfx');
const uiDir = path.join(__dirname, '..', 'public', 'assets', 'ui');
const bgDir = path.join(__dirname, '..', 'public', 'assets', 'maps');

[vfxDir, uiDir, bgDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

fs.writeFileSync(path.join(vfxDir, 'vfx_comic_krsh.png'), PNG.sync.write(generateKrshBadge()));
fs.writeFileSync(path.join(vfxDir, 'vfx_comic_exclaim.png'), PNG.sync.write(generateExclaimBadge()));
fs.writeFileSync(path.join(vfxDir, 'vfx_comic_crit.png'), PNG.sync.write(generateCritBadge()));
fs.writeFileSync(path.join(vfxDir, 'vfx_aura_burst_magenta.png'), PNG.sync.write(generateAuraBurst('MAGENTA')));
fs.writeFileSync(path.join(vfxDir, 'vfx_aura_burst_cyan.png'), PNG.sync.write(generateAuraBurst('CYAN')));
fs.writeFileSync(path.join(vfxDir, 'vfx_aura_burst_lime.png'), PNG.sync.write(generateAuraBurst('LIME')));
fs.writeFileSync(path.join(uiDir, 'ui_cracked_phone.png'), PNG.sync.write(generateCrackedPhone()));
fs.writeFileSync(path.join(bgDir, 'bg_distant_city_skyline.png'), PNG.sync.write(generateDistantCitySkyline()));

console.log('✅ Generated all Comic Pop Badges, Aura Bursts, Cracked Phone UI, and Distant City Skyline!');

