const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ensure output directories exist
const spriteDir = path.join(__dirname, '..', 'public', 'assets', 'sprites');
const weaponDir = path.join(spriteDir, 'weapons');
[spriteDir, weaponDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// ---------------------------------------------------------------------
// 1. FAST PNG ENCODER
// ---------------------------------------------------------------------
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

  fillEllipse(cx, cy, rx, ry, r, g, b, a = 255) {
    for (let py = Math.floor(cy - ry); py <= Math.ceil(cy + ry); py++) {
      for (let px = Math.floor(cx - rx); px <= Math.ceil(cx + rx); px++) {
        const dx = (px - cx) / rx;
        const dy = (py - cy) / ry;
        if (dx * dx + dy * dy <= 1.0) {
          this.setPixel(px, py, r, g, b, a);
        }
      }
    }
  }

  drawOutline(x, y, w, h, r, g, b, a = 255) {
    for (let px = x; px < x + w; px++) {
      this.setPixel(px, y, r, g, b, a);
      this.setPixel(px, y + h - 1, r, g, b, a);
    }
    for (let py = y; py < y + h; py++) {
      this.setPixel(x, py, r, g, b, a);
      this.setPixel(x + w - 1, py, r, g, b, a);
    }
  }
}

// ---------------------------------------------------------------------
// 2. CHARACTER DRAWING ROUTINES FOR 7 CORE CLASSES
// ---------------------------------------------------------------------
// Frame width: 64, Frame height: 64
// 6 cols x 8 rows = 384 x 512

function drawShadow(buf, fx, fy) {
  // Ground shadow ellipse: W 26, H 10 centered at (32, 58)
  buf.fillEllipse(fx + 32, fy + 58, 13, 5, 10, 12, 18, 120);
  buf.fillEllipse(fx + 32, fy + 58, 10, 3, 5, 6, 10, 180);
}

function drawVanguard(buf, fx, fy, frameState) {
  drawShadow(buf, fx, fy);
  const bob = frameState.bob || 0;
  const legOffset = frameState.legOffset || 0;
  const armOffset = frameState.armOffset || 0;

  const cy = fy + bob;

  // Legs & Combat Boots (Bulky stance)
  // Left leg
  buf.fillRect(fx + 22, cy + 40, 7, 12 + legOffset, 25, 28, 38);
  buf.fillRect(fx + 21, cy + 50 + legOffset, 9, 6, 60, 40, 30); // Boot
  buf.fillRect(fx + 20, cy + 54 + legOffset, 11, 3, 30, 20, 15); // Sole
  // Right leg
  buf.fillRect(fx + 35, cy + 40, 7, 12 - legOffset, 25, 28, 38);
  buf.fillRect(fx + 34, cy + 50 - legOffset, 9, 6, 60, 40, 30); // Boot
  buf.fillRect(fx + 33, cy + 54 - legOffset, 11, 3, 30, 20, 15); // Sole

  // Long Gakuran Coat (Open in front)
  buf.fillRect(fx + 17, cy + 24, 8, 22, 28, 32, 44); // Coat left side
  buf.fillRect(fx + 39, cy + 24, 7, 22, 28, 32, 44); // Coat right side
  buf.fillRect(fx + 18, cy + 26, 28, 6, 35, 40, 52); // Shoulders

  // Muscular Bare Chest & Gold Chain
  buf.fillRect(fx + 25, cy + 24, 14, 14, 218, 160, 126); // Chest skin
  buf.fillRect(fx + 27, cy + 28, 10, 2, 240, 195, 60);  // Gold chain
  buf.fillRect(fx + 28, cy + 30, 8, 2, 210, 165, 40);   // Chain pendant
  buf.fillRect(fx + 25, cy + 36, 14, 4, 30, 30, 35);    // Leather belt with silver buckle
  buf.fillRect(fx + 30, cy + 36, 4, 4, 200, 200, 210);  // Buckle

  // Head & Buzzcut Hair
  buf.fillRect(fx + 24, cy + 8, 16, 16, 224, 168, 134); // Head
  buf.fillRect(fx + 23, cy + 6, 18, 7, 30, 25, 30);     // Buzzcut hair
  buf.fillRect(fx + 22, cy + 7, 3, 5, 30, 25, 30);      // Sideburns
  // Tough Face (Eyes & Scowl)
  buf.fillRect(fx + 27, cy + 13, 3, 2, 20, 20, 25);     // Left eye
  buf.fillRect(fx + 34, cy + 13, 3, 2, 20, 20, 25);     // Right eye
  buf.fillRect(fx + 26, cy + 11, 5, 2, 25, 20, 20);     // Left brow
  buf.fillRect(fx + 33, cy + 11, 5, 2, 25, 20, 20);     // Right brow
  buf.fillRect(fx + 29, cy + 18, 6, 2, 160, 90, 80);    // Scowl mouth

  // Massive Riot Shield / Metal Scrap Door (Left Hand)
  const sx = fx + 36 + armOffset;
  const sy = cy + 14;
  buf.fillRect(sx, sy, 18, 38, 175, 185, 195);        // Steel plate
  buf.drawOutline(sx, sy, 18, 38, 60, 70, 80);        // Steel frame outline
  buf.fillRect(sx + 3, sy + 3, 12, 5, 40, 50, 60);    // Bulletproof visor slot
  buf.fillRect(sx + 4, sy + 4, 10, 3, 120, 200, 230); // Visor glass tint
  buf.fillRect(sx + 8, sy + 18, 4, 6, 220, 160, 60);  // Door handle
  buf.fillRect(sx + 2, sy + 28, 14, 2, 120, 130, 140);// Welded reinforce bar

  // Right Arm (Clenched fist)
  buf.fillRect(fx + 14, cy + 24, 6, 14, 28, 32, 44);
  buf.fillRect(fx + 13, cy + 36, 7, 7, 218, 160, 126); // Fist
}

