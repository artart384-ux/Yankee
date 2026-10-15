const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ensure output directories exist
const outDirs = [
  'public/assets/sprites',
  'public/assets/tiles',
  'public/assets/props',
  'public/assets/vfx',
  'public/assets/ui',
  'public/assets/portraits'
];
for (const dir of outDirs) {
  const full = path.join(__dirname, '..', dir);
  if (!fs.existsSync(full)) {
    fs.mkdirSync(full, { recursive: true });
  }
}

// ---------------------------------------------------------------------
// 1. FAST & ROBUST PNG ENCODER & DECODER IN PURE NODE.JS
// ---------------------------------------------------------------------
function decodePNG(buf) {
  let offset = 8;
  let width, height, bitDepth, colorType;
  const idatChunks = [];

  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + len);
    offset += 12 + len;

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  const inflated = zlib.inflateSync(Buffer.concat(idatChunks));
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;
  const lineStride = width * bpp;
  const raw = Buffer.alloc(width * height * bpp);
  let srcPos = 0;

  for (let y = 0; y < height; y++) {
    const filter = inflated[srcPos++];
    const lineStart = y * lineStride;
    const prevLineStart = (y - 1) * lineStride;

    for (let x = 0; x < lineStride; x++) {
      const a = (x >= bpp) ? raw[lineStart + x - bpp] : 0;
      const b = (y > 0) ? raw[prevLineStart + x] : 0;
      const c = (y > 0 && x >= bpp) ? raw[prevLineStart + x - bpp] : 0;
      let val = inflated[srcPos++];

      switch (filter) {
        case 0: break;
        case 1: val = (val + a) & 0xff; break;
        case 2: val = (val + b) & 0xff; break;
        case 3: val = (val + Math.floor((a + b) / 2)) & 0xff; break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          let pr;
          if (pa <= pb && pa <= pc) pr = a;
          else if (pb <= pc) pr = b;
          else pr = c;
          val = (val + pr) & 0xff;
          break;
        }
      }
      raw[lineStart + x] = val;
    }
  }

  const rgba = Buffer.alloc(width * height * 4);
  if (colorType === 6) {
    raw.copy(rgba);
  } else if (colorType === 2) {
    for (let i = 0; i < width * height; i++) {
      rgba[i * 4] = raw[i * 3];
      rgba[i * 4 + 1] = raw[i * 3 + 1];
      rgba[i * 4 + 2] = raw[i * 3 + 2];
      rgba[i * 4 + 3] = 255;
    }
  }
  return { width, height, rgba };
}

function encodePNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  function makeChunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type); const crcBuf = Buffer.alloc(4);
    const combined = Buffer.concat([typeBuf, data]);
    const crcVal = crc32(combined); crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, combined, crcBuf]);
  }
  function crc32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    return (crc ^ (-1)) >>> 0;
  }
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i; for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
    table[i] = c >>> 0;
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = width * 4;
  const filtered = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    filtered[y * (stride + 1)] = 0;
    rgbaBuffer.copy(filtered, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const compressed = zlib.deflateSync(filtered);
  return Buffer.concat([signature, makeChunk('IHDR', ihdr), makeChunk('IDAT', compressed), makeChunk('IEND', Buffer.alloc(0))]);
}

