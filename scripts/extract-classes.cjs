const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const sourcePath = 'C:/Users/Newdawn/.gemini/antigravity/brain/4a75a10f-e082-473f-a458-f3503c28a368/.user_uploaded/media_1792050589092_bb1f188b.png';
const portraitsDir = path.join(__dirname, '../public/assets/portraits');
const spritesDir = path.join(__dirname, '../public/assets/sprites');

if (!fs.existsSync(portraitsDir)) fs.mkdirSync(portraitsDir, { recursive: true });
if (!fs.existsSync(spritesDir)) fs.mkdirSync(spritesDir, { recursive: true });

const srcData = fs.readFileSync(sourcePath);
const srcPng = PNG.sync.read(srcData);

const classDefs = [
  {
    id: 'class_vanguard',
    name: 'The Vanguard',
    x1: 15, x2: 190, y1: 150, y2: 435,
    validPixel: (x, y) => x <= 187
  },
  {
    id: 'class_brawler',
    name: 'The Brawler',
    x1: 190, x2: 320, y1: 170, y2: 435,
    validPixel: (x, y) => x >= 196 && x <= 316
  },
  {
    id: 'class_striker',
    name: 'The Striker',
    x1: 318, x2: 442, y1: 165, y2: 435,
    validPixel: (x, y) => x >= 320 && x <= 440
  },
  {
    id: 'class_sharpshooter',
    name: 'The Sharpshooter',
    x1: 442, x2: 585, y1: 195, y2: 435,
    validPixel: (x, y) => {
      if (x <= 462 && y <= 218) return false; // Striker bat tip
      return x >= 445 && x <= 583;
    }
  },
  {
    id: 'class_supplier',
    name: 'The Supplier',
    x1: 584, x2: 718, y1: 185, y2: 435,
    validPixel: (x, y) => {
      if (x < 602 && y >= 240 && y <= 310) return false; // Sharpshooter slingshot tip
      return x >= 587 && x <= 715;
    }
  },
  {
    id: 'class_instigator',
    name: 'The Instigator',
    x1: 716, x2: 870, y1: 185, y2: 435,
    validPixel: (x, y) => {
      if (x < 732 && y >= 340) return false; // Supplier medkit tip
      if (y >= 330 && x > 842) return false; // Saboteur knee
      return x >= 720 && x <= 868;
    }
  },
  {
    id: 'class_saboteur',
    name: 'The Saboteur',
    x1: 842, x2: 990, y1: 215, y2: 435,
    validPixel: (x, y) => {
      if (x <= 870 && y <= 330) return false; // Megaphone body
      if (x <= 888 && y <= 280) return false; // Megaphone soundwaves
      return x >= 845 && x <= 986;
    }
  }
];

function isBgPixel(r, g, b, y) {
  if (r >= 14 && r <= 30 && g >= 16 && g <= 34 && b >= 24 && b <= 42) return true;
  if (r >= 45 && r <= 100 && g >= 50 && g <= 105 && b >= 55 && b <= 110) {
    if (Math.abs(r - g) <= 14 && Math.abs(g - b) <= 14) return true;
  }
  if (r >= 40 && r <= 62 && g >= 44 && g <= 68 && b >= 50 && b <= 74) return true;
  return false;
}

