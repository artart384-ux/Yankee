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
// 1. ROBUST PNG ENCODER & DECODER IN PURE NODE.JS
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
// 2. PIXEL BUFFER & PROCEDURAL 64x64 SPRITE ENGINE
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

  blit(src, srcX, srcY, srcW, srcH, destX, destY) {
    for (let dy = 0; dy < srcH; dy++) {
      const sy = srcY + dy;
      if (sy < 0 || sy >= src.height) continue;
      for (let dx = 0; dx < srcW; dx++) {
        const sx = srcX + dx;
        if (sx < 0 || sx >= src.width) continue;
        const sIdx = (sy * src.width + sx) * 4;
        const a = src.rgba[sIdx + 3];
        if (a > 0) {
          this.setPixel(destX + dx, destY + dy, src.rgba[sIdx], src.rgba[sIdx + 1], src.rgba[sIdx + 2], a);
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
// 3. HD 64x64 CHARACTER SPRITESHEET GENERATION (Images 2, 3, 4 Inspired)
// ---------------------------------------------------------------------
// Each spritesheet is 384 x 512 (6 cols x 8 rows of 64x64 frames)
// Row 0: Idle (4 frames)
// Row 1: Walk (6 frames)
// Row 2: Run (6 frames)
// Row 3: Slash / Slice (6 frames)
// Row 4: Pierce (6 frames)
// Row 5: Crush / Strike (6 frames)
// Row 6: Phantom Dash (4 frames)
// Row 7: Hurt / Down (4 frames)

function generate64x64CharacterSheet(outputPath, style) {
  const fw = 64, fh = 64;
  const cols = 6, rows = 8;
  const canvas = new PixelBuffer(fw * cols, fh * rows);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const fx = c * fw;
      const fy = r * fh;
      const frameIdx = r * cols + c;

      // Drop shadow (isometric 3/4 perspective)
      canvas.fillCircle(fx + 32, fy + 58, 12, 10, 10, 20, 160);

      // Animation parameters
      let bobY = 0;
      let legOffset = 0;
      let actionType = 'idle';
      let weaponAction = 'none';
      let isHurt = false;

      if (r === 0) {
        // Idle (frames 0-3)
        if (c < 4) {
          bobY = (c === 1 || c === 3) ? 1 : (c === 2) ? 2 : 0;
          actionType = 'idle';
        }
      } else if (r === 1) {
        // Walk (frames 6-11)
        bobY = (c % 2 === 1) ? 2 : 0;
        legOffset = Math.sin((c / 6) * Math.PI * 2) * 6;
        actionType = 'walk';
      } else if (r === 2) {
        // Run (frames 12-17)
        bobY = (c % 2 === 1) ? 3 : 1;
        legOffset = Math.sin((c / 6) * Math.PI * 2) * 9;
        actionType = 'run';
      } else if (r === 3) {
        // Slash Attack (frames 18-23)
        actionType = 'slash';
        weaponAction = 'slash';
        bobY = (c >= 2 && c <= 4) ? 2 : 0;
      } else if (r === 4) {
        // Pierce Attack (frames 24-29)
        actionType = 'pierce';
        weaponAction = 'pierce';
        bobY = (c >= 2 && c <= 4) ? 1 : 0;
      } else if (r === 5) {
        // Crush Attack (frames 30-35)
        actionType = 'crush';
        weaponAction = 'crush';
        bobY = (c >= 3) ? 3 : 0;
      } else if (r === 6) {
        // Phantom Dash (frames 36-39)
        if (c < 4) {
          actionType = 'dash';
          bobY = 4;
        }
      } else if (r === 7) {
        // Hurt / Down (frames 42-45)
        if (c < 4) {
          actionType = 'hurt';
          isHurt = true;
          bobY = 3;
        }
      }

      // Aura Glow
      if (style.aura) {
        const auraAlpha = 50 + Math.floor(Math.sin((frameIdx + 1) * 0.7) * 25);
        canvas.fillCircle(fx + 32, fy + 36 + bobY, 20, style.aura[0], style.aura[1], style.aura[2], auraAlpha);
      }

      // 64x64 Anatomy Coordinates
      const headX = fx + 32;
      const headY = fy + 22 + bobY;
      const bodyY = fy + 33 + bobY;
      const legY = fy + 46 + bobY;

      // Legs / Footwear (Isometric stance)
      const leftFootX = fx + 27 - Math.round(legOffset);
      const rightFootX = fx + 37 + Math.round(legOffset);

      // Pants / Skirt
      if (style.skirt) {
        // Pleated school skirt (Image 4)
        canvas.fillRect(fx + 24, bodyY + 10, 16, 9, style.skirt[0], style.skirt[1], style.skirt[2]);
        // Pleat lines
        canvas.line(fx + 28, bodyY + 10, fx + 27, bodyY + 19, style.skirtShadow[0], style.skirtShadow[1], style.skirtShadow[2]);
        canvas.line(fx + 32, bodyY + 10, fx + 32, bodyY + 19, style.skirtShadow[0], style.skirtShadow[1], style.skirtShadow[2]);
        canvas.line(fx + 36, bodyY + 10, fx + 37, bodyY + 19, style.skirtShadow[0], style.skirtShadow[1], style.skirtShadow[2]);
        // Legs under skirt
        canvas.fillRect(leftFootX - 1, legY + 2, 4, 8, style.skin[0], style.skin[1], style.skin[2]);
        canvas.fillRect(rightFootX - 1, legY + 2, 4, 8, style.skin[0], style.skin[1], style.skin[2]);
      } else {
        // Delinquent track pants / Mechanic work pants
        canvas.fillRect(leftFootX - 3, legY - 2, 7, 10, style.pants[0], style.pants[1], style.pants[2]);
        canvas.fillRect(rightFootX - 3, legY - 2, 7, 10, style.pants[0], style.pants[1], style.pants[2]);
        if (style.pantsStripe) {
          canvas.fillRect(leftFootX - 3, legY - 2, 2, 10, style.pantsStripe[0], style.pantsStripe[1], style.pantsStripe[2]);
          canvas.fillRect(rightFootX + 2, legY - 2, 2, 10, style.pantsStripe[0], style.pantsStripe[1], style.pantsStripe[2]);
        }
      }

      // Boots / Sneakers
      canvas.fillRect(leftFootX - 4, legY + 8, 8, 4, style.shoes[0], style.shoes[1], style.shoes[2]);
      canvas.fillRect(rightFootX - 4, legY + 8, 8, 4, style.shoes[0], style.shoes[1], style.shoes[2]);
      canvas.fillRect(leftFootX - 4, legY + 11, 8, 2, style.trim[0], style.trim[1], style.trim[2]);
      canvas.fillRect(rightFootX - 4, legY + 11, 8, 2, style.trim[0], style.trim[1], style.trim[2]);

      // Torso / Jacket / Uniform
      canvas.fillRect(fx + 23, bodyY, 18, 14, style.jacket[0], style.jacket[1], style.jacket[2]);
      canvas.strokeRect(fx + 23, bodyY, 18, 14, 15, 18, 25);

      // Jacket Details: Sukajan Wolf embroidery, Academy Blazer Gold Aiguillette, Mechanic Gears
      if (style.theme === 'GEARHEADS') {
        // Mechanic leather straps & brass gears (Image 3)
        canvas.fillRect(fx + 25, bodyY + 2, 3, 11, 160, 95, 45); // Leather strap
        canvas.fillRect(fx + 36, bodyY + 2, 3, 11, 160, 95, 45);
        canvas.fillCircle(fx + 32, bodyY + 6, 3, 240, 180, 50); // Brass gear center
        canvas.setPixel(fx + 32, bodyY + 6, 40, 40, 45);
        // Utility belt with pouches
        canvas.fillRect(fx + 23, bodyY + 11, 18, 3, 140, 75, 35);
        canvas.fillRect(fx + 26, bodyY + 12, 4, 3, 220, 160, 40);
        canvas.fillRect(fx + 34, bodyY + 12, 4, 3, 220, 160, 40);
      } else if (style.theme === 'ELITES') {
        // Academy Blazer Gold Buttons & White Collar (Image 4)
        canvas.fillRect(fx + 29, bodyY + 1, 6, 4, 255, 255, 255); // White inner collar
        canvas.line(fx + 32, bodyY + 2, fx + 32, bodyY + 12, 240, 200, 50); // Gold center seam
        canvas.setPixel(fx + 30, bodyY + 5, 255, 215, 0); // Gold button 1
        canvas.setPixel(fx + 34, bodyY + 5, 255, 215, 0);
        canvas.setPixel(fx + 30, bodyY + 9, 255, 215, 0); // Gold button 2
        canvas.setPixel(fx + 34, bodyY + 9, 255, 215, 0);
        // Shoulder Cloak
        canvas.fillRect(fx + 21, bodyY + 1, 4, 13, 15, 35, 75);
        canvas.fillRect(fx + 39, bodyY + 1, 4, 13, 15, 35, 75);
      } else if (style.theme === 'SYNDICATE') {
        // Sukajan Bomber Jacket with white satin sleeves & chest wolf patch (Image 2)
        canvas.fillRect(fx + 20, bodyY + 1, 4, 11, 235, 240, 245); // White satin sleeve
        canvas.fillRect(fx + 40, bodyY + 1, 4, 11, 235, 240, 245);
        // Embroidered Wolf badge on left chest
        canvas.fillRect(fx + 26, bodyY + 3, 4, 4, 0, 255, 102);
        canvas.setPixel(fx + 28, bodyY + 4, 255, 255, 255);
        // Gold zipper
        canvas.fillRect(fx + 31, bodyY + 1, 2, 12, 240, 200, 60);
      }

      // Arms & Combat Strikes
      if (weaponAction === 'slash') {
        // Swinging weapon forward with glowing arc
        canvas.fillRect(fx + 38, bodyY + 1, 14, 5, style.jacket[0], style.jacket[1], style.jacket[2]);
        canvas.fillRect(fx + 51, bodyY, 6, 6, style.skin[0], style.skin[1], style.skin[2]);
        // Slashing blade / wrench / bat
        canvas.line(fx + 45, bodyY - 10, fx + 58, bodyY + 14, style.weapon[0], style.weapon[1], style.weapon[2]);
        canvas.line(fx + 46, bodyY - 10, fx + 59, bodyY + 14, style.weaponLight[0], style.weaponLight[1], style.weaponLight[2]);
        // Elemental Slash Arc
        for (let a = 0; a < 5; a++) {
          canvas.line(fx + 48 + a * 2, bodyY - 14 + a, fx + 60, bodyY + 8 + a * 2, style.aura[0], style.aura[1], style.aura[2], 220);
        }
      } else if (weaponAction === 'pierce') {
        // Direct thrust forward
        canvas.fillRect(fx + 36, bodyY + 2, 16, 4, style.jacket[0], style.jacket[1], style.jacket[2]);
        canvas.fillRect(fx + 52, bodyY + 1, 5, 5, style.skin[0], style.skin[1], style.skin[2]);
        // Rapier / Needle thrust beam
        canvas.line(fx + 40, bodyY + 3, fx + 62, bodyY + 3, style.weapon[0], style.weapon[1], style.weapon[2]);
        canvas.line(fx + 55, bodyY + 3, fx + 63, bodyY + 3, 255, 255, 255);
        canvas.fillRect(fx + 61, bodyY + 1, 3, 5, style.aura[0], style.aura[1], style.aura[2], 240);
      } else if (weaponAction === 'crush') {
        // Overhead downward smash
        canvas.fillRect(fx + 34, bodyY - 8, 5, 12, style.jacket[0], style.jacket[1], style.jacket[2]);
        canvas.fillRect(fx + 34, bodyY - 12, 6, 6, style.skin[0], style.skin[1], style.skin[2]);
        canvas.fillRect(fx + 30, bodyY - 18, 14, 8, style.weapon[0], style.weapon[1], style.weapon[2]);
        // Ground impact shockwave
        if (c >= 3) {
          canvas.fillCircle(fx + 48, fy + 56, 10, style.aura[0], style.aura[1], style.aura[2], 200);
          canvas.fillCircle(fx + 48, fy + 56, 6, 255, 255, 255, 240);
        }
      } else {
        // Normal arms (swinging with walk/run)
        const armSwing = Math.round(legOffset * 0.7);
        canvas.fillRect(fx + 19, bodyY + 2 - armSwing, 4, 10, style.jacket[0], style.jacket[1], style.jacket[2]);
        canvas.fillRect(fx + 19, bodyY + 10 - armSwing, 4, 4, style.skin[0], style.skin[1], style.skin[2]);
        canvas.fillRect(fx + 41, bodyY + 2 + armSwing, 4, 10, style.jacket[0], style.jacket[1], style.jacket[2]);
        canvas.fillRect(fx + 41, bodyY + 10 + armSwing, 4, 4, style.skin[0], style.skin[1], style.skin[2]);

        // Idle Weapon (Wrench on back / Rapier at side / Bat over shoulder)
        if (style.weaponType === 'wrench') {
          canvas.line(fx + 18, bodyY - 6, fx + 24, bodyY + 12, 170, 175, 185);
          canvas.fillRect(fx + 15, bodyY - 10, 6, 5, 200, 205, 215);
        } else if (style.weaponType === 'rapier') {
          canvas.line(fx + 43, bodyY + 6, fx + 50, bodyY + 22, 220, 240, 255);
          canvas.fillCircle(fx + 43, bodyY + 6, 2, 255, 215, 0); // Gold rapier guard
        } else if (style.weaponType === 'bat') {
          canvas.line(fx + 41, bodyY + 6, fx + 47, bodyY - 8, 190, 140, 80); // Wooden bat
          canvas.fillRect(fx + 45, bodyY - 10, 4, 4, 220, 170, 100);
        }
      }

      // Head & Anime Face (64x64 High Detail)
      canvas.fillRect(headX - 8, headY - 8, 16, 15, style.skin[0], style.skin[1], style.skin[2]);
      canvas.fillRect(headX - 6, headY + 5, 12, 3, style.skinShadow[0], style.skinShadow[1], style.skinShadow[2]);

      // Anime Eyes (Sharp delinquent / cold aristocrat eyes)
      if (isHurt) {
        // Hurt X eyes
        canvas.line(headX - 6, headY - 1, headX - 2, headY + 3, 30, 30, 40);
        canvas.line(headX - 6, headY + 3, headX - 2, headY - 1, 30, 30, 40);
        canvas.line(headX + 2, headY - 1, headX + 6, headY + 3, 30, 30, 40);
        canvas.line(headX + 2, headY + 3, headX + 6, headY - 1, 30, 30, 40);
      } else {
        canvas.fillRect(headX - 6, headY - 1, 4, 4, 25, 25, 35);
        canvas.fillRect(headX + 2, headY - 1, 4, 4, 25, 25, 35);
        canvas.fillRect(headX - 5, headY, 2, 2, style.eyeColor[0], style.eyeColor[1], style.eyeColor[2]);
        canvas.fillRect(headX + 3, headY, 2, 2, style.eyeColor[0], style.eyeColor[1], style.eyeColor[2]);
        canvas.setPixel(headX - 5, headY, 255, 255, 255); // Eye sparkle
        canvas.setPixel(headX + 3, headY, 255, 255, 255);
      }

      // Mouth / Delinquent Face Mask
      if (style.mask) {
        canvas.fillRect(headX - 5, headY + 3, 11, 5, style.mask[0], style.mask[1], style.mask[2]);
        canvas.line(headX - 4, headY + 5, headX + 5, headY + 5, style.trim[0], style.trim[1], style.trim[2]);
      } else {
        canvas.fillRect(headX - 2, headY + 4, 5, 2, 170, 70, 80);
      }

      // Hair (64x64 Stylized Anime Hair)
      canvas.fillRect(headX - 9, headY - 11, 18, 7, style.hair[0], style.hair[1], style.hair[2]);
      // Spiky anime bangs
      canvas.fillRect(headX - 8, headY - 5, 5, 5, style.hair[0], style.hair[1], style.hair[2]);
      canvas.fillRect(headX - 2, headY - 5, 5, 6, style.hair[0], style.hair[1], style.hair[2]);
      canvas.fillRect(headX + 3, headY - 5, 6, 5, style.hair[0], style.hair[1], style.hair[2]);
      // Hair light sheen
      canvas.fillRect(headX - 6, headY - 10, 10, 2, style.hairLight[0], style.hairLight[1], style.hairLight[2]);

      // Accessory: Welding Goggles (The Gearheads - Image 3)
      if (style.goggles) {
        // Brass goggle frame across forehead
        canvas.fillRect(headX - 8, headY - 9, 17, 4, 55, 55, 65);
        canvas.fillRect(headX - 6, headY - 9, 5, 4, 255, 60, 140); // Pink glowing lens
        canvas.fillRect(headX + 2, headY - 9, 5, 4, 255, 60, 140);
        canvas.strokeRect(headX - 6, headY - 9, 5, 4, 240, 180, 50); // Brass rim
        canvas.strokeRect(headX + 2, headY - 9, 5, 4, 240, 180, 50);
        canvas.setPixel(headX - 5, headY - 8, 255, 255, 255);
        canvas.setPixel(headX + 3, headY - 8, 255, 255, 255);
      }
    }
  }

  canvas.save(path.join(__dirname, '..', outputPath));
  console.log(`Generated HD 64x64 Spritesheet: ${outputPath}`);
}

// ---------------------------------------------------------------------
// 4. GENERATE 64x64 FACTION HEROES & ENEMIES
// ---------------------------------------------------------------------

// 1. The Gearheads (Image 3 inspired: Vocational Mechanic, Goggles, Huge Wrench, Red/Pink Aura)
generate64x64CharacterSheet('public/assets/sprites/gearheads_brawler.png', {
  theme: 'GEARHEADS',
  hair: [255, 42, 109],
  hairLight: [255, 140, 180],
  eyeColor: [255, 80, 130],
  skin: [255, 218, 185],
  skinShadow: [215, 170, 135],
  jacket: [220, 30, 80],
  trim: [255, 215, 0],
  pants: [35, 38, 50],
  shoes: [240, 40, 80],
  weapon: [180, 185, 195],
  weaponLight: [240, 245, 255],
  weaponType: 'wrench',
  aura: [255, 42, 109],
  goggles: true
});

// 2. The Elites (Image 4 inspired: Noble Student Council, Silver Hair, Blazer, Rapier, Cyan Aura)
generate64x64CharacterSheet('public/assets/sprites/elites_striker.png', {
  theme: 'ELITES',
  hair: [215, 230, 255], // Silvery ice blue
  hairLight: [255, 255, 255],
  eyeColor: [5, 217, 232],
  skin: [255, 225, 205],
  skinShadow: [220, 180, 155],
  jacket: [15, 45, 95], // Deep Navy Academy blazer
  trim: [255, 215, 0], // Gold crest
  skirt: [20, 30, 55],
  skirtShadow: [10, 15, 30],
  shoes: [15, 18, 28],
  weapon: [220, 240, 255],
  weaponLight: [5, 217, 232],
  weaponType: 'rapier',
  aura: [5, 217, 232]
});

// 3. The Syndicate (Image 2 inspired: Delinquent Sukajan Bomber, Spiky Hair, Mask, Bat, Green Aura)
generate64x64CharacterSheet('public/assets/sprites/syndicate_delinquent.png', {
  theme: 'SYNDICATE',
  hair: [30, 35, 40],
  hairLight: [0, 255, 102],
  eyeColor: [0, 255, 102],
  skin: [250, 212, 180],
  skinShadow: [210, 165, 130],
  jacket: [15, 80, 45], // Emerald green satin sukajan
  trim: [0, 255, 102],
  pants: [22, 24, 30],
  pantsStripe: [0, 255, 102],
  shoes: [0, 255, 102],
  mask: [20, 22, 28],
  weapon: [210, 160, 90],
  weaponLight: [255, 210, 120],
  weaponType: 'bat',
  aura: [0, 255, 102]
});

// 4. Enemy Thug (64x64 Street Delinquent Rival)
generate64x64CharacterSheet('public/assets/sprites/enemy_thug.png', {
  theme: 'THUG',
  hair: [150, 45, 190],
  hairLight: [210, 90, 240],
  eyeColor: [255, 60, 60],
  skin: [245, 205, 175],
  skinShadow: [200, 150, 120],
  jacket: [65, 30, 85], // Purple delinquent hoodie
  trim: [255, 180, 50],
  pants: [35, 35, 45],
  shoes: [80, 30, 100],
  weapon: [180, 130, 70],
  weaponLight: [230, 170, 90],
  weaponType: 'bat',
  aura: [180, 50, 220]
});

// 5. Training Dummy (64x64 Spring Loaded Dummy)
function generate64x64TrainingDummy() {
  const fw = 64, fh = 64;
  const canvas = new PixelBuffer(fw * 4, fh);

  for (let c = 0; c < 4; c++) {
    const fx = c * fw;
    const wobble = (c === 1) ? -3 : (c === 2) ? 4 : (c === 3) ? 0 : 0;
    const compressY = (c === 3) ? 4 : 0;

    // Shadow
    canvas.fillCircle(fx + 32, 60, 14, 10, 10, 20, 160);
    // Heavy Steel Base Plate with Rivets
    canvas.fillRect(fx + 18, 54, 28, 6, 60, 65, 80);
    canvas.fillRect(fx + 20, 55, 3, 3, 200, 205, 215);
    canvas.fillRect(fx + 41, 55, 3, 3, 200, 205, 215);
    // Coiled Spring Pole
    for (let s = 0; s < 4; s++) {
      canvas.fillRect(fx + 28, 42 + s * 3 + compressY, 8, 2, 160, 170, 185);
    }
    // Wooden Body Torso
    canvas.fillRect(fx + 20 + wobble, 20 + compressY, 24, 24, 190, 130, 75);
    canvas.strokeRect(fx + 20 + wobble, 20 + compressY, 24, 24, 120, 80, 45);
    // Target Bullseye on Chest
    canvas.fillCircle(fx + 32 + wobble, 32 + compressY, 7, 255, 42, 109);
    canvas.fillCircle(fx + 32 + wobble, 32 + compressY, 4, 255, 255, 255);
    canvas.fillCircle(fx + 32 + wobble, 32 + compressY, 2, 255, 42, 109);
    // Head dummy with bandage
    canvas.fillCircle(fx + 32 + wobble, 13 + compressY, 8, 210, 150, 95);
    canvas.line(fx + 26 + wobble, 13 + compressY, fx + 38 + wobble, 11 + compressY, 240, 240, 245);
  }
  canvas.save(path.join(__dirname, '..', 'public/assets/sprites/training_dummy.png'));
  console.log('Generated HD 64x64 training_dummy.png');
}
generate64x64TrainingDummy();

// 6. Cyber Security Drone (64x64)
function generate64x64Drone() {
  const fw = 64, fh = 64;
  const canvas = new PixelBuffer(fw * 4, fh * 2);

  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      const fx = c * fw;
      const fy = r * fh;
      const hoverY = Math.round(Math.sin((c / 4) * Math.PI * 2) * 3);

      // Shadow
      canvas.fillCircle(fx + 32, fy + 56, 12, 10, 10, 20, 140);

      const cy = fy + 26 + hoverY;
      // Main armored chassis
      canvas.fillCircle(fx + 32, cy, 14, 55, 60, 75);
      canvas.fillCircle(fx + 32, cy, 10, 75, 85, 105);
      // Twin Rotors / Thrusters
      canvas.fillRect(fx + 10, cy - 4, 10, 8, 40, 45, 55);
      canvas.fillRect(fx + 44, cy - 4, 10, 8, 40, 45, 55);
      // Glowing thruster flame
      canvas.fillRect(fx + 12, cy + 5, 6, 6, 5, 217, 232, 240);
      canvas.fillRect(fx + 46, cy + 5, 6, 6, 5, 217, 232, 240);
      // Central laser scanner eye
      const eyeColor = (r === 1) ? [255, 42, 109] : [5, 217, 232];
      canvas.fillCircle(fx + 32, cy, 5, eyeColor[0], eyeColor[1], eyeColor[2]);
      canvas.fillCircle(fx + 32, cy, 2, 255, 255, 255);
    }
  }
  canvas.save(path.join(__dirname, '..', 'public/assets/sprites/enemy_drone.png'));
  console.log('Generated HD 64x64 enemy_drone.png');
}
generate64x64Drone();