function drawBrawler(buf, fx, fy, frameState) {
  drawShadow(buf, fx, fy);
  const bob = frameState.bob || 0;
  const legOffset = frameState.legOffset || 0;
  const armOffset = frameState.armOffset || 0;
  const cy = fy + bob;

  // Athletic Legs & Sneakers
  buf.fillRect(fx + 22, cy + 40, 7, 12 + legOffset, 38, 42, 50);
  buf.fillRect(fx + 21, cy + 40, 2, 12 + legOffset, 220, 40, 60); // Red stripe
  buf.fillRect(fx + 20, cy + 50 + legOffset, 10, 6, 200, 35, 45); // Red sneaker
  buf.fillRect(fx + 19, cy + 54 + legOffset, 12, 3, 240, 240, 240); // White sole

  buf.fillRect(fx + 35, cy + 40, 7, 12 - legOffset, 38, 42, 50);
  buf.fillRect(fx + 41, cy + 40, 2, 12 - legOffset, 220, 40, 60); // Red stripe
  buf.fillRect(fx + 34, cy + 50 - legOffset, 10, 6, 200, 35, 45);
  buf.fillRect(fx + 33, cy + 54 - legOffset, 12, 3, 240, 240, 240);

  // Sukajan Bomber Jacket (Red sleeves, Black torso)
  buf.fillRect(fx + 24, cy + 24, 16, 16, 25, 25, 30);  // Black torso
  buf.fillRect(fx + 27, cy + 24, 10, 12, 180, 150, 120);// Olive/tan shirt inside
  buf.fillRect(fx + 17, cy + 24, 8, 14, 210, 30, 45);  // Red left sleeve
  buf.fillRect(fx + 39, cy + 24, 8, 14, 210, 30, 45);  // Red right sleeve
  buf.fillRect(fx + 16, cy + 34, 6, 4, 240, 240, 240); // White cuff
  buf.fillRect(fx + 42, cy + 34, 6, 4, 240, 240, 240); // White cuff

  // Head & Spiky Mohawk
  buf.fillRect(fx + 25, cy + 9, 14, 15, 228, 172, 138); // Skin
  buf.fillRect(fx + 27, cy + 4, 10, 6, 75, 42, 25);     // Spiky mohawk top
  buf.fillRect(fx + 29, cy + 2, 6, 4, 110, 65, 35);     // Spiky tip
  buf.fillRect(fx + 24, cy + 8, 4, 5, 40, 25, 18);      // Shaved sides

  // Face (Grinning teeth & fierce eyes)
  buf.fillRect(fx + 27, cy + 14, 3, 2, 20, 20, 25);
  buf.fillRect(fx + 34, cy + 14, 3, 2, 20, 20, 25);
  buf.fillRect(fx + 29, cy + 18, 6, 3, 240, 240, 245); // Teeth grin
  buf.drawOutline(fx + 29, cy + 18, 6, 3, 80, 30, 30);

  // Both Fists in Boxing Stance with Brass Knuckles
  const kx1 = fx + 16 - armOffset;
  const ky1 = cy + 28;
  buf.fillRect(kx1, ky1, 7, 7, 228, 172, 138); // Hand
  buf.fillRect(kx1 - 1, ky1 + 2, 3, 6, 210, 215, 225); // Brass knuckle steel bar
  buf.fillRect(kx1 - 2, ky1 + 3, 2, 4, 250, 250, 255); // Spikes

  const kx2 = fx + 41 + armOffset;
  const ky2 = cy + 28;
  buf.fillRect(kx2, ky2, 7, 7, 228, 172, 138);
  buf.fillRect(kx2 + 5, ky2 + 2, 3, 6, 210, 215, 225);
  buf.fillRect(kx2 + 7, ky2 + 3, 2, 4, 250, 250, 255);
}

