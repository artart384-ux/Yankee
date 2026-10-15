const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ensure output directories
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

// Pure Node.js PNG encoder
function createPNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const crcBuf = Buffer.alloc(4);
    const combined = Buffer.concat([typeBuf, data]);
    const crcVal = crc32(combined);
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, combined, crcBuf]);
  }
  function crc32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ (-1)) >>> 0;
  }
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
    table[i] = c >>> 0;
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const filtered = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {
    filtered[y * (stride + 1)] = 0;
    rgbaBuffer.copy(filtered, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const compressed = zlib.deflateSync(filtered);
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

// Canvas-like PixelBuffer class for clean procedural 2D drawing
class PixelBuffer {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.buffer = Buffer.alloc(width * height * 4);
  }

  setPixel(x, y, r, g, b, a = 255) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = (y * this.width + x) * 4;
    if (a >= 255) {
      this.buffer[idx] = r;
      this.buffer[idx + 1] = g;
      this.buffer[idx + 2] = b;
      this.buffer[idx + 3] = a;
    } else {
      // Alpha blending
      const prevA = this.buffer[idx + 3] / 255;
      const alpha = a / 255;
      const outA = alpha + prevA * (1 - alpha);
      if (outA > 0) {
        this.buffer[idx] = Math.round((r * alpha + this.buffer[idx] * prevA * (1 - alpha)) / outA);
        this.buffer[idx + 1] = Math.round((g * alpha + this.buffer[idx + 1] * prevA * (1 - alpha)) / outA);
        this.buffer[idx + 2] = Math.round((b * alpha + this.buffer[idx + 2] * prevA * (1 - alpha)) / outA);
        this.buffer[idx + 3] = Math.round(outA * 255);
      }
    }
  }

  getPixel(x, y) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return [0, 0, 0, 0];
    const idx = (y * this.width + x) * 4;
    return [
      this.buffer[idx],
      this.buffer[idx + 1],
      this.buffer[idx + 2],
      this.buffer[idx + 3]
    ];
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
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = (x0 < x1) ? 1 : -1;
    const sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;
    while (true) {
      this.setPixel(x0, y0, r, g, b, a);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  }

  save(filePath) {
    const png = createPNG(this.width, this.height, this.buffer);
    fs.writeFileSync(filePath, png);
  }
}