// ---------------------------------------------------------------------
// 2. PIXEL BUFFER ENGINE
// ---------------------------------------------------------------------
class PixelBuffer {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.rgba = Buffer.alloc(width * height * 4);
  }

  setPixel(x, y, r, g, b, a = 255) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = (y * this.width + x) * 4;
    if (a >= 255) {
      this.rgba[idx] = r; this.rgba[idx + 1] = g; this.rgba[idx + 2] = b; this.rgba[idx + 3] = a;
    } else {
      const prevA = this.rgba[idx + 3] / 255;
      const alpha = a / 255;
      const outA = alpha + prevA * (1 - alpha);
      if (outA > 0) {
        this.rgba[idx] = Math.round((r * alpha + this.rgba[idx] * prevA * (1 - alpha)) / outA);
        this.rgba[idx + 1] = Math.round((g * alpha + this.rgba[idx + 1] * prevA * (1 - alpha)) / outA);
        this.rgba[idx + 2] = Math.round((b * alpha + this.rgba[idx + 2] * prevA * (1 - alpha)) / outA);
        this.rgba[idx + 3] = Math.round(outA * 255);
      }
    }
  }

  fillRect(x, y, w, h, r, g, b, a = 255) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        this.setPixel(px, py, r, g, b, a);
      }
    }
  }

  strokeRect(x, y, w, h, r, g, b, a = 255) {
    for (let px = x; px < x + w; px++) {
      this.setPixel(px, y, r, g, b, a);
      this.setPixel(px, y + h - 1, r, g, b, a);
    }
    for (let py = y; py < y + h; py++) {
      this.setPixel(x, py, r, g, b, a);
      this.setPixel(x + w - 1, py, r, g, b, a);
    }
  }

  fillCircle(cx, cy, radius, r, g, b, a = 255) {
    const r2 = radius * radius;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy <= r2) {
          this.setPixel(cx + dx, cy + dy, r, g, b, a);
        }
      }
    }
  }

  line(x0, y0, x1, y1, r, g, b, a = 255) {
    x0 = Math.floor(x0); y0 = Math.floor(y0);
    x1 = Math.floor(x1); y1 = Math.floor(y1);
    const dx = Math.abs(x1 - x0); const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1; const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;
    while (true) {
      this.setPixel(x0, y0, r, g, b, a);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  }

  blit(src, srcX, srcY, srcW, srcH, destX, destY, colorTransform = null) {
    for (let dy = 0; dy < srcH; dy++) {
      const sy = srcY + dy;
      if (sy < 0 || sy >= src.height) continue;
      for (let dx = 0; dx < srcW; dx++) {
        const sx = srcX + dx;
        if (sx < 0 || sx >= src.width) continue;
        const sIdx = (sy * src.width + sx) * 4;
        let r = src.rgba[sIdx];
        let g = src.rgba[sIdx + 1];
        let b = src.rgba[sIdx + 2];
        let a = src.rgba[sIdx + 3];
        if (a > 10) {
          if (colorTransform) {
            const transformed = colorTransform(r, g, b, a, dx, dy);
            if (transformed) {
              r = transformed.r; g = transformed.g; b = transformed.b; a = transformed.a;
            }
          }
          this.setPixel(destX + dx, destY + dy, r, g, b, a);
        }
      }
    }
  }

  save(filePath) {
    const png = encodePNG(this.width, this.height, this.rgba);
    fs.writeFileSync(filePath, png);
  }
}

// ---------------------------------------------------------------------
// 3. LOAD AUTHENTIC HIGH-RES PIXEL BASES
// ---------------------------------------------------------------------
console.log('Loading authentic pixel assets from public/assets/ ...');

// Load Idle Delinquent 64x64 base
const idleSEPath = path.join(__dirname, '../public/assets/Idle/rotations/south-east.png');
const idleSPath = path.join(__dirname, '../public/assets/Idle/rotations/south.png');
const baseSpriteSE = decodePNG(fs.readFileSync(idleSEPath));
const baseSpriteS = decodePNG(fs.readFileSync(idleSPath));

