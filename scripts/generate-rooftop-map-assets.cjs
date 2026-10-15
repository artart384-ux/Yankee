const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Ensure output directories exist
const dirs = ['public/assets/tiles', 'public/assets/props', 'public/assets/maps'];
dirs.forEach(d => {
  const p = path.join(__dirname, '..', d);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// ---------------------------------------------------------------------
// 1. FAST PNG ENCODER & DECODER
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

  save(filePath) {
    const png = encodePNG(this.width, this.height, this.rgba);
    fs.writeFileSync(filePath, png);
  }
}

// ---------------------------------------------------------------------
// 2. WEATHERED ROOFTOP CONCRETE TILESET (256x256)
// Overcast late afternoon sunset muted colors: concrete grays, rust stains
// ---------------------------------------------------------------------
function generateRooftopConcrete() {
  const size = 256;
  const canvas = new PixelBuffer(size, size);

  // Concrete base with noise and subtle sunset orange/warm gray undertone
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const noise = Math.floor(Math.sin(x * 0.15) * 8 + Math.cos(y * 0.15) * 8 + Math.random() * 12);
      // Muted overcast cement with late afternoon warmth: R: 75, G: 72, B: 74
      const r = Math.max(0, Math.min(255, 76 + noise));
      const g = Math.max(0, Math.min(255, 72 + noise));
      const b = Math.max(0, Math.min(255, 74 + noise));
      canvas.setPixel(x, y, r, g, b);
    }
  }

  // Expansion joint grid (64x64 slabs with dark tar filler)
  for (let c = 0; c <= size; c += 64) {
    for (let y = 0; y < size; y++) {
      canvas.setPixel(c, y, 32, 30, 34);
      canvas.setPixel(c + 1, y, 22, 20, 24);
      canvas.setPixel(c - 1, y, 92, 88, 90); // Highlight edge
    }
    for (let x = 0; x < size; x++) {
      canvas.setPixel(x, c, 32, 30, 34);
      canvas.setPixel(x, c + 1, 22, 20, 24);
      canvas.setPixel(x, c - 1, 92, 88, 90);
    }
  }

  // Concrete cracks & weathered patches
  const cracks = [
    [[20, 30], [35, 45], [42, 60]],
    [[140, 80], [155, 95], [170, 92], [185, 110]],
    [[80, 180], [95, 195], [110, 215]],
    [[200, 190], [215, 205], [230, 220]]
  ];
  cracks.forEach(pts => {
    for (let i = 0; i < pts.length - 1; i++) {
      canvas.line(pts[i][0], pts[i][1], pts[i+1][0], pts[i+1][1], 25, 23, 26);
    }
  });

  // Water stain patches & dark moss
  canvas.fillCircle(110, 110, 24, 52, 50, 56, 120);
  canvas.fillCircle(180, 50, 18, 55, 52, 58, 100);
  canvas.fillCircle(40, 200, 22, 50, 48, 54, 110);

  canvas.save(path.join(__dirname, '../public/assets/tiles/tileset_rooftop_concrete.png'));
  console.log('Generated tileset_rooftop_concrete.png');
}
generateRooftopConcrete();