// ---------------------------------------------------------------------
// 1. CHARACTER SPRITESHEET GENERATOR (Chibi/SD 2.5D Isometric Retro Pixel Art)
// ---------------------------------------------------------------------
// 6 columns x 4 rows = 24 frames of 48x48 pixels (Total: 288x192)
function generateCharacterSheet(filename, palette) {
  const fw = 48, fh = 48;
  const cols = 6, rows = 4;
  const canvas = new PixelBuffer(fw * cols, fh * rows);

  // Palette details:
  // hair, skin, skinShadow, jacket, jacketShadow, trim, pants, auraColor, weaponColor
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const fx = c * fw;
      const fy = r * fh;
      const frameIdx = r * cols + c;

      // Draw shadow under feet
      canvas.fillCircle(fx + 24, fy + 44, 9, 10, 10, 20, 140);

      let bobY = 0;
      let legOffset = 0;
      let armAction = 'normal';
      let weaponSwing = false;
      let hurt = false;

      // Determine animation phase
      if (r === 0) {
        // Idle (frames 0-5)
        bobY = (c === 1 || c === 4) ? 1 : (c === 2 || c === 3) ? 2 : 0;
      } else if (r === 1) {
        // Walk/Run (frames 6-11)
        bobY = (c % 2 === 1) ? 2 : 0;
        legOffset = Math.sin((c / 6) * Math.PI * 2) * 5;
        armAction = 'running';
      } else if (r === 2) {
        // Attack combo (frames 12-17)
        if (c < 2) { armAction = 'punch1'; weaponSwing = true; }
        else if (c < 4) { armAction = 'punch2'; weaponSwing = true; }
        else { armAction = 'uppercut'; weaponSwing = true; }
        bobY = 1;
      } else {
        // Specials / Dash / Hurt (frames 18-23)
        if (c === 0 || c === 1) { armAction = 'dash'; bobY = 3; }
        else if (c === 2) { armAction = 'guard'; }
        else if (c === 3) { hurt = true; bobY = 2; }
        else { armAction = 'victory'; bobY = 0; }
      }

      // Draw Aura Glow behind character
      if (palette.aura) {
        const auraAlpha = 40 + Math.floor(Math.sin((frameIdx + 1) * 0.8) * 20);
        canvas.fillCircle(fx + 24, fy + 26 + bobY, 14, palette.aura[0], palette.aura[1], palette.aura[2], auraAlpha);
      }

      const headX = fx + 24;
      const headY = fy + 16 + bobY;

      // Legs / Shoes
      const legY = fy + 34 + bobY;
      const leftLegX = fx + 20 - Math.round(legOffset);
      const rightLegX = fx + 27 + Math.round(legOffset);

      // Pants
      canvas.fillRect(leftLegX - 2, legY, 5, 8, palette.pants[0], palette.pants[1], palette.pants[2]);
      canvas.fillRect(rightLegX - 2, legY, 5, 8, palette.pants[0], palette.pants[1], palette.pants[2]);
      // Shoes (High-top street sneakers)
      canvas.fillRect(leftLegX - 3, legY + 7, 7, 3, palette.shoes[0], palette.shoes[1], palette.shoes[2]);
      canvas.fillRect(rightLegX - 3, legY + 7, 7, 3, palette.shoes[0], palette.shoes[1], palette.shoes[2]);
      // Shoe soles/neon trim
      canvas.fillRect(leftLegX - 3, legY + 9, 7, 1, palette.trim[0], palette.trim[1], palette.trim[2]);
      canvas.fillRect(rightLegX - 3, legY + 9, 7, 1, palette.trim[0], palette.trim[1], palette.trim[2]);

      // Torso / Jacket
      const bodyY = fy + 24 + bobY;
      canvas.fillRect(fx + 18, bodyY, 12, 11, palette.jacket[0], palette.jacket[1], palette.jacket[2]);
      // Jacket shadow / details
      canvas.fillRect(fx + 18, bodyY + 7, 12, 4, palette.jacketShadow[0], palette.jacketShadow[1], palette.jacketShadow[2]);
      // Inner shirt / zipper
      canvas.fillRect(fx + 23, bodyY + 1, 2, 9, palette.trim[0], palette.trim[1], palette.trim[2]);
      // Faction emblem pin on chest
      canvas.fillRect(fx + 20, bodyY + 3, 2, 2, palette.trim[0], palette.trim[1], palette.trim[2]);

      // Arms & Hands / Weapon
      if (armAction === 'punch1') {
        // Right arm punching forward
        canvas.fillRect(fx + 28, bodyY + 2, 9, 4, palette.jacket[0], palette.jacket[1], palette.jacket[2]);
        canvas.fillRect(fx + 36, bodyY + 1, 5, 6, palette.skin[0], palette.skin[1], palette.skin[2]);
        // Punch spirit spark
        canvas.fillRect(fx + 40, bodyY + 2, 4, 4, palette.aura[0], palette.aura[1], palette.aura[2], 220);
      } else if (armAction === 'punch2') {
        canvas.fillRect(fx + 27, bodyY + 1, 11, 4, palette.jacket[0], palette.jacket[1], palette.jacket[2]);
        canvas.fillRect(fx + 37, bodyY, 6, 6, palette.skin[0], palette.skin[1], palette.skin[2]);
        // Strike arc
        canvas.fillRect(fx + 42, bodyY - 2, 3, 9, palette.aura[0], palette.aura[1], palette.aura[2], 240);
      } else if (armAction === 'uppercut') {
        canvas.fillRect(fx + 27, bodyY - 5, 4, 10, palette.jacket[0], palette.jacket[1], palette.jacket[2]);
        canvas.fillRect(fx + 26, bodyY - 8, 6, 5, palette.skin[0], palette.skin[1], palette.skin[2]);
        // Rising aura blast
        canvas.fillRect(fx + 25, bodyY - 14, 8, 7, palette.aura[0], palette.aura[1], palette.aura[2], 230);
      } else if (armAction === 'dash') {
        canvas.fillRect(fx + 14, bodyY + 4, 8, 3, palette.jacket[0], palette.jacket[1], palette.jacket[2]);
        canvas.fillRect(fx + 26, bodyY + 2, 8, 3, palette.jacket[0], palette.jacket[1], palette.jacket[2]);
      } else if (armAction === 'victory') {
        canvas.fillRect(fx + 15, bodyY - 4, 3, 8, palette.jacket[0], palette.jacket[1], palette.jacket[2]);
        canvas.fillRect(fx + 30, bodyY - 4, 3, 8, palette.jacket[0], palette.jacket[1], palette.jacket[2]);
      } else {
        // Idle / Running arms
        const armSwing = Math.round(legOffset * 0.8);
        canvas.fillRect(fx + 15, bodyY + 2 - armSwing, 3, 8, palette.jacket[0], palette.jacket[1], palette.jacket[2]);
        canvas.fillRect(fx + 15, bodyY + 9 - armSwing, 3, 3, palette.skin[0], palette.skin[1], palette.skin[2]);
        canvas.fillRect(fx + 30, bodyY + 2 + armSwing, 3, 8, palette.jacket[0], palette.jacket[1], palette.jacket[2]);
        canvas.fillRect(fx + 30, bodyY + 9 + armSwing, 3, 3, palette.skin[0], palette.skin[1], palette.skin[2]);
      }

      // Head / Face
      canvas.fillRect(headX - 6, headY - 6, 12, 12, palette.skin[0], palette.skin[1], palette.skin[2]);
      // Chin shadow
      canvas.fillRect(headX - 5, headY + 4, 10, 2, palette.skinShadow[0], palette.skinShadow[1], palette.skinShadow[2]);

      // Eyes
      if (hurt) {
        // 'X' eyes
        canvas.line(headX - 4, headY - 1, headX - 1, headY + 2, 30, 30, 40);
        canvas.line(headX - 4, headY + 2, headX - 1, headY - 1, 30, 30, 40);
        canvas.line(headX + 2, headY - 1, headX + 5, headY + 2, 30, 30, 40);
        canvas.line(headX + 2, headY + 2, headX + 5, headY - 1, 30, 30, 40);
      } else {
        // Anime delinquent eyes
        canvas.fillRect(headX - 4, headY, 3, 3, 20, 20, 30);
        canvas.fillRect(headX + 2, headY, 3, 3, 20, 20, 30);
        // Eye reflections
        canvas.fillRect(headX - 3, headY, 1, 1, 255, 255, 255);
        canvas.fillRect(headX + 3, headY, 1, 1, 255, 255, 255);
      }

      // Mask or mouth
      if (palette.mask) {
        canvas.fillRect(headX - 4, headY + 3, 9, 4, palette.mask[0], palette.mask[1], palette.mask[2]);
        canvas.fillRect(headX - 2, headY + 4, 5, 2, palette.trim[0], palette.trim[1], palette.trim[2]);
      } else {
        // Confident smirk
        canvas.fillRect(headX - 1, headY + 4, 4, 1, 160, 50, 60);
      }

      // Hair
      canvas.fillRect(headX - 7, headY - 8, 14, 5, palette.hair[0], palette.hair[1], palette.hair[2]);
      // Spiky front bangs
      canvas.fillRect(headX - 6, headY - 3, 4, 3, palette.hair[0], palette.hair[1], palette.hair[2]);
      canvas.fillRect(headX - 1, headY - 3, 4, 4, palette.hair[0], palette.hair[1], palette.hair[2]);
      canvas.fillRect(headX + 3, headY - 3, 4, 3, palette.hair[0], palette.hair[1], palette.hair[2]);
      // Hair highlights
      canvas.fillRect(headX - 4, headY - 7, 7, 1, palette.hairLight[0], palette.hairLight[1], palette.hairLight[2]);

      // Accessory: Welding Goggles for Gearheads, Student Tie for Elites, Bandana for Syndicate
      if (palette.accessory === 'goggles') {
        canvas.fillRect(headX - 6, headY - 6, 13, 3, 50, 50, 60);
        canvas.fillRect(headX - 4, headY - 6, 4, 3, 255, 100, 150);
        canvas.fillRect(headX + 2, headY - 6, 4, 3, 255, 100, 150);
      } else if (palette.accessory === 'tie') {
        canvas.fillRect(headX, bodyY + 1, 2, 7, 240, 190, 40);
      }
    }
  }

  canvas.save(path.join(__dirname, '..', filename));
  console.log(`Generated spritesheet: ${filename}`);
}