function drawStriker(buf, fx, fy, frameState) {
  drawShadow(buf, fx, fy);
  const bob = frameState.bob || 0;
  const legOffset = frameState.legOffset || 0;
  const armOffset = frameState.armOffset || 0;
  const cy = fy + bob;

  // Slim Ripped Jeans & Skater Shoes
  buf.fillRect(fx + 23, cy + 40, 6, 12 + legOffset, 30, 34, 45);
  buf.fillRect(fx + 24, cy + 46, 3, 2, 218, 168, 136); // Ripped knee hole
  buf.fillRect(fx + 21, cy + 50 + legOffset, 9, 6, 240, 240, 245); // White skater shoe
  buf.fillRect(fx + 20, cy + 54 + legOffset, 11, 3, 40, 40, 50);

  buf.fillRect(fx + 35, cy + 40, 6, 12 - legOffset, 30, 34, 45);
  buf.fillRect(fx + 36, cy + 47, 3, 2, 218, 168, 136);
  buf.fillRect(fx + 34, cy + 50 - legOffset, 9, 6, 240, 240, 245);
  buf.fillRect(fx + 33, cy + 54 - legOffset, 11, 3, 40, 40, 50);

  // Black Gakuran Jacket with Rolled Up Sleeves & Bandages
  buf.fillRect(fx + 23, cy + 24, 18, 16, 25, 28, 38);  // Torso
  buf.fillRect(fx + 22, cy + 24, 20, 4, 35, 40, 52);   // Collar
  buf.fillRect(fx + 31, cy + 28, 2, 10, 220, 180, 50); // Gold uniform buttons

  // Arms with white bandages
  buf.fillRect(fx + 16, cy + 24, 7, 10, 25, 28, 38);   // Upper arm sleeve
  buf.fillRect(fx + 15, cy + 32, 6, 8, 235, 235, 240); // Forearm bandage
  buf.fillRect(fx + 41, cy + 24, 7, 10, 25, 28, 38);
  buf.fillRect(fx + 42, cy + 32, 6, 8, 235, 235, 240);

  // Head with Fauxhawk & Bandaid on nose
  buf.fillRect(fx + 25, cy + 9, 14, 15, 228, 172, 138);
  buf.fillRect(fx + 26, cy + 5, 12, 6, 45, 30, 25);     // Fauxhawk
  buf.fillRect(fx + 27, cy + 3, 8, 4, 75, 45, 35);
  buf.fillRect(fx + 29, cy + 16, 6, 2, 235, 210, 180);  // White/tan bandaid on nose
  buf.fillRect(fx + 27, cy + 13, 3, 2, 20, 20, 25);
  buf.fillRect(fx + 34, cy + 13, 3, 2, 20, 20, 25);
  buf.fillRect(fx + 30, cy + 19, 5, 2, 140, 60, 60);    // Smirk

  // Baseball Bat held cockily over right shoulder
  const bx = fx + 36 + armOffset;
  const by = cy + 6;
  buf.fillRect(bx, by + 12, 6, 18, 195, 145, 95);      // Wood bat barrel
  buf.fillRect(bx + 1, by + 6, 5, 8, 215, 165, 110);    // Bat tip
  buf.fillRect(bx + 2, by + 28, 3, 8, 230, 230, 235);   // Grip tape
  buf.fillRect(bx + 1, by + 35, 5, 2, 140, 95, 55);     // Knob
}