// ---------------------------------------------------------------------
// 3. RUSTED CHAIN-LINK FENCE WITH BARBED WIRE (96x80)
// Iconic Japanese delinquent school rooftop fence with long shadow
// ---------------------------------------------------------------------
function generateChainlinkFence() {
  const w = 96, h = 80;
  const canvas = new PixelBuffer(w, h);

  // Cast diagonal sunset shadow on ground
  for (let sx = 0; sx < w; sx++) {
    for (let sy = 68; sy < h; sy++) {
      if ((sx + sy) % 3 === 0) {
        canvas.setPixel(sx, sy, 15, 12, 18, 110);
      }
    }
  }

  // Horizontal steel pipes (top rail, mid rail, bottom rail)
  canvas.fillRect(0, 16, w, 4, 110, 75, 55); // Top rail (rusted steel)
  canvas.fillRect(0, 17, w, 2, 145, 95, 70); // Highlight
  canvas.fillRect(0, 42, w, 3, 100, 70, 50); // Mid rail
  canvas.fillRect(0, 68, w, 4, 90, 65, 45); // Bottom rail

  // Vertical support posts with steel caps
  const posts = [0, 46, 92];
  posts.forEach(px => {
    canvas.fillRect(px, 10, 5, 62, 85, 60, 45);
    canvas.fillRect(px + 1, 10, 2, 62, 120, 85, 65);
    // Post cap
    canvas.fillRect(px - 1, 8, 7, 3, 130, 90, 68);
  });

  // Chain-link diamond mesh pattern
  for (let y = 19; y < 68; y += 4) {
    for (let x = 0; x < w; x += 4) {
      if ((x + y) % 4 === 0) {
        canvas.setPixel(x, y, 120, 95, 75);
        canvas.setPixel(x + 1, y, 70, 50, 40);
      }
    }
  }

  // Barbed wire spirals on top of fence (angled out)
  for (let bx = 2; bx < w - 2; bx += 8) {
    // Spiral loop
    canvas.fillCircle(bx + 3, 9, 5, 140, 100, 80, 200);
    canvas.fillCircle(bx + 3, 9, 3, 0, 0, 0, 0); // Hole in loop
    // Sharp barbs
    canvas.line(bx, 12, bx + 6, 6, 190, 150, 110);
    canvas.line(bx, 6, bx + 6, 12, 190, 150, 110);
  }

  canvas.save(path.join(__dirname, '../public/assets/props/prop_chainlink_fence.png'));
  console.log('Generated prop_chainlink_fence.png');
}
generateChainlinkFence();

// ---------------------------------------------------------------------
// 4. PILES OF BROKEN SCHOOL DESKS AND CHAIRS (128x80)
// Iconic Serizawa / Crows Zero throne & delinquent barricade
// ---------------------------------------------------------------------
function generateBrokenDeskPile() {
  const w = 128, h = 80;
  const canvas = new PixelBuffer(w, h);

  // Ground shadow
  canvas.fillCircle(64, 72, 48, 12, 10, 16, 160);

  // Overturned school desks (wooden tops + tubular steel frames)
  // Desk 1 (Left tilted)
  canvas.fillRect(16, 42, 38, 14, 185, 130, 80);
  canvas.strokeRect(16, 42, 38, 14, 110, 75, 45);
  canvas.line(18, 56, 12, 74, 70, 75, 85); // Bent leg
  canvas.line(48, 56, 52, 74, 70, 75, 85);

  // Desk 2 (Center stack, base)
  canvas.fillRect(44, 46, 46, 15, 175, 125, 75);
  canvas.strokeRect(44, 46, 46, 15, 100, 70, 40);
  canvas.line(46, 61, 44, 74, 65, 70, 80);
  canvas.line(86, 61, 88, 74, 65, 70, 80);

  // Desk 3 (Right tilted)
  canvas.fillRect(78, 38, 36, 13, 190, 135, 85);
  canvas.strokeRect(78, 38, 36, 13, 110, 75, 45);
  canvas.line(80, 51, 76, 72, 70, 75, 85);
  canvas.line(110, 51, 114, 72, 70, 75, 85);

  // Stacked desks on top (forming the throne/barricade)
  canvas.fillRect(36, 26, 42, 13, 165, 115, 70);
  canvas.strokeRect(36, 26, 42, 13, 95, 65, 38);
  canvas.fillRect(52, 12, 36, 12, 180, 128, 78);
  canvas.strokeRect(52, 12, 36, 12, 105, 72, 42);

  // Overturned wooden classroom chairs with curved steel backs
  // Chair 1 (perched on top like throne backrest)
  canvas.fillRect(60, 2, 20, 10, 160, 110, 65);
  canvas.line(58, 4, 58, 22, 60, 65, 75);
  canvas.line(81, 4, 81, 22, 60, 65, 75);

  // Chair 2 (fallen sideways on left)
  canvas.fillRect(8, 52, 12, 18, 150, 105, 60);
  canvas.line(10, 70, 4, 76, 60, 65, 75);

  // Chair 3 (scattered on right)
  canvas.fillRect(106, 56, 14, 14, 155, 108, 62);
  canvas.line(118, 70, 124, 76, 60, 65, 75);

  // Graffiti and scratch marks on desk tops
  canvas.line(48, 32, 68, 32, 255, 42, 109); // Pink graffiti tag
  canvas.line(56, 17, 72, 17, 5, 217, 232); // Cyan scratch

  canvas.save(path.join(__dirname, '../public/assets/props/prop_broken_desk_pile.png'));
  console.log('Generated prop_broken_desk_pile.png');
}
generateBrokenDeskPile();