// Generate the 3 Playable Factions
generateCharacterSheet('public/assets/sprites/gearheads_brawler.png', {
  hair: [255, 42, 109], // Magenta punk hair
  hairLight: [255, 120, 170],
  skin: [255, 218, 185],
  skinShadow: [220, 170, 140],
  jacket: [220, 30, 80],
  jacketShadow: [150, 20, 50],
  trim: [255, 220, 100],
  pants: [35, 35, 45],
  shoes: [240, 40, 80],
  aura: [255, 42, 109],
  accessory: 'goggles'
});

generateCharacterSheet('public/assets/sprites/elites_striker.png', {
  hair: [220, 235, 255], // Platinum/Ice blue hair
  hairLight: [255, 255, 255],
  skin: [255, 225, 200],
  skinShadow: [215, 180, 150],
  jacket: [15, 45, 95], // Navy private academy blazer
  jacketShadow: [8, 25, 60],
  trim: [255, 215, 0], // Gold crest & embroidery
  pants: [25, 30, 50],
  shoes: [10, 10, 20],
  aura: [5, 217, 232], // Sapphire cyan aura
  accessory: 'tie'
});

generateCharacterSheet('public/assets/sprites/syndicate_delinquent.png', {
  hair: [30, 35, 40], // Black hair with green tips
  hairLight: [0, 255, 102],
  skin: [250, 210, 180],
  skinShadow: [210, 160, 130],
  jacket: [15, 75, 40], // Dark emerald / neon green sukajan
  jacketShadow: [8, 45, 25],
  trim: [0, 255, 102],
  pants: [20, 20, 25],
  shoes: [0, 255, 102],
  aura: [0, 255, 102],
  mask: [20, 20, 25]
});