function drawSharpshooter(buf, fx, fy, frameState) {
  drawShadow(buf, fx, fy);
  const bob = frameState.bob || 0;
  const legOffset = frameState.legOffset || 0;
  const armOffset = frameState.armOffset || 0;
  const cy = fy + bob;

  // Baggy Olive Cargo Pants & Tan Sneakers
  buf.fillRect(fx + 22, cy + 40, 8, 12 + legOffset, 75, 85, 60);
  buf.fillRect(fx + 20, cy + 44, 3, 5, 60, 70, 50); // Pocket
  buf.fillRect(fx + 20, cy + 51 + legOffset, 10, 5, 210, 190, 160);
  buf.fillRect(fx + 19, cy + 54 + legOffset, 12, 3, 240, 240, 240);

  buf.fillRect(fx + 34, cy + 40, 8, 12 - legOffset, 75, 85, 60);
  buf.fillRect(fx + 41, cy + 44, 3, 5, 60, 70, 50); // Pocket
  buf.fillRect(fx + 34, cy + 51 - legOffset, 10, 5, 210, 190, 160);
  buf.fillRect(fx + 33, cy + 54 - legOffset, 12, 3, 240, 240, 240);

  // Green Hoodie Sweatshirt
  buf.fillRect(fx + 23, cy + 24, 18, 16, 45, 120, 65);  // Hoodie body
  buf.fillRect(fx + 25, cy + 30, 14, 8, 35, 105, 55);   // Front pouch pocket
  buf.fillRect(fx + 21, cy + 21, 22, 5, 35, 95, 50);    // Hood rim around neck
  buf.fillRect(fx + 29, cy + 24, 1, 6, 240, 240, 240);  // Hoodie string
  buf.fillRect(fx + 33, cy + 24, 1, 6, 240, 240, 240);

  // Ammo Pouch on Belt
  buf.fillRect(fx + 19, cy + 36, 5, 6, 120, 80, 45);    // Leather pouch

  // Head with Shaggy Bob Hair & Focused Gaze
  buf.fillRect(fx + 25, cy + 9, 14, 14, 228, 172, 138);
  buf.fillRect(fx + 22, cy + 6, 20, 10, 110, 65, 40);   // Shaggy hair
  buf.fillRect(fx + 21, cy + 12, 4, 8, 90, 50, 30);     // Side bangs
  buf.fillRect(fx + 39, cy + 12, 4, 8, 90, 50, 30);
  buf.fillRect(fx + 28, cy + 13, 4, 2, 20, 20, 25);     // Squinting aiming eye
  buf.fillRect(fx + 35, cy + 13, 3, 2, 20, 20, 25);
  buf.fillRect(fx + 30, cy + 18, 4, 2, 160, 80, 80);

  // Heavy Wooden Slingshot & Aiming Arms
  const slx = fx + 36 + armOffset;
  const sly = cy + 22;
  // Slingshot Y frame
  buf.fillRect(slx + 4, sly + 6, 4, 10, 135, 85, 45);   // Handle
  buf.fillRect(slx + 2, sly + 1, 3, 6, 135, 85, 45);    // Left fork
  buf.fillRect(slx + 7, sly + 1, 3, 6, 135, 85, 45);    // Right fork
  // Stretched Rubber Bands
  buf.fillRect(slx - 4, sly + 2, 7, 2, 200, 170, 70);   // Band
  buf.fillRect(slx - 5, sly + 2, 2, 2, 180, 50, 50);    // Leather projectile pouch
}