// ---------------------------------------------------------------------
// 5. EXTRACT & CROP HIGH-QUALITY PROPS (from 2dcity & 2dclassroom)
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

// Extract Cyber Cars from 2dcity
try {
  const vehiclesPath = path.join(__dirname, '..', 'public/assets/2dcitywithoutoutline/vehicles/vehicles0001.png');
  if (fs.existsSync(vehiclesPath)) {
    const vehiclesImg = decodePNG(fs.readFileSync(vehiclesPath));
    const cyberCar = cropHelper(vehiclesImg, 64, 48, 160, 120);
    fs.writeFileSync(path.join(__dirname, '..', 'public/assets/props/prop_cyber_car.png'), encodePNG(cyberCar.width, cyberCar.height, cyberCar.rgba));
    console.log('Extracted prop_cyber_car.png');

    const cyberTaxi = cropHelper(vehiclesImg, 256, 48, 160, 120);
    fs.writeFileSync(path.join(__dirname, '..', 'public/assets/props/prop_cyber_taxi.png'), encodePNG(cyberTaxi.width, cyberTaxi.height, cyberTaxi.rgba));
    console.log('Extracted prop_cyber_taxi.png');
  }
} catch (err) {
  console.warn('Vehicle extraction warning:', err.message);
}

// Extract Classroom Desks & Computers from 2dclassroom
try {
  const classroomPath = path.join(__dirname, '..', 'public/assets/2dClassroomAssetPackByStyloo/Classroom/Classroom First Spritesheet 1.png');
  if (fs.existsSync(classroomPath)) {
    const classImg = decodePNG(fs.readFileSync(classroomPath));
    const desk = cropHelper(classImg, 64, 64, 128, 128);
    fs.writeFileSync(path.join(__dirname, '..', 'public/assets/props/prop_school_desk.png'), encodePNG(desk.width, desk.height, desk.rgba));
    console.log('Extracted prop_school_desk.png');

    const podium = cropHelper(classImg, 256, 64, 128, 128);
    fs.writeFileSync(path.join(__dirname, '..', 'public/assets/props/prop_teacher_podium.png'), encodePNG(podium.width, podium.height, podium.rgba));
    console.log('Extracted prop_teacher_podium.png');
  }

  const compPath = path.join(__dirname, '..', 'public/assets/2dClassroomAssetPackByStyloo/Computer Room/Computer Room Spritesheet 1.png');
  if (fs.existsSync(compPath)) {
    const compImg = decodePNG(fs.readFileSync(compPath));
    const compDesk = cropHelper(compImg, 64, 64, 128, 128);
    fs.writeFileSync(path.join(__dirname, '..', 'public/assets/props/prop_computer_desk.png'), encodePNG(compDesk.width, compDesk.height, compDesk.rgba));
    console.log('Extracted prop_computer_desk.png');
  }
} catch (err) {
  console.warn('Classroom extraction warning:', err.message);
}

// Extract Tartarus Dungeon Portal from Pixel Crawler
try {
  const dungeonPath = 'C:/Users/Newdawn/Downloads/Pixel Crawler - Free Pack/Environment/Tilesets/Dungeon_Tiles.png';
  if (fs.existsSync(dungeonPath)) {
    const dungeonImg = decodePNG(fs.readFileSync(dungeonPath));
    const portal = cropHelper(dungeonImg, 0, 0, 96, 96);
    fs.writeFileSync(path.join(__dirname, '..', 'public/assets/props/prop_dungeon_portal.png'), encodePNG(portal.width, portal.height, portal.rgba));
    console.log('Extracted prop_dungeon_portal.png');
  }
} catch (err) {
  console.warn('Dungeon portal extraction warning:', err.message);
}

console.log('All upgraded 64x64 HD Character sprites & props generated successfully!');