// Generate Enemy Thug
generateCharacterSheet('public/assets/sprites/enemy_thug.png', {
  hair: [150, 40, 180], // Delinquent purple hair
  hairLight: [200, 80, 230],
  skin: [245, 205, 175],
  skinShadow: [200, 150, 120],
  jacket: [60, 30, 80],
  jacketShadow: [40, 20, 55],
  trim: [255, 180, 50],
  pants: [40, 40, 50],
  shoes: [80, 30, 100],
  aura: [180, 50, 220]
});

// ---------------------------------------------------------------------
// 2. CYBER PATROL DRONE SPRITE (Rust Port Security Drone)
// ---------------------------------------------------------------------
function generateDroneSprite() {
  const fw = 32, fh = 32;
  const cols = 4, rows = 2;
  const canvas = new PixelBuffer(fw * cols, fh * rows);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const fx = c * fw;
      const fy = r * fh;
      const hoverY = Math.round(Math.sin((c / 4) * Math.PI * 2) * 2);

      // Drone shadow
      canvas.fillCircle(fx + 16, fy + 28, 6, 10, 10, 20, 120);

      const cy = fy + 14 + hoverY;
      // Metallic body
      canvas.fillCircle(fx + 16, cy, 8, 60, 65, 80);
      canvas.fillCircle(fx + 16, cy, 6, 80, 90, 110);
      // Outer armor ring
      canvas.fillRect(fx + 6, cy - 2, 20, 4, 180, 50, 70);
      // Twin thrusters
      canvas.fillRect(fx + 8, cy + 5, 4, 4, 40, 40, 50);
      canvas.fillRect(fx + 20, cy + 5, 4, 4, 40, 40, 50);
      // Glowing thruster flame
      canvas.fillRect(fx + 9, cy + 9, 2, 3, 5, 217, 232, 220);
      canvas.fillRect(fx + 21, cy + 9, 2, 3, 5, 217, 232, 220);
      // Central glowing red/cyan eye
      const eyeColor = (r === 1) ? [255, 42, 109] : [5, 217, 232];
      canvas.fillRect(fx + 14, cy - 2, 4, 4, eyeColor[0], eyeColor[1], eyeColor[2]);
      canvas.fillRect(fx + 15, cy - 1, 2, 2, 255, 255, 255);
    }
  }
  canvas.save(path.join(__dirname, '..', 'public/assets/sprites/enemy_drone.png'));
  console.log('Generated enemy_drone.png');
}
generateDroneSprite();

// ---------------------------------------------------------------------
// 3. TRAINING DUMMY SPRITE
// ---------------------------------------------------------------------
function generateTrainingDummy() {
  const fw = 48, fh = 48;
  const canvas = new PixelBuffer(fw * 3, fh);

  for (let c = 0; c < 3; c++) {
    const fx = c * fw;
    const wobble = (c === 1) ? -2 : (c === 2) ? 3 : 0;

    // Shadow
    canvas.fillCircle(fx + 24, 44, 10, 10, 10, 20, 140);
    // Heavy steel base plate
    canvas.fillRect(fx + 14, 40, 20, 4, 50, 55, 65);
    // Coiled Spring pole
    canvas.fillRect(fx + 22, 30, 4, 10, 160, 170, 180);
    // Body (Punching bag / Wood dummy)
    canvas.fillRect(fx + 16 + wobble, 14, 16, 17, 180, 120, 70);
    canvas.strokeRect(fx + 16 + wobble, 14, 16, 17, 120, 80, 45);
    // Head dummy with target cross
    canvas.fillCircle(fx + 24 + wobble, 9, 6, 200, 140, 85);
    // Target bullseye on chest
    canvas.fillCircle(fx + 24 + wobble, 22, 4, 255, 42, 109);
    canvas.fillCircle(fx + 24 + wobble, 22, 2, 255, 255, 255);
  }
  canvas.save(path.join(__dirname, '..', 'public/assets/sprites/training_dummy.png'));
  console.log('Generated training_dummy.png');
}
generateTrainingDummy();