// Load Pixel Crawler Attack & Animation bases
const pcBaseDir = path.join(__dirname, '../public/assets/Pixel Crawler - Free Pack/Entities/Characters/Body_A/Animations');
const pcIdleSheet = decodePNG(fs.readFileSync(path.join(pcBaseDir, 'Idle_Base/Idle_Down-Sheet.png')));
const pcRunSheet = decodePNG(fs.readFileSync(path.join(pcBaseDir, 'Run_Base/Run_Down-Sheet.png')));
const pcSliceSheet = decodePNG(fs.readFileSync(path.join(pcBaseDir, 'Slice_Base/Slice_Down-Sheet.png')));
const pcPierceSheet = decodePNG(fs.readFileSync(path.join(pcBaseDir, 'Pierce_Base/Pierce_Down-Sheet.png')));
const pcCrushSheet = decodePNG(fs.readFileSync(path.join(pcBaseDir, 'Crush_Base/Crush_Down-Sheet.png')));
const pcHitSheet = decodePNG(fs.readFileSync(path.join(pcBaseDir, 'Hit_Base/Hit_Down-Sheet.png')));
const pcDeathSheet = decodePNG(fs.readFileSync(path.join(pcBaseDir, 'Death_Base/Death_Down-Sheet.png')));

// Load Orc Warrior (Apex Enforcer base)
const orcRunSheet = decodePNG(fs.readFileSync(path.join(__dirname, '../public/assets/Pixel Crawler - Free Pack/Entities/Mobs/Orc Crew/Orc - Warrior/Run/Run-Sheet.png')));
const orcIdleSheet = decodePNG(fs.readFileSync(path.join(__dirname, '../public/assets/Pixel Crawler - Free Pack/Entities/Mobs/Orc Crew/Orc - Warrior/Idle/Idle-Sheet.png')));

// ---------------------------------------------------------------------
// 4. GENERATE 64x64 COMPOSITED FACTION SPRITESHEETS
// ---------------------------------------------------------------------
// Each spritesheet is 384x512 (6 cols x 8 rows of 64x64 frames)
// Row 0: Idle (4 frames)
// Row 1: Walk (6 frames)
// Row 2: Run (6 frames)
// Row 3: Slash / Slice (6 frames)
// Row 4: Pierce / Thrust (6 frames)
// Row 5: Crush / Overhead Slam (6 frames)
// Row 6: Phantom Dash (4 frames)
// Row 7: Hurt / Down (4 frames)