function drawSupplier(buf, fx, fy, frameState) {
  drawShadow(buf, fx, fy);
  const bob = frameState.bob || 0;
  const legOffset = frameState.legOffset || 0;
  const armOffset = frameState.armOffset || 0;
  const cy = fy + bob;

  // Gakuran Pants & Loafers
  buf.fillRect(fx + 24, cy + 40, 6, 12 + legOffset, 28, 32, 44);
  buf.fillRect(fx + 22, cy + 51 + legOffset, 9, 5, 80, 50, 35); // Brown loafer
  buf.fillRect(fx + 21, cy + 54 + legOffset, 11, 3, 40, 25, 15);

  buf.fillRect(fx + 34, cy + 40, 6, 12 - legOffset, 28, 32, 44);
  buf.fillRect(fx + 33, cy + 51 - legOffset, 9, 5, 80, 50, 35);
  buf.fillRect(fx + 32, cy + 54 - legOffset, 11, 3, 40, 25, 15);

  // Tactical Backpack (Behind Back)
  buf.fillRect(fx + 13, cy + 14, 12, 24, 75, 95, 65);  // Big olive pack
  buf.fillRect(fx + 12, cy + 11, 14, 5, 55, 75, 50);   // Top bedroll
  buf.fillRect(fx + 11, cy + 22, 3, 8, 120, 140, 100); // Side pouch

  // Gakuran Uniform with Red Cross Armband
  buf.fillRect(fx + 23, cy + 24, 18, 16, 28, 32, 44);
  buf.fillRect(fx + 18, cy + 24, 6, 14, 28, 32, 44);   // Left sleeve
  // Red Cross Armband on right arm
  buf.fillRect(fx + 39, cy + 24, 6, 14, 28, 32, 44);
  buf.fillRect(fx + 39, cy + 27, 6, 6, 245, 245, 245);  // White band
  buf.fillRect(fx + 41, cy + 28, 2, 4, 220, 30, 40);   // Red cross vert
  buf.fillRect(fx + 40, cy + 29, 4, 2, 220, 30, 40);   // Red cross horiz

  // Head & Schoolboy Hair
  buf.fillRect(fx + 25, cy + 9, 14, 14, 228, 172, 138);
  buf.fillRect(fx + 23, cy + 5, 18, 8, 85, 50, 35);    // Brown hair
  buf.fillRect(fx + 24, cy + 12, 4, 5, 75, 42, 25);
  buf.fillRect(fx + 27, cy + 13, 3, 2, 20, 20, 25);
  buf.fillRect(fx + 34, cy + 13, 3, 2, 20, 20, 25);
  buf.fillRect(fx + 29, cy + 18, 6, 2, 160, 90, 80);

  // First-Aid Medkit Box in Hand (Right)
  const mx = fx + 42 + armOffset;
  const my = cy + 34;
  buf.fillRect(mx, my, 12, 10, 240, 240, 245);          // White box
  buf.drawOutline(mx, my, 12, 10, 160, 165, 175);
  buf.fillRect(mx + 4, my - 2, 4, 3, 100, 105, 115);    // Handle
  buf.fillRect(mx + 5, my + 3, 2, 4, 220, 30, 40);      // Red cross
  buf.fillRect(mx + 4, my + 4, 4, 2, 220, 30, 40);

  // Spray Tonic Bottle (Left Hand)
  buf.fillRect(fx + 16, cy + 34, 5, 8, 100, 200, 240);  // Cyan bottle
  buf.fillRect(fx + 17, cy + 32, 3, 3, 220, 220, 220);  // Spray nozzle
}