// ---------------------------------------------------------------------
// 4. ENVIRONMENT & STREET PROPS
// ---------------------------------------------------------------------
// Vending machine (Japanese/Thai glowing street neon)
function generateVendingMachine() {
  const w = 36, h = 54;
  const canvas = new PixelBuffer(w, h);

  // Outer casing
  canvas.fillRect(2, 4, 32, 48, 20, 25, 35);
  canvas.fillRect(4, 2, 28, 50, 25, 30, 42);
  canvas.strokeRect(3, 3, 30, 49, 10, 15, 25);

  // Top illuminated marquee ("NEO DRINKS")
  canvas.fillRect(6, 6, 24, 8, 255, 42, 109);
  canvas.fillRect(8, 8, 20, 4, 255, 200, 230);

  // Glass display shelf
  canvas.fillRect(6, 16, 24, 22, 15, 45, 65);
  canvas.strokeRect(6, 16, 24, 22, 5, 217, 232);

  // Rows of neon soda cans
  const canColors = [
    [255, 50, 50], [50, 255, 100], [50, 150, 255], [255, 220, 50],
    [255, 50, 200], [50, 255, 255], [255, 150, 0], [180, 50, 255]
  ];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      const cx = 8 + col * 6;
      const cy = 19 + row * 10;
      const color = canColors[row * 4 + col];
      canvas.fillRect(cx, cy, 4, 6, color[0], color[1], color[2]);
      // Small highlight on can
      canvas.fillRect(cx, cy, 1, 6, 255, 255, 255, 150);
      // Price button under can
      canvas.fillRect(cx + 1, cy + 7, 2, 1, 5, 217, 232);
    }
  }

  // Coin slot & payment screen
  canvas.fillRect(6, 40, 8, 4, 5, 217, 232);
  canvas.fillRect(16, 40, 2, 4, 150, 150, 160);

  // Delivery drop pocket
  canvas.fillRect(10, 46, 16, 5, 10, 12, 18);
  canvas.strokeRect(9, 45, 18, 6, 50, 55, 70);

  canvas.save(path.join(__dirname, '..', 'public/assets/props/vending_machine.png'));
  console.log('Generated vending_machine.png');
}
generateVendingMachine();

// Street Lamp Post with glowing neon lantern
function generateStreetLamp() {
  const w = 32, h = 64;
  const canvas = new PixelBuffer(w, h);

  // Heavy steel base
  canvas.fillRect(12, 58, 8, 6, 40, 45, 55);
  // Post pole
  canvas.fillRect(14, 12, 4, 46, 70, 75, 90);
  // Lamp bracket curving left and right
  canvas.fillRect(6, 10, 20, 3, 90, 95, 110);
  canvas.fillRect(4, 13, 6, 2, 90, 95, 110);
  canvas.fillRect(22, 13, 6, 2, 90, 95, 110);

  // Dual glowing neon lantern heads
  // Left lantern
  canvas.fillRect(4, 15, 6, 6, 5, 217, 232);
  canvas.fillRect(5, 16, 4, 4, 255, 255, 255);
  // Right lantern
  canvas.fillRect(22, 15, 6, 6, 255, 42, 109);
  canvas.fillRect(23, 16, 4, 4, 255, 255, 255);

  canvas.save(path.join(__dirname, '..', 'public/assets/props/street_lamp.png'));
  console.log('Generated street_lamp.png');
}
generateStreetLamp();

// Win Motorcycle Taxi (วินมอเตอร์ไซค์ นวบูรพา)
function generateMotorcycle() {
  const w = 48, h = 32;
  const canvas = new PixelBuffer(w, h);

  // Shadow
  canvas.fillCircle(12, 28, 7, 10, 10, 20, 120);
  canvas.fillCircle(36, 28, 7, 10, 10, 20, 120);

  // Wheels (Rubber tires + silver spokes)
  canvas.fillCircle(10, 22, 7, 25, 25, 30);
  canvas.fillCircle(10, 22, 4, 180, 185, 195);
  canvas.fillCircle(10, 22, 2, 40, 40, 45);

  canvas.fillCircle(38, 22, 7, 25, 25, 30);
  canvas.fillCircle(38, 22, 4, 180, 185, 195);
  canvas.fillCircle(38, 22, 2, 40, 40, 45);

  // Chassis & Engine block
  canvas.fillRect(16, 17, 16, 8, 80, 85, 95);
  canvas.fillRect(18, 22, 12, 4, 150, 155, 165); // Exhaust pipe
  canvas.fillRect(28, 23, 12, 3, 200, 205, 215);

  // Vibrant Orange Motorcycle Body (Classic Thai Win color)
  canvas.fillRect(14, 13, 22, 5, 255, 110, 0);
  canvas.fillRect(22, 10, 12, 4, 255, 140, 30); // Fuel tank

  // Black Leather Seat with orange vest draped
  canvas.fillRect(14, 10, 9, 3, 20, 20, 25);
  canvas.fillRect(16, 10, 5, 3, 255, 120, 0); // Orange win vest on seat

  // Handlebars & Headlight
  canvas.fillRect(34, 7, 2, 9, 100, 105, 115);
  canvas.fillRect(32, 6, 6, 2, 30, 30, 35);
  // Glowing LED headlight
  canvas.fillRect(38, 12, 3, 3, 5, 217, 232);
  canvas.fillRect(39, 13, 2, 2, 255, 255, 255);

  canvas.save(path.join(__dirname, '..', 'public/assets/props/motorcycle.png'));
  console.log('Generated motorcycle.png');
}
generateMotorcycle();