function buildFactionSpriteSheet(outputPath, factionConfig) {
  const fw = 64, fh = 64;
  const cols = 6, rows = 8;
  const canvas = new PixelBuffer(fw * cols, fh * rows);

  // Palette transformation function for base delinquent
  const transformPixel = (r, g, b, a, x, y) => {
    // Detect hair (hot pink/magenta in base sprite)
    if (r > 200 && b > 100 && g < 100) {
      return {
        r: factionConfig.hair[0],
        g: factionConfig.hair[1],
        b: factionConfig.hair[2],
        a: a
      };
    }
    // Detect jacket/pants (navy blue in base sprite)
    if (b > 60 && b > r && g < 80) {
      return {
        r: factionConfig.jacket[0],
        g: factionConfig.jacket[1],
        b: factionConfig.jacket[2],
        a: a
      };
    }
    return { r, g, b, a };
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const fx = c * fw;
      const fy = r * fh;

      // Base shadow for all frames
      canvas.fillCircle(fx + 32, fy + 58, 14, 10, 10, 20, 140);

      if (r === 0) {
        // ROW 0: IDLE (4 frames)
        if (c < 4) {
          const breathY = (c === 1 || c === 2) ? -1 : 0;
          // Blit authentic 64x64 delinquent character
          canvas.blit(baseSpriteSE, 0, 0, 64, 64, fx, fy + breathY, transformPixel);

          // Add glowing spirit aura motes around feet & shoulders
          const aura = factionConfig.aura;
          canvas.setPixel(fx + 18 + (c * 3) % 5, fy + 54 - (c * 2), aura[0], aura[1], aura[2], 220);
          canvas.setPixel(fx + 44 - (c * 2) % 4, fy + 52 - (c * 3), aura[0], aura[1], aura[2], 200);
          canvas.setPixel(fx + 22 + (c * 4) % 6, fy + 30 - c, aura[0], aura[1], aura[2], 180);

          // Render accessory
          if (factionConfig.goggles) {
            // Welding goggles on forehead
            canvas.fillRect(fx + 26, fy + 16 + breathY, 12, 3, 218, 165, 32);
            canvas.fillRect(fx + 28, fy + 17 + breathY, 3, 2, 5, 217, 232);
            canvas.fillRect(fx + 34, fy + 17 + breathY, 3, 2, 5, 217, 232);
          }
          if (factionConfig.mask) {
            // Delinquent face mask
            canvas.fillRect(fx + 28, fy + 24 + breathY, 8, 4, 20, 24, 30);
          }
        }
      } else if (r === 1) {
        // ROW 1: WALK (6 frames)
        const bobY = (c % 2 === 1) ? -1 : 0;
        const legShift = (c % 2 === 0) ? -1 : 1;
        canvas.blit(baseSpriteSE, 0, 0, 64, 64, fx + legShift, fy + bobY, transformPixel);

        // Footstep dust
        canvas.fillRect(fx + 26, fy + 58, 4, 2, 120, 130, 150, 140);
      } else if (r === 2) {
        // ROW 2: RUN (6 frames)
        const forwardLean = 2;
        const bobY = (c % 2 === 1) ? -2 : 0;
        canvas.blit(baseSpriteSE, 0, 0, 64, 64, fx + forwardLean, fy + bobY, transformPixel);

        // Trailing speed blur
        const aura = factionConfig.aura;
        canvas.fillRect(fx + 16, fy + 38 + bobY, 6, 2, aura[0], aura[1], aura[2], 160);
        canvas.fillRect(fx + 12, fy + 48 + bobY, 8, 2, aura[0], aura[1], aura[2], 140);
        canvas.fillRect(fx + 22, fy + 58, 6, 3, 150, 160, 180, 180);
      } else if (r === 3) {
        // ROW 3: SLASH / SLICE (6 frames)
        // Combine delinquent base with heavy weapon swing
        const swingProgress = c / 5;
        const lean = Math.round(Math.sin(swingProgress * Math.PI) * 4);
        canvas.blit(baseSpriteSE, 0, 0, 64, 64, fx + lean, fy, transformPixel);

        // Draw weapon arc
        const aura = factionConfig.aura;
        if (c >= 1 && c <= 4) {
          // Giant crescent slash blade & aura
          const arcX = fx + 36 + (c - 1) * 4;
          const arcY = fy + 24 + (c - 1) * 3;
          canvas.line(arcX - 10, arcY - 14, arcX + 14, arcY + 12, 255, 255, 255, 255);
          canvas.line(arcX - 8, arcY - 12, arcX + 16, arcY + 14, aura[0], aura[1], aura[2], 240);
          canvas.line(arcX - 6, arcY - 10, arcX + 18, arcY + 16, aura[0], aura[1], aura[2], 180);

          // Impact sparks on hit frame (c === 2)
          if (c === 2) {
            canvas.fillCircle(arcX + 8, arcY, 4, 255, 255, 200, 255);
            canvas.line(arcX + 4, arcY - 6, arcX + 14, arcY + 6, 255, 200, 50, 255);
            canvas.line(arcX + 4, arcY + 6, arcX + 14, arcY - 6, 255, 200, 50, 255);
          }
        }
      } else if (r === 4) {
        // ROW 4: PIERCE / THRUST (6 frames)
        const thrustX = (c >= 2 && c <= 4) ? 5 : (c === 1) ? -2 : 0;
        canvas.blit(baseSpriteSE, 0, 0, 64, 64, fx + thrustX, fy, transformPixel);

        // Thrust weapon beam
        const aura = factionConfig.aura;
        if (c >= 2 && c <= 4) {
          const tipX = fx + 46 + thrustX;
          const tipY = fy + 34;
          canvas.line(tipX - 20, tipY, tipX + 8, tipY, 255, 255, 255, 255);
          canvas.line(tipX - 18, tipY - 1, tipX + 6, tipY - 1, aura[0], aura[1], aura[2], 220);
          canvas.line(tipX - 18, tipY + 1, tipX + 6, tipY + 1, aura[0], aura[1], aura[2], 220);
          // Starburst flash
          canvas.fillCircle(tipX + 8, tipY, 3, 255, 255, 255, 255);
        }
      } else if (r === 5) {
        // ROW 5: CRUSH / HEAVY SLAM (6 frames)
        const leapY = (c === 1 || c === 2) ? -6 : (c === 3) ? 2 : 0;
        canvas.blit(baseSpriteSE, 0, 0, 64, 64, fx, fy + leapY, transformPixel);

        // Ground shockwave upon slam (c === 3 & 4)
        const aura = factionConfig.aura;
        if (c === 3) {
          // Huge shockwave crack
          canvas.line(fx + 20, fy + 58, fx + 52, fy + 58, 255, 255, 255, 255);
          canvas.line(fx + 16, fy + 59, fx + 56, fy + 59, aura[0], aura[1], aura[2], 255);
          canvas.fillCircle(fx + 36, fy + 58, 6, aura[0], aura[1], aura[2], 200);
          // Concrete fragments flying
          canvas.fillRect(fx + 22, fy + 48, 3, 3, 180, 180, 190);
          canvas.fillRect(fx + 48, fy + 46, 3, 3, 180, 180, 190);
        } else if (c === 4) {
          canvas.line(fx + 10, fy + 58, fx + 60, fy + 58, aura[0], aura[1], aura[2], 180);
        }
      } else if (r === 6) {
        // ROW 6: PHANTOM DASH (4 frames)
        if (c < 4) {
          const dashX = c * 3;
          // Ghost afterimage behind
          const aura = factionConfig.aura;
          canvas.blit(baseSpriteSE, 0, 0, 64, 64, fx + dashX - 8, fy, (r, g, b, a) => ({
            r: aura[0], g: aura[1], b: aura[2], a: Math.floor(a * 0.4)
          }));
          // Main body
          canvas.blit(baseSpriteSE, 0, 0, 64, 64, fx + dashX, fy, transformPixel);
        }
      } else if (r === 7) {
        // ROW 7: HURT / STAGGER (4 frames)
        if (c < 4) {
          const hurtX = (c === 0 || c === 1) ? -4 : 0;
          const hurtY = (c === 1) ? 2 : 0;
          canvas.blit(baseSpriteSE, 0, 0, 64, 64, fx + hurtX, fy + hurtY, (r, g, b, a) => {
            if (c === 0) return { r: 255, g: 255, b: 255, a }; // Flash white on hit
            return transformPixel(r, g, b, a);
          });
        }
      }
    }
  }

  canvas.save(outputPath);
  console.log(`Saved upgraded 64x64 Faction Sprite: ${outputPath}`);
}