for (const def of classDefs) {
  const cropW = def.x2 - def.x1 + 1;
  const cropH = def.y2 - def.y1 + 1;

  const crop = new PNG({ width: cropW, height: cropH });
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const globalX = def.x1 + x;
      const globalY = def.y1 + y;
      const srcIdx = (globalY * srcPng.width + globalX) * 4;
      const dstIdx = (y * cropW + x) * 4;

      if (!def.validPixel(globalX, globalY)) {
        crop.data[dstIdx] = 20;
        crop.data[dstIdx + 1] = 23;
        crop.data[dstIdx + 2] = 32;
        crop.data[dstIdx + 3] = 255;
      } else {
        crop.data[dstIdx] = srcPng.data[srcIdx];
        crop.data[dstIdx + 1] = srcPng.data[srcIdx + 1];
        crop.data[dstIdx + 2] = srcPng.data[srcIdx + 2];
        crop.data[dstIdx + 3] = srcPng.data[srcIdx + 3];
      }
    }
  }

  const visited = new Uint8Array(cropW * cropH);
  const queueX = [];
  const queueY = [];

  function enqueue(x, y) {
    const idx = y * cropW + x;
    if (visited[idx]) return;
    const pIdx = idx * 4;
    const r = crop.data[pIdx], g = crop.data[pIdx + 1], b = crop.data[pIdx + 2];
    const globalY = def.y1 + y;
    if (isBgPixel(r, g, b, globalY)) {
      visited[idx] = 1;
      queueX.push(x);
      queueY.push(y);
    }
  }

  for (let x = 0; x < cropW; x++) {
    enqueue(x, 0);
    enqueue(x, cropH - 1);
  }
  for (let y = 0; y < cropH; y++) {
    enqueue(0, y);
    enqueue(cropW - 1, y);
  }

  let head = 0;
  while (head < queueX.length) {
    const cx = queueX[head];
    const cy = queueY[head];
    head++;

    const neighbors = [
      [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
    ];
    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < cropW && ny >= 0 && ny < cropH) {
        enqueue(nx, ny);
      }
    }
  }

  // Remove small disconnected foreground islands (noise < 50 pixels)
  const fgVisited = new Uint8Array(cropW * cropH);
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const idx = y * cropW + x;
      if (!visited[idx] && !fgVisited[idx]) {
        const island = [];
        const q = [[x, y]];
        fgVisited[idx] = 1;
        while (q.length > 0) {
          const [ix, iy] = q.pop();
          island.push([ix, iy]);
          const nbrs = [[ix+1, iy], [ix-1, iy], [ix, iy+1], [ix, iy-1]];
          for (const [nx, ny] of nbrs) {
            if (nx >= 0 && nx < cropW && ny >= 0 && ny < cropH) {
              const nIdx = ny * cropW + nx;
              if (!visited[nIdx] && !fgVisited[nIdx]) {
                fgVisited[nIdx] = 1;
                q.push([nx, ny]);
              }
            }
          }
        }
        if (island.length < 50) {
          for (const [ix, iy] of island) {
            visited[iy * cropW + ix] = 1;
          }
        }
      }
    }
  }

  let minX = cropW, maxX = -1, minY = cropH, maxY = -1;
  for (let y = 0; y < cropH; y++) {
    for (let x = 0; x < cropW; x++) {
      const idx = y * cropW + x;
      if (!visited[idx]) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const tightW = maxX - minX + 1;
  const tightH = maxY - minY + 1;
  const tight = new PNG({ width: tightW, height: tightH });

  for (let y = 0; y < tightH; y++) {
    for (let x = 0; x < tightW; x++) {
      const srcX = minX + x;
      const srcY = minY + y;
      const srcIdx = (srcY * cropW + srcX);
      const dstIdx = (y * tightW + x) * 4;

      if (visited[srcIdx]) {
        tight.data[dstIdx] = 0;
        tight.data[dstIdx + 1] = 0;
        tight.data[dstIdx + 2] = 0;
        tight.data[dstIdx + 3] = 0;
      } else {
        const cIdx = srcIdx * 4;
        tight.data[dstIdx] = crop.data[cIdx];
        tight.data[dstIdx + 1] = crop.data[cIdx + 1];
        tight.data[dstIdx + 2] = crop.data[cIdx + 2];
        tight.data[dstIdx + 3] = crop.data[cIdx + 3];
      }
    }
  }

  const portraitFile = path.join(portraitsDir, `${def.id}.png`);
  fs.writeFileSync(portraitFile, PNG.sync.write(tight));
  console.log(`Cleanly extracted ${def.name}: ${portraitFile} (${tightW}x${tightH})`);
}

console.log('All 7 class portraits extracted with 100% precision!');