// Apex Ground Zero Hazard Barrier
function generateBarrier() {
  const w = 48, h = 24;
  const canvas = new PixelBuffer(w, h);

  // Shadow
  canvas.fillRect(4, 20, 40, 4, 10, 10, 20, 120);
  // Steel legs
  canvas.fillRect(8, 8, 3, 14, 60, 65, 75);
  canvas.fillRect(37, 8, 3, 14, 60, 65, 75);
  canvas.fillRect(4, 20, 11, 2, 40, 45, 55);
  canvas.fillRect(33, 20, 11, 2, 40, 45, 55);

  // Main beam with diagonal hazard caution stripes (Yellow & Black)
  for (let px = 6; px < 42; px++) {
    for (let py = 4; py < 14; py++) {
      const isYellow = ((px + py) % 8) < 4;
      if (isYellow) {
        canvas.setPixel(px, py, 255, 210, 0);
      } else {
        canvas.setPixel(px, py, 25, 25, 30);
      }
    }
  }
  // Border of beam
  canvas.strokeRect(6, 4, 36, 10, 10, 10, 15);
  // Red warning flasher beacon on top
  canvas.fillRect(10, 1, 4, 3, 255, 42, 109);
  canvas.fillRect(34, 1, 4, 3, 255, 42, 109);

  canvas.save(path.join(__dirname, '..', 'public/assets/props/barrier.png'));
  console.log('Generated barrier.png');
}
generateBarrier();

// Dumpster with Street Tag
function generateTrashBin() {
  const w = 36, h = 32;
  const canvas = new PixelBuffer(w, h);

  // Shadow
  canvas.fillRect(2, 27, 32, 5, 10, 10, 20, 120);
  // Wheels
  canvas.fillCircle(6, 28, 2, 30, 30, 35);
  canvas.fillCircle(30, 28, 2, 30, 30, 35);

  // Dumpster body (Industrial dark teal)
  canvas.fillRect(4, 8, 28, 19, 25, 70, 75);
  canvas.fillRect(3, 6, 30, 3, 35, 95, 100);
  canvas.strokeRect(4, 8, 28, 19, 15, 45, 50);

  // Graffiti tag "YANKEE" in hot pink / cyan
  canvas.line(8, 14, 12, 22, 255, 42, 109);
  canvas.line(12, 14, 8, 22, 255, 42, 109);
  canvas.line(15, 14, 18, 22, 5, 217, 232);
  canvas.line(20, 14, 24, 22, 0, 255, 102);

  canvas.save(path.join(__dirname, '..', 'public/assets/props/trash_bin.png'));
  console.log('Generated trash_bin.png');
}
generateTrashBin();