// 1. GEARHEADS BRAWLER (Magenta Hair, Red/Rust Vest, Welding Goggles, Giant Wrench)
buildFactionSpriteSheet(
  path.join(__dirname, '../public/assets/sprites/gearheads_brawler.png'),
  {
    hair: [255, 42, 109],
    jacket: [195, 35, 75],
    aura: [255, 42, 109],
    goggles: true,
    mask: false
  }
);

// 2. THE ELITES STRIKER (Icy Blue Hair, Royal Navy Blazer, Gold Crest, Rapier)
buildFactionSpriteSheet(
  path.join(__dirname, '../public/assets/sprites/elites_striker.png'),
  {
    hair: [210, 235, 255],
    jacket: [15, 38, 90],
    aura: [5, 217, 232],
    goggles: false,
    mask: false
  }
);

// 3. THE SYNDICATE DELINQUENT (Black/Green Tips Hair, Emerald Sukajan Bomber, Mask, Bat)
buildFactionSpriteSheet(
  path.join(__dirname, '../public/assets/sprites/syndicate_delinquent.png'),
  {
    hair: [20, 25, 30],
    jacket: [16, 100, 56],
    aura: [0, 255, 102],
    goggles: false,
    mask: true
  }
);

// 4. BULKY APEX ENFORCER (Heavy Armored Mini-Boss / Enforcer with Red Visor)
function buildApexEnforcerSheet(outputPath) {
  const fw = 64, fh = 64;
  const cols = 6, rows = 8;
  const canvas = new PixelBuffer(fw * cols, fh * rows);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const fx = c * fw;
      const fy = r * fh;

      // Heavy wide shadow
      canvas.fillCircle(fx + 32, fy + 58, 18, 10, 10, 20, 170);

      const bobY = (c % 2 === 1) ? -1 : 0;
      const swing = (r === 3 && c >= 1 && c <= 4);

      // Heavy Armored Legs & Iron Boots
      canvas.fillRect(fx + 20, fy + 44 + bobY, 10, 14, 45, 50, 60);
      canvas.fillRect(fx + 34, fy + 44 + bobY, 10, 14, 45, 50, 60);
      canvas.fillRect(fx + 18, fy + 54 + bobY, 13, 5, 25, 30, 40);
      canvas.fillRect(fx + 33, fy + 54 + bobY, 13, 5, 25, 30, 40);

      // Bulky Chestplate with Spikes & Riot Plate
      canvas.fillRect(fx + 16, fy + 24 + bobY, 32, 22, 60, 65, 80);
      canvas.strokeRect(fx + 16, fy + 24 + bobY, 32, 22, 20, 25, 35);
      canvas.fillRect(fx + 22, fy + 28 + bobY, 20, 14, 40, 45, 55);

      // Massive Spiked Shoulder Pauldrons
      canvas.fillRect(fx + 10, fy + 22 + bobY, 10, 12, 75, 80, 95);
      canvas.fillRect(fx + 44, fy + 22 + bobY, 10, 12, 75, 80, 95);
      canvas.fillRect(fx + 12, fy + 18 + bobY, 4, 5, 200, 205, 220); // Spikes
      canvas.fillRect(fx + 48, fy + 18 + bobY, 4, 5, 200, 205, 220);

      // Armored Full-Face Helmet with Glowing Crimson Visor
      canvas.fillRect(fx + 22, fy + 12 + bobY, 20, 16, 50, 55, 65);
      canvas.strokeRect(fx + 22, fy + 12 + bobY, 20, 16, 20, 22, 30);
      // Crimson glowing visor slit
      canvas.fillRect(fx + 25, fy + 18 + bobY, 14, 3, 255, 20, 60);
      canvas.fillRect(fx + 28, fy + 19 + bobY, 8, 1, 255, 255, 255);

      // Giant Demolition Club / Heavy Sledgehammer
      if (swing) {
        // Overhead smash position
        canvas.line(fx + 46, fy + 10, fx + 58, fy + 48, 160, 165, 180);
        canvas.fillRect(fx + 52, fy + 8, 10, 14, 30, 35, 45);
        canvas.fillRect(fx + 50, fy + 6, 14, 3, 255, 42, 109);
      } else {
        // Resting on shoulder
        canvas.line(fx + 44, fy + 16 + bobY, fx + 54, fy + 46 + bobY, 140, 145, 160);
        canvas.fillRect(fx + 48, fy + 10 + bobY, 10, 12, 35, 40, 50);
      }

      // Crimson danger aura motes
      canvas.setPixel(fx + 14 + (c * 4) % 6, fy + 48 - (c * 2), 255, 20, 60, 220);
      canvas.setPixel(fx + 48 - (c * 3) % 5, fy + 46 - (c * 3), 255, 20, 60, 200);
    }
  }

  canvas.save(outputPath);
  console.log(`Saved bulky Apex Enforcer: ${outputPath}`);
}
buildApexEnforcerSheet(path.join(__dirname, '../public/assets/sprites/enemy_apex_enforcer.png'));