// ---------------------------------------------------------------------
// 5. RUSTED OIL DRUM WITH FIRE (48x64)
// Delinquent gathering warmth spot with glowing fire embers
// ---------------------------------------------------------------------
function generateOilDrumFire() {
  const w = 48, h = 64;
  const canvas = new PixelBuffer(w, h);

  // Shadow
  canvas.fillCircle(24, 58, 16, 12, 10, 16, 160);

  // 55-Gallon Steel Drum Cylinder
  // Base body (Rust orange-brown with dark crevices)
  canvas.fillRect(12, 22, 24, 36, 115, 65, 45);
  canvas.strokeRect(12, 22, 24, 36, 75, 40, 28);

  // Embossed ribs/hoops on oil drum
  canvas.fillRect(11, 28, 26, 3, 140, 80, 55);
  canvas.fillRect(11, 42, 26, 3, 140, 80, 55);
  canvas.fillRect(11, 29, 26, 1, 180, 110, 75); // Highlight

  // Rust stains and bullet/hole punctures
  canvas.fillRect(18, 35, 3, 3, 35, 20, 15);
  canvas.fillRect(27, 48, 2, 2, 35, 20, 15);
  canvas.fillRect(20, 36, 1, 1, 255, 120, 20); // Glowing ember peek from hole!

  // Top drum rim
  canvas.fillRect(11, 20, 26, 4, 150, 90, 60);

  // Roaring delinquent fire inside drum!
  // Inner coal glow
  canvas.fillCircle(24, 18, 10, 255, 80, 0, 240);
  canvas.fillCircle(24, 17, 7, 255, 160, 20, 255);
  canvas.fillCircle(24, 15, 4, 255, 240, 120, 255);

  // Flame tongues licking upward
  canvas.line(22, 18, 20, 6, 255, 100, 0);
  canvas.line(24, 16, 25, 4, 255, 200, 30);
  canvas.line(26, 17, 28, 7, 255, 80, 0);
  canvas.setPixel(25, 3, 255, 255, 200);

  // Floating fire embers in the evening air
  canvas.setPixel(18, 4, 255, 140, 30, 220);
  canvas.setPixel(30, 2, 255, 180, 50, 200);
  canvas.setPixel(23, -1, 255, 100, 0, 180);

  canvas.save(path.join(__dirname, '../public/assets/props/prop_oil_drum_fire.png'));
  console.log('Generated prop_oil_drum_fire.png');
}
generateOilDrumFire();

// ---------------------------------------------------------------------
// 6. ROOFTOP STAIRWELL ACCESS DOOR SHACK (128x128)
// Weathered concrete penthouse with metal heavy door and rooftop vents
// ---------------------------------------------------------------------
function generateRooftopDoorHut() {
  const w = 128, h = 128;
  const canvas = new PixelBuffer(w, h);

  // Ground shadow
  canvas.fillRect(16, 116, 96, 10, 12, 10, 16, 160);

  // Main Concrete Building Block
  canvas.fillRect(20, 24, 88, 96, 85, 80, 84);
  canvas.strokeRect(20, 24, 88, 96, 45, 40, 44);

  // Rooftop parapet coping on top of hut
  canvas.fillRect(16, 20, 96, 6, 110, 105, 110);
  canvas.strokeRect(16, 20, 96, 6, 55, 50, 55);

  // Heavy Industrial Steel Door
  canvas.fillRect(44, 48, 40, 72, 70, 75, 85);
  canvas.strokeRect(44, 48, 40, 72, 35, 38, 45);

  // Door panels and steel rivets
  canvas.fillRect(48, 54, 32, 28, 55, 60, 70);
  canvas.fillRect(48, 86, 32, 30, 55, 60, 70);
  // Heavy latch / door handle
  canvas.fillRect(48, 80, 8, 4, 180, 185, 195);
  canvas.fillRect(52, 80, 3, 10, 180, 185, 195);

  // Rooftop Exhaust Vent / Fan Housing on top
  canvas.fillRect(32, 6, 24, 15, 120, 80, 55); // Rusted vent box
  canvas.strokeRect(32, 6, 24, 15, 75, 45, 30);
  // Vent louvers
  for (let ly = 9; ly < 19; ly += 3) {
    canvas.line(34, ly, 53, ly, 40, 25, 18);
  }

  // Electrical Conduit Pipe & Junction Box
  canvas.fillRect(92, 40, 12, 14, 125, 130, 140);
  canvas.strokeRect(92, 40, 12, 14, 60, 65, 75);
  canvas.fillRect(96, 54, 4, 66, 85, 90, 100); // Conduit pipe running down

  // Wild Delinquent Graffiti across the concrete wall!
  // "CROWS" in vibrant spraypaint
  canvas.line(26, 40, 38, 40, 255, 42, 109);
  canvas.line(26, 40, 26, 52, 255, 42, 109);
  canvas.line(26, 52, 38, 52, 255, 42, 109);

  // Yellow spraypaint lightning bolt
  canvas.line(32, 60, 28, 70, 255, 220, 0);
  canvas.line(28, 70, 36, 68, 255, 220, 0);
  canvas.line(36, 68, 30, 80, 255, 220, 0);

  // "100%" spray tag on right side
  canvas.line(90, 75, 104, 75, 5, 217, 232);
  canvas.line(97, 75, 97, 90, 5, 217, 232);

  canvas.save(path.join(__dirname, '../public/assets/props/prop_rooftop_door_hut.png'));
  console.log('Generated prop_rooftop_door_hut.png');
}
generateRooftopDoorHut();