function drawInstigator(buf, fx, fy, frameState) {
  drawShadow(buf, fx, fy);
  const bob = frameState.bob || 0;
  const legOffset = frameState.legOffset || 0;
  const armOffset = frameState.armOffset || 0;
  const cy = fy + bob;

  // Dark Pants with Silver Wallet Chain & Red Sneakers
  buf.fillRect(fx + 23, cy + 40, 7, 12 + legOffset, 32, 36, 46);
  buf.fillRect(fx + 21, cy + 50 + legOffset, 9, 6, 210, 35, 45); // Red shoe
  buf.fillRect(fx + 20, cy + 54 + legOffset, 11, 3, 240, 240, 240);

  buf.fillRect(fx + 34, cy + 40, 7, 12 - legOffset, 32, 36, 46);
  buf.fillRect(fx + 34, cy + 50 - legOffset, 9, 6, 210, 35, 45);
  buf.fillRect(fx + 33, cy + 54 - legOffset, 11, 3, 240, 240, 240);

  // Silver wallet chain on hip
  buf.fillRect(fx + 23, cy + 38, 5, 2, 200, 200, 215);

  // Sukajan Jacket with Golden Dragon Emblem
  buf.fillRect(fx + 23, cy + 24, 18, 16, 240, 235, 220); // Cream satin front
  buf.fillRect(fx + 27, cy + 27, 8, 8, 220, 160, 40);    // Gold dragon embroidery
  buf.fillRect(fx + 16, cy + 24, 7, 14, 25, 40, 75);     // Navy sleeve
  buf.fillRect(fx + 41, cy + 24, 7, 14, 25, 40, 75);     // Navy sleeve

  // Head with White Hachimaki Headband & Shouting Mouth
  buf.fillRect(fx + 25, cy + 9, 14, 15, 228, 172, 138);
  buf.fillRect(fx + 24, cy + 5, 16, 7, 95, 55, 35);      // Brown spiky hair
  buf.fillRect(fx + 23, cy + 10, 18, 3, 245, 245, 250);  // White headband
  buf.fillRect(fx + 21, cy + 11, 3, 6, 245, 245, 250);   // Headband ribbon tie
  buf.fillRect(fx + 27, cy + 14, 3, 2, 20, 20, 25);
  buf.fillRect(fx + 34, cy + 14, 3, 2, 20, 20, 25);
  buf.fillRect(fx + 28, cy + 17, 8, 5, 60, 20, 20);      // Wide open shouting mouth
  buf.fillRect(fx + 30, cy + 19, 4, 3, 200, 70, 70);     // Tongue

  // Vintage Megaphone (Bullhorn) held to mouth
  const mx = fx + 38 + armOffset;
  const my = cy + 15;
  buf.fillRect(mx, my + 3, 5, 6, 200, 30, 40);           // Red horn base
  buf.fillRect(mx + 5, my + 1, 9, 10, 240, 240, 245);    // White flare cone
  buf.drawOutline(mx + 5, my + 1, 9, 10, 180, 185, 195);
  buf.fillRect(mx + 2, my + 9, 3, 5, 40, 40, 45);        // Handle
  // Sound blast rings
  buf.fillRect(mx + 15, my + 3, 2, 6, 255, 220, 50, 180);
}

function drawSaboteur(buf, fx, fy, frameState) {
  drawShadow(buf, fx, fy);
  const bob = frameState.bob || 0;
  const armOffset = frameState.armOffset || 0;
  const cy = fy + bob;

  // Crouching Low Stance
  buf.fillRect(fx + 20, cy + 44, 9, 8, 30, 34, 45);      // Bent left leg
  buf.fillRect(fx + 18, cy + 50, 9, 6, 45, 45, 55);      // Boot
  buf.fillRect(fx + 33, cy + 42, 10, 10, 30, 34, 45);    // Kneeling right leg
  buf.fillRect(fx + 35, cy + 50, 8, 6, 45, 45, 55);

  // Dark Uniform with Tool Belt & Pouches
  buf.fillRect(fx + 22, cy + 26, 18, 16, 25, 28, 38);
  buf.fillRect(fx + 21, cy + 36, 20, 4, 110, 70, 40);    // Leather utility belt
  buf.fillRect(fx + 17, cy + 35, 5, 7, 130, 85, 50);     // Side pouch
  buf.fillRect(fx + 40, cy + 35, 5, 7, 130, 85, 50);     // Tool pouch
  buf.fillRect(fx + 20, cy + 33, 2, 5, 190, 195, 205);   // Screwdriver handle

  // Head with Disheveled Anime Hair & Cunning Smile
  buf.fillRect(fx + 24, cy + 12, 14, 14, 228, 172, 138);
  buf.fillRect(fx + 22, cy + 8, 18, 9, 35, 38, 55);      // Dark navy hair
  buf.fillRect(fx + 25, cy + 14, 3, 4, 35, 38, 55);      // Bangs over eye
  buf.fillRect(fx + 28, cy + 16, 3, 2, 20, 20, 25);
  buf.fillRect(fx + 35, cy + 16, 3, 2, 20, 20, 25);
  buf.fillRect(fx + 30, cy + 21, 5, 2, 150, 70, 70);     // Cunning grin

  // Hands Laying Coiled Steel Wire Trap
  const wx = fx + 34 + armOffset;
  const wy = cy + 44;
  buf.fillRect(wx - 4, wy - 4, 6, 5, 228, 172, 138);     // Hand
  // Steel wire loops
  buf.fillRect(wx, wy, 16, 2, 180, 185, 195);
  buf.fillRect(wx + 2, wy + 2, 12, 2, 90, 95, 105);
  buf.fillRect(wx - 2, wy + 4, 16, 2, 180, 185, 195);
  buf.fillRect(wx + 4, wy + 6, 8, 2, 220, 140, 40);      // Warning tag / trigger
}