// 5. ENEMY THUG (Street Gang Rival Delinquent)
buildFactionSpriteSheet(
  path.join(__dirname, '../public/assets/sprites/enemy_thug.png'),
  {
    hair: [160, 50, 200], // Purple delinquent hair
    jacket: [65, 25, 90], // Deep purple hoodie
    aura: [180, 40, 220],
    goggles: false,
    mask: true
  }
);

// ---------------------------------------------------------------------
// 5. EXTRACT HIGH-RESOLUTION PROPS (Vehicles, Desks, Dungeons)
// ---------------------------------------------------------------------
function cropHelper(src, x, y, w, h) {
  const out = Buffer.alloc(w * h * 4);
  for (let dy = 0; dy < h; dy++) {
    const sy = y + dy;
    if (sy < 0 || sy >= src.height) continue;
    for (let dx = 0; dx < w; dx++) {
      const sx = x + dx;
      if (sx < 0 || sx >= src.width) continue;
      const sIdx = (sy * src.width + sx) * 4;
      const dIdx = (dy * w + dx) * 4;
      out[dIdx] = src.rgba[sIdx];
      out[dIdx + 1] = src.rgba[sIdx + 1];
      out[dIdx + 2] = src.rgba[sIdx + 2];
      out[dIdx + 3] = src.rgba[sIdx + 3];
    }
  }
  return { width: w, height: h, rgba: out };
}