// ---------------------------------------------------------------------
// 5. TILESET (Isometric 2.5D Street Tiles - 128x128)
// ---------------------------------------------------------------------
function generateTileset() {
  const tileSize = 32;
  const canvas = new PixelBuffer(128, 128);

  // Tile 0,0: Asphalt Road (Dark Grey with fine asphalt noise)
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const n = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
      const noise = Math.floor(n * 10);
      canvas.setPixel(x, y, 32 + noise, 35 + noise, 44 + noise);
    }
  }

  // Tile 1,0: Asphalt with Center Yellow Dashed Line
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const n = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
      const noise = Math.floor(n * 10);
      canvas.setPixel(32 + x, y, 32 + noise, 35 + noise, 44 + noise);
    }
  }
  // Dashed yellow line (width 4, length 20)
  canvas.fillRect(32 + 14, 6, 4, 20, 255, 210, 30);

  // Tile 2,0: Neon Crosswalk (Hot magenta / white stripes)
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      canvas.setPixel(64 + x, y, 28, 30, 38);
    }
  }
  for (let stripe = 0; stripe < 3; stripe++) {
    canvas.fillRect(64 + 4 + stripe * 9, 3, 6, 26, 255, 255, 255);
    // Neon spray edge
    canvas.fillRect(64 + 3 + stripe * 9, 3, 1, 26, 255, 42, 109, 160);
    canvas.fillRect(64 + 10 + stripe * 9, 3, 1, 26, 5, 217, 232, 160);
  }

  // Tile 3,0: Concrete Sidewalk Tiles (Paving blocks)
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      canvas.setPixel(96 + x, y, 90, 95, 110);
    }
  }
  // Paver grid lines
  for (let i = 0; i < 32; i++) {
    canvas.setPixel(96 + i, 16, 60, 65, 75);
    canvas.setPixel(96 + 16, i, 60, 65, 75);
    canvas.setPixel(96 + i, 31, 50, 55, 65);
    canvas.setPixel(96 + 31, i, 50, 55, 65);
  }

  // Tile 0,1: Rust Port Iron Plate Flooring (Industrial with rivets)
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      canvas.setPixel(x, 32 + y, 70, 50, 45); // Rust iron
    }
  }
  canvas.strokeRect(1, 33, 30, 30, 100, 75, 65);
  // Rivets in corners
  canvas.fillRect(3, 35, 2, 2, 190, 160, 140);
  canvas.fillRect(27, 35, 2, 2, 190, 160, 140);
  canvas.fillRect(3, 59, 2, 2, 190, 160, 140);
  canvas.fillRect(27, 59, 2, 2, 190, 160, 140);

  // Tile 1,1: Neon Alley Wet Asphalt Puddle (Reflecting green & pink)
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      canvas.setPixel(32 + x, 32 + y, 22, 24, 30);
    }
  }
  // Puddle reflection
  canvas.fillCircle(32 + 16, 32 + 16, 10, 15, 60, 70);
  canvas.fillRect(32 + 10, 32 + 14, 12, 4, 0, 255, 102, 140);
  canvas.fillRect(32 + 8, 32 + 18, 15, 3, 255, 42, 109, 140);

  // Tile 2,1: Apex Ground Zero Free PK Hazard Border (Danger red glow)
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      canvas.setPixel(64 + x, 32 + y, 40, 15, 25);
    }
  }
  canvas.fillRect(64, 32, 32, 4, 255, 42, 109);
  canvas.fillRect(64, 34, 32, 2, 255, 255, 255);
  // Skull / Warning symbol
  canvas.fillRect(64 + 13, 32 + 12, 6, 6, 255, 80, 100);
  canvas.fillRect(64 + 14, 32 + 14, 1, 1, 20, 0, 10);
  canvas.fillRect(64 + 17, 32 + 14, 1, 1, 20, 0, 10);

  // Tile 3,1: Sewer Grate Vent with Steam
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      canvas.setPixel(96 + x, 32 + y, 32, 35, 44);
    }
  }
  canvas.fillRect(96 + 6, 32 + 6, 20, 20, 20, 20, 25);
  for (let g = 0; g < 5; g++) {
    canvas.fillRect(96 + 8, 32 + 8 + g * 3, 16, 1, 80, 85, 95);
  }

  canvas.save(path.join(__dirname, '..', 'public/assets/tiles/tileset_street.png'));
  console.log('Generated tileset_street.png');
}
generateTileset();

// ---------------------------------------------------------------------
// 6. COMBAT VFX & PARTICLES
// ---------------------------------------------------------------------
function generateVFX() {
  // Slash Arc (128x64)
  const slash = new PixelBuffer(128, 64);
  for (let angle = 0; angle < Math.PI * 0.8; angle += 0.02) {
    const r = 40;
    const cx = 30 + Math.cos(angle - 0.4) * r;
    const cy = 32 + Math.sin(angle - 0.4) * (r * 0.6);
    slash.fillCircle(cx, cy, 5, 255, 120, 40, 200);
    slash.fillCircle(cx, cy, 3, 255, 250, 200, 255);
  }
  slash.save(path.join(__dirname, '..', 'public/assets/vfx/vfx_slash.png'));

  // Pierce Thrust Beam (96x32)
  const pierce = new PixelBuffer(96, 32);
  for (let px = 4; px < 88; px++) {
    const width = Math.min((px / 20) * 3, 7);
    pierce.fillRect(px, 16 - width / 2, 2, width, 5, 217, 232, 220);
    pierce.fillRect(px, 16 - 1, 2, 2, 255, 255, 255, 255);
  }
  // Sharp needle tip
  pierce.fillRect(88, 15, 5, 2, 255, 255, 255);
  pierce.save(path.join(__dirname, '..', 'public/assets/vfx/vfx_pierce.png'));

  // Strike Shockwave Ring (64x64)
  const strike = new PixelBuffer(64, 64);
  strike.fillCircle(32, 32, 26, 255, 215, 0, 160);
  strike.fillCircle(32, 32, 22, 0, 0, 0, 0); // Hollow out ring
  strike.fillCircle(32, 32, 14, 255, 255, 255, 200);
  strike.fillCircle(32, 32, 10, 0, 0, 0, 0);
  strike.save(path.join(__dirname, '..', 'public/assets/vfx/vfx_strike.png'));

  // Hit Spark Star (32x32)
  const spark = new PixelBuffer(32, 32);
  spark.fillCircle(16, 16, 4, 255, 255, 255);
  spark.fillRect(15, 2, 2, 28, 255, 230, 100);
  spark.fillRect(2, 15, 28, 2, 255, 230, 100);
  spark.line(6, 6, 26, 26, 255, 180, 50);
  spark.line(6, 26, 26, 6, 255, 180, 50);
  spark.save(path.join(__dirname, '..', 'public/assets/vfx/vfx_hitspark.png'));

  // Spirit Aura Particle (32x32)
  const aura = new PixelBuffer(32, 32);
  for (let r = 14; r > 0; r--) {
    const alpha = Math.floor((1 - r / 14) * 220);
    aura.fillCircle(16, 16, r, 255, 255, 255, alpha);
  }
  aura.save(path.join(__dirname, '..', 'public/assets/vfx/vfx_aura_particle.png'));

  console.log('Generated combat VFX sprites');
}
generateVFX();