// ---------------------------------------------------------------------
// 7. CONCRETE GRAFFITI PARAPET WALL (160x64)
// High school perimeter wall covered in Crows Zero / delinquent tags
// ---------------------------------------------------------------------
function generateGraffitiWall() {
  const w = 160, h = 64;
  const canvas = new PixelBuffer(w, h);

  // Cast long sunset shadow
  canvas.fillRect(0, 54, w, 10, 15, 12, 18, 140);

  // Main Concrete Wall Body
  canvas.fillRect(0, 8, w, 48, 80, 76, 80);
  canvas.strokeRect(0, 8, w, 48, 40, 36, 40);

  // Coping ledge at top
  canvas.fillRect(0, 4, w, 6, 115, 110, 115);
  canvas.fillRect(0, 4, w, 1, 155, 150, 155); // Top sun highlight

  // Rain drip streaks & dark grime running down
  for (let x = 12; x < w; x += 18) {
    const len = 12 + (x * 7) % 24;
    canvas.fillRect(x, 10, 2, len, 50, 46, 52, 160);
  }

  // Messy Overlapping Graffiti:
  // 1. "SUZURAN" in bold red bubble letters
  canvas.line(16, 20, 34, 20, 255, 30, 60);
  canvas.line(16, 20, 16, 28, 255, 30, 60);
  canvas.line(16, 28, 34, 28, 255, 30, 60);
  canvas.line(34, 28, 34, 38, 255, 30, 60);
  canvas.line(16, 38, 34, 38, 255, 30, 60);

  // 2. "DEAD END" in black/yellow hazard stencil
  canvas.line(46, 22, 74, 22, 255, 215, 0);
  canvas.line(46, 34, 74, 34, 255, 215, 0);
  canvas.fillRect(48, 24, 6, 8, 30, 30, 35);
  canvas.fillRect(64, 24, 6, 8, 30, 30, 35);

  // 3. "YANKEE #1" in electric cyan spray
  canvas.line(88, 18, 120, 18, 5, 217, 232);
  canvas.line(104, 18, 104, 36, 5, 217, 232);
  canvas.line(126, 18, 140, 36, 255, 110, 0); // Orange strike
  canvas.line(140, 18, 126, 36, 255, 110, 0);

  // Barbed wire brackets along top
  for (let bx = 10; bx < w; bx += 32) {
    canvas.fillRect(bx, 0, 3, 6, 120, 85, 65);
    canvas.line(bx - 4, 1, bx + 6, 1, 160, 110, 80);
  }

  canvas.save(path.join(__dirname, '../public/assets/props/prop_graffiti_wall.png'));
  console.log('Generated prop_graffiti_wall.png');
}
generateGraffitiWall();

console.log('====================================================');
console.log('CROWS ZERO ROOFTOP MAP ASSETS GENERATED SUCCESSFULLY');
console.log('====================================================');