// 1. Extract Cyber Cars from 2dcity
try {
  const vehiclesPath = path.join(__dirname, '../public/assets/2dcitywithoutoutline/vehicles/vehicles0001.png');
  if (fs.existsSync(vehiclesPath)) {
    const vImg = decodePNG(fs.readFileSync(vehiclesPath));

    const cyberCar = cropHelper(vImg, 64, 48, 160, 120);
    fs.writeFileSync(path.join(__dirname, '../public/assets/props/prop_cyber_car.png'), encodePNG(cyberCar.width, cyberCar.height, cyberCar.rgba));

    const cyberTaxi = cropHelper(vImg, 256, 48, 160, 120);
    fs.writeFileSync(path.join(__dirname, '../public/assets/props/prop_cyber_taxi.png'), encodePNG(cyberTaxi.width, cyberTaxi.height, cyberTaxi.rgba));

    console.log('Extracted prop_cyber_car and prop_cyber_taxi');
  }
} catch (e) {
  console.warn('Vehicle crop warning:', e.message);
}

// 2. Extract Classroom Desks & Computers
try {
  const classPath = path.join(__dirname, '../public/assets/2dClassroomAssetPackByStyloo/Classroom/Classroom First Spritesheet 1.png');
  if (fs.existsSync(classPath)) {
    const cImg = decodePNG(fs.readFileSync(classPath));
    const desk = cropHelper(cImg, 64, 64, 128, 128);
    fs.writeFileSync(path.join(__dirname, '../public/assets/props/prop_school_desk.png'), encodePNG(desk.width, desk.height, desk.rgba));

    const podium = cropHelper(cImg, 256, 64, 128, 128);
    fs.writeFileSync(path.join(__dirname, '../public/assets/props/prop_teacher_podium.png'), encodePNG(podium.width, podium.height, podium.rgba));
    console.log('Extracted school desks & podium');
  }

  const compPath = path.join(__dirname, '../public/assets/2dClassroomAssetPackByStyloo/Computer Room/Computer Room Spritesheet 1.png');
  if (fs.existsSync(compPath)) {
    const cpImg = decodePNG(fs.readFileSync(compPath));
    const compDesk = cropHelper(cpImg, 64, 64, 128, 128);
    fs.writeFileSync(path.join(__dirname, '../public/assets/props/prop_computer_desk.png'), encodePNG(compDesk.width, compDesk.height, compDesk.rgba));
    console.log('Extracted computer desk');
  }
} catch (e) {
  console.warn('Classroom crop warning:', e.message);
}