// ---------------------------------------------------------------------
// 7. HIGH-FIDELITY STREET-PUNK PORTRAITS (Fallback / Instant Loading)
// ---------------------------------------------------------------------
function generatePixelPortrait(filename, theme, title, hairColor, eyeColor, jacketColor) {
  const w = 128, h = 160;
  const canvas = new PixelBuffer(w, h);

  // Background frame
  canvas.fillRect(0, 0, w, h, 18, 20, 28);
  canvas.strokeRect(2, 2, w - 4, h - 4, theme[0], theme[1], theme[2]);
  canvas.strokeRect(5, 5, w - 10, h - 10, 30, 35, 45);

  // Neon background diagonal glow
  for (let y = 10; y < 140; y += 8) {
    canvas.line(10, y, y, 10, theme[0], theme[1], theme[2], 60);
  }

  // Torso / Shoulders
  canvas.fillRect(24, 100, 80, 50, jacketColor[0], jacketColor[1], jacketColor[2]);
  canvas.strokeRect(24, 100, 80, 50, 10, 10, 15);
  // Collar / Zipper
  canvas.fillRect(61, 95, 6, 50, 255, 215, 0);

  // Neck
  canvas.fillRect(56, 82, 16, 20, 240, 195, 165);

  // Head
  canvas.fillRect(44, 40, 40, 48, 255, 215, 185);
  // Jawline
  canvas.line(44, 80, 64, 90, 210, 165, 135);
  canvas.line(84, 80, 64, 90, 210, 165, 135);

  // Anime Eyes
  canvas.fillRect(50, 58, 8, 8, 20, 20, 30);
  canvas.fillRect(70, 58, 8, 8, 20, 20, 30);
  canvas.fillRect(52, 60, 5, 5, eyeColor[0], eyeColor[1], eyeColor[2]);
  canvas.fillRect(72, 60, 5, 5, eyeColor[0], eyeColor[1], eyeColor[2]);
  canvas.fillRect(53, 61, 2, 2, 255, 255, 255);
  canvas.fillRect(73, 61, 2, 2, 255, 255, 255);

  // Eyebrows
  canvas.fillRect(48, 54, 12, 2, hairColor[0], hairColor[1], hairColor[2]);
  canvas.fillRect(68, 54, 12, 2, hairColor[0], hairColor[1], hairColor[2]);

  // Nose and Lips
  canvas.fillRect(63, 68, 2, 4, 210, 165, 135);
  canvas.fillRect(60, 76, 8, 2, 180, 60, 70);

  // Hair (Spiky / Styled anime hair)
  canvas.fillRect(36, 24, 56, 26, hairColor[0], hairColor[1], hairColor[2]);
  canvas.fillRect(32, 34, 14, 40, hairColor[0], hairColor[1], hairColor[2]);
  canvas.fillRect(82, 34, 14, 40, hairColor[0], hairColor[1], hairColor[2]);
  // Front Bangs
  canvas.fillRect(42, 40, 10, 15, hairColor[0], hairColor[1], hairColor[2]);
  canvas.fillRect(58, 42, 12, 14, hairColor[0], hairColor[1], hairColor[2]);
  canvas.fillRect(74, 40, 10, 15, hairColor[0], hairColor[1], hairColor[2]);

  // Title Plate Banner
  canvas.fillRect(10, 136, 108, 18, 10, 12, 18);
  canvas.strokeRect(10, 136, 108, 18, theme[0], theme[1], theme[2]);

  canvas.save(path.join(__dirname, '..', filename));
  console.log(`Generated portrait: ${filename}`);
}

generatePixelPortrait('public/assets/portraits/miss_poppy.png', [255, 42, 109], 'MISS POPPY', [255, 50, 120], [255, 80, 140], [180, 20, 60]);
generatePixelPortrait('public/assets/portraits/elizabeth.png', [5, 217, 232], 'ELIZABETH', [200, 230, 255], [5, 217, 232], [20, 45, 90]);
generatePixelPortrait('public/assets/portraits/yamato.png', [0, 255, 102], 'YAMATO', [35, 40, 45], [0, 255, 102], [15, 80, 45]);

console.log('All Project Yankee assets generated successfully!');