// ---------------------------------------------------------------------
// 3. GENERATE FULL 384x512 ANIMATED SPRITESHEET FOR A CLASS
// ---------------------------------------------------------------------
function generateClassSpritesheet(classId, drawFn) {
  const sheetW = 384; // 6 frames * 64
  const sheetH = 512; // 8 rows * 64
  const buf = new PixelBuffer(sheetW, sheetH);

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 6; col++) {
      const fx = col * 64;
      const fy = row * 64;

      let frameState = { bob: 0, legOffset: 0, armOffset: 0 };

      // Row 0: Idle (frames 0 to 3 used)
      if (row === 0) {
        if (col === 1) frameState.bob = 1;
        if (col === 2) frameState.bob = 2;
        if (col === 3) frameState.bob = 1;
      }
      // Row 1: Walk (frames 6 to 11)
      else if (row === 1) {
        const t = (col / 6) * Math.PI * 2;
        frameState.bob = Math.round(Math.abs(Math.sin(t)) * 2);
        frameState.legOffset = Math.round(Math.sin(t) * 4);
        frameState.armOffset = Math.round(Math.cos(t) * 3);
      }
      // Row 2: Run (frames 12 to 17)
      else if (row === 2) {
        const t = (col / 6) * Math.PI * 2;
        frameState.bob = Math.round(Math.abs(Math.sin(t)) * 3);
        frameState.legOffset = Math.round(Math.sin(t) * 6);
        frameState.armOffset = Math.round(Math.cos(t) * 5);
      }
      // Row 3: Attack 1 (frames 18 to 23)
      else if (row === 3) {
        if (col === 0) frameState.armOffset = -3; // Wind up
        if (col === 1) frameState.armOffset = 6;  // Strike forward
        if (col === 2) frameState.armOffset = 8;  // Follow through
        if (col === 3) frameState.armOffset = 4;
        if (col >= 4) frameState.armOffset = 0;
      }
      // Row 4: Attack 2 (frames 24 to 29)
      else if (row === 4) {
        if (col === 0) frameState.armOffset = -4;
        if (col === 1) frameState.armOffset = 7;
        if (col === 2) frameState.armOffset = 9;
        if (col === 3) frameState.armOffset = 3;
      }
      // Row 5: Attack 3 Heavy (frames 30 to 35)
      else if (row === 5) {
        if (col === 0) { frameState.bob = -3; frameState.armOffset = -6; } // High wind up
        if (col === 1) { frameState.bob = 2; frameState.armOffset = 10; }  // Slam down
        if (col === 2) { frameState.bob = 3; frameState.armOffset = 12; }
        if (col === 3) { frameState.bob = 1; frameState.armOffset = 4; }
      }
      // Row 6: Dash (frames 36 to 41)
      else if (row === 6) {
        frameState.bob = 2;
        frameState.legOffset = 5;
        frameState.armOffset = 8;
      }
      // Row 7: Hurt (frames 42 to 47)
      else if (row === 7) {
        frameState.bob = 2;
        frameState.armOffset = -4;
      }

      drawFn(buf, fx, fy, frameState);
    }
  }

  const pngData = encodePNG(sheetW, sheetH, buf.rgba);
  const outPath = path.join(spriteDir, `${classId}.png`);
  fs.writeFileSync(outPath, pngData);
  console.log(`Generated class spritesheet: ${outPath} (${sheetW}x${sheetH})`);
}

// ---------------------------------------------------------------------
// 4. GENERATE STANDALONE MODULAR WEAPONS (64x64)
// ---------------------------------------------------------------------
function generateWeapon(name, drawFn) {
  const buf = new PixelBuffer(64, 64);
  drawFn(buf, 0, 0);
  const pngData = encodePNG(64, 64, buf.rgba);
  const outPath = path.join(weaponDir, `${name}.png`);
  fs.writeFileSync(outPath, pngData);
  console.log(`Generated modular weapon: ${outPath}`);
}

// EXECUTE GENERATION
console.log('--- Generating 7 Core Class 64x64 Spritesheets ---');