// 3. Extract Tartarus Dungeon Portal from Pixel Crawler
try {
  const dPath = path.join(__dirname, '../public/assets/Pixel Crawler - Free Pack/Environment/Tilesets/Dungeon_Tiles.png');
  if (fs.existsSync(dPath)) {
    const dImg = decodePNG(fs.readFileSync(dPath));
    const portal = cropHelper(dImg, 0, 0, 96, 96);
    fs.writeFileSync(path.join(__dirname, '../public/assets/props/prop_dungeon_portal.png'), encodePNG(portal.width, portal.height, portal.rgba));
    console.log('Extracted prop_dungeon_portal');
  }
} catch (e) {
  console.warn('Dungeon crop warning:', e.message);
}

// ---------------------------------------------------------------------
// 6. GENERATE COMIC POP IMPACT BADGES ("KAPOW!", "SLAM!", "CRIT!")
// ---------------------------------------------------------------------
// 1. KAPOW! (Fiery Orange/Red comic explosion badge)
function generateKapowBadge() {
  const w = 96, h = 48;
  const canvas = new PixelBuffer(w, h);
  const cx = 48, cy = 24;

  // Outer explosion star points
  const points = 12;
  for (let a = 0; a < Math.PI * 2; a += 0.05) {
    const r = (Math.round(a * (points / (Math.PI * 2))) % 2 === 0) ? 22 : 14;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * (r * 0.7);
    canvas.fillCircle(px, py, 4, 255, 42, 109);
    canvas.fillCircle(px, py, 2, 255, 215, 0);
  }
  canvas.fillCircle(cx, cy, 16, 255, 60, 0);
  canvas.fillCircle(cx, cy, 12, 255, 220, 0);

  canvas.save(path.join(__dirname, '../public/assets/vfx/vfx_kapow_burst.png'));
  console.log('Generated vfx_kapow_burst.png');
}
generateKapowBadge();

// 2. SLAM! (Cyan / White shockwave burst)
function generateSlamBadge() {
  const w = 96, h = 48;
  const canvas = new PixelBuffer(w, h);
  const cx = 48, cy = 24;

  for (let a = 0; a < Math.PI * 2; a += 0.05) {
    const r = (Math.round(a * 4) % 2 === 0) ? 22 : 12;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * (r * 0.7);
    canvas.fillCircle(px, py, 4, 5, 217, 232);
    canvas.fillCircle(px, py, 2, 255, 255, 255);
  }
  canvas.fillCircle(cx, cy, 14, 0, 180, 255);
  canvas.fillCircle(cx, cy, 10, 240, 255, 255);

  canvas.save(path.join(__dirname, '../public/assets/vfx/vfx_slam_burst.png'));
  console.log('Generated vfx_slam_burst.png');
}
generateSlamBadge();

// 3. Spark & Debris particles
function generateSparkAndDebris() {
  // Spark (8x8 bright diamond)
  const spark = new PixelBuffer(8, 8);
  spark.fillCircle(4, 4, 3, 255, 255, 200);
  spark.setPixel(4, 4, 255, 255, 255);
  spark.line(4, 0, 4, 7, 255, 220, 50);
  spark.line(0, 4, 7, 4, 255, 220, 50);
  spark.save(path.join(__dirname, '../public/assets/vfx/vfx_spark.png'));

  // Debris (8x8 concrete pebble)
  const debris = new PixelBuffer(8, 8);
  debris.fillRect(2, 2, 4, 4, 120, 125, 140);
  debris.fillRect(3, 3, 2, 2, 170, 175, 190);
  debris.setPixel(2, 2, 60, 65, 80);
  debris.save(path.join(__dirname, '../public/assets/vfx/vfx_debris.png'));

  console.log('Generated vfx_spark and vfx_debris');
}
generateSparkAndDebris();

console.log('====================================================');
console.log('PROJECT YANKEE GRAPHICS OVERHAUL ASSETS GENERATED OK');
console.log('====================================================');