generateClassSpritesheet('class_vanguard', drawVanguard);
generateClassSpritesheet('class_brawler', drawBrawler);
generateClassSpritesheet('class_striker', drawStriker);
generateClassSpritesheet('class_sharpshooter', drawSharpshooter);
generateClassSpritesheet('class_supplier', drawSupplier);
generateClassSpritesheet('class_instigator', drawInstigator);
generateClassSpritesheet('class_saboteur', drawSaboteur);

console.log('--- Generating Modular Weapon Sprites ---');
// 1. Riot Shield
generateWeapon('weapon_riot_shield', (buf) => {
  buf.fillRect(20, 14, 24, 38, 175, 185, 195);
  buf.drawOutline(20, 14, 24, 38, 60, 70, 80);
  buf.fillRect(24, 18, 16, 5, 40, 50, 60);
  buf.fillRect(25, 19, 14, 3, 120, 200, 230);
  buf.fillRect(30, 32, 4, 8, 220, 160, 60);
});

// 2. Brass Knuckles
generateWeapon('weapon_brass_knuckles', (buf) => {
  buf.fillRect(22, 26, 20, 12, 215, 220, 230);
  buf.drawOutline(22, 26, 20, 12, 80, 85, 95);
  buf.fillRect(25, 29, 4, 6, 0, 0, 0, 0); // Finger holes
  buf.fillRect(31, 29, 4, 6, 0, 0, 0, 0);
  buf.fillRect(24, 23, 3, 3, 255, 255, 255); // Spikes
  buf.fillRect(30, 23, 3, 3, 255, 255, 255);
  buf.fillRect(36, 23, 3, 3, 255, 255, 255);
});

// 3. Baseball Bat
generateWeapon('weapon_baseball_bat', (buf) => {
  buf.fillRect(20, 16, 24, 8, 200, 150, 95);
  buf.fillRect(36, 15, 12, 10, 220, 170, 110);
  buf.fillRect(14, 18, 8, 4, 240, 240, 245); // Grip tape
  buf.fillRect(11, 17, 3, 6, 140, 95, 55);    // Knob
});

// 4. Slingshot
generateWeapon('weapon_slingshot', (buf) => {
  buf.fillRect(28, 30, 8, 16, 135, 85, 45); // Handle
  buf.fillRect(24, 18, 6, 14, 135, 85, 45); // Left fork
  buf.fillRect(34, 18, 6, 14, 135, 85, 45); // Right fork
  buf.fillRect(18, 22, 14, 2, 210, 180, 80); // Rubber band
  buf.fillRect(32, 22, 14, 2, 210, 180, 80);
});

// 5. Medical Kit & Spray
generateWeapon('weapon_medkit', (buf) => {
  buf.fillRect(16, 22, 22, 18, 245, 245, 250); // White case
  buf.drawOutline(16, 22, 22, 18, 140, 145, 155);
  buf.fillRect(23, 19, 8, 3, 90, 95, 105);     // Handle
  buf.fillRect(25, 26, 4, 10, 220, 30, 40);    // Red cross
  buf.fillRect(22, 29, 10, 4, 220, 30, 40);
  buf.fillRect(42, 26, 8, 14, 100, 200, 240);  // Spray tonic
  buf.fillRect(44, 22, 4, 4, 220, 220, 220);
});

// 6. Megaphone
generateWeapon('weapon_megaphone', (buf) => {
  buf.fillRect(18, 28, 8, 8, 200, 30, 40);    // Red base
  buf.fillRect(26, 22, 18, 20, 240, 240, 245);// White cone flare
  buf.drawOutline(26, 22, 18, 20, 160, 165, 175);
  buf.fillRect(20, 36, 4, 8, 40, 40, 45);     // Grip
  buf.fillRect(46, 26, 4, 12, 255, 220, 50);  // Sound wave
});

// 7. Wire Trap
generateWeapon('weapon_wiretrap', (buf) => {
  buf.fillRect(16, 28, 32, 3, 180, 185, 195); // Steel cable
  buf.fillRect(20, 34, 24, 3, 100, 105, 115);
  buf.fillRect(14, 40, 36, 3, 180, 185, 195);
  buf.fillRect(30, 24, 6, 6, 220, 140, 40);   // Tension trigger box
});

console.log('All 7 class spritesheets and weapons generated successfully!');

