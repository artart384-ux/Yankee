const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const portraitsDir = path.join(__dirname, '../public/assets/portraits');
const spritesDir = path.join(__dirname, '../public/assets/sprites');

const classes = [
  { id: 'class_vanguard', name: 'The Vanguard', maxH: 56 },
  { id: 'class_brawler', name: 'The Brawler', maxH: 54 },
  { id: 'class_striker', name: 'The Striker', maxH: 55 },
  { id: 'class_sharpshooter', name: 'The Sharpshooter', maxH: 53 },
  { id: 'class_supplier', name: 'The Supplier', maxH: 54 },
  { id: 'class_instigator', name: 'The Instigator', maxH: 54 },
  { id: 'class_saboteur', name: 'The Saboteur', maxH: 48 }
];

function downscalePixelArt(src, targetH) {
  const scale = targetH / src.height;
  const targetW = Math.max(1, Math.round(src.width * scale));
  const res = new PNG({ width: targetW, height: targetH });

  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      const srcX = Math.min(src.width - 1, Math.floor(x / scale));
      const srcY = Math.min(src.height - 1, Math.floor(y / scale));
      const srcIdx = (srcY * src.width + srcX) * 4;
      const dstIdx = (y * targetW + x) * 4;

      res.data[dstIdx] = src.data[srcIdx];
      res.data[dstIdx + 1] = src.data[srcIdx + 1];
      res.data[dstIdx + 2] = src.data[srcIdx + 2];
      res.data[dstIdx + 3] = src.data[srcIdx + 3];
    }
  }
  return res;
}

function blit(sheet, frameX, frameY, sprite, offsetX, offsetY, opts = {}) {
  const startX = frameX * 64 + offsetX;
  const startY = frameY * 64 + offsetY;

  const tilt = opts.tilt || 0; // horizontal lean
  const squash = opts.squash || 0; // vertical compress
  const flash = opts.flash || 0; // white hit flash
  const redTint = opts.redTint || 0;

  for (let sy = 0; sy < sprite.height; sy++) {
    const targetY = startY + sy + squash;
    if (targetY < frameY * 64 || targetY >= (frameY + 1) * 64) continue;

    // Apply slight tilt/lean
    const tiltShift = Math.round((sprite.height - sy) * tilt);

    for (let sx = 0; sx < sprite.width; sx++) {
      const targetX = startX + sx + tiltShift;
      if (targetX < frameX * 64 || targetX >= (frameX + 1) * 64) continue;

      const sIdx = (sy * sprite.width + sx) * 4;
      const alpha = sprite.data[sIdx + 3];
      if (alpha < 20) continue;

      const dIdx = (targetY * sheet.width + targetX) * 4;

      let r = sprite.data[sIdx];
      let g = sprite.data[sIdx + 1];
      let b = sprite.data[sIdx + 2];

      if (flash > 0) {
        r = Math.min(255, r + flash);
        g = Math.min(255, g + flash);
        b = Math.min(255, b + flash);
      } else if (redTint > 0) {
        r = Math.min(255, r + redTint);
        g = Math.max(0, g - redTint * 0.5);
        b = Math.max(0, b - redTint * 0.5);
      }

      sheet.data[dIdx] = r;
      sheet.data[dIdx + 1] = g;
      sheet.data[dIdx + 2] = b;
      sheet.data[dIdx + 3] = alpha;
    }
  }
}

for (const cls of classes) {
  const portraitPath = path.join(portraitsDir, `${cls.id}.png`);
  if (!fs.existsSync(portraitPath)) {
    console.error(`Missing portrait for ${cls.id}`);
    continue;
  }

  const portrait = PNG.sync.read(fs.readFileSync(portraitPath));
  const baseSprite = downscalePixelArt(portrait, cls.maxH);

  // Spritesheet: 6 columns x 8 rows (384 x 512 pixels)
  const sheet = new PNG({ width: 384, height: 512 });

  const baseX = Math.round((64 - baseSprite.width) / 2);
  const baseY = 57 - baseSprite.height;

  // ROW 0: IDLE (Frames 0..5)
  // Subtle breathing bob (0, -1, -2, -1, 0, 0)
  const idleBobs = [0, -1, -2, -1, 0, 0];
  for (let col = 0; col < 6; col++) {
    blit(sheet, col, 0, baseSprite, baseX, baseY + idleBobs[col]);
  }

  // ROW 1: WALK (Frames 6..11)
  // Stride motion with subtle bob and sway
  const walkBobs = [0, -2, 0, -1, -2, 0];
  const walkSways = [-1, 0, 1, 0, -1, 0];
  for (let col = 0; col < 6; col++) {
    blit(sheet, col, 1, baseSprite, baseX + walkSways[col], baseY + walkBobs[col], {
      tilt: walkSways[col] * 0.03
    });
  }

  // ROW 2: RUN (Frames 12..17)
  // Forward lean & dynamic stride
  const runBobs = [-1, -3, 0, -2, -4, 0];
  const runTilts = [0.08, 0.12, 0.06, 0.10, 0.14, 0.08];
  for (let col = 0; col < 6; col++) {
    blit(sheet, col, 2, baseSprite, baseX + 1, baseY + runBobs[col], {
      tilt: runTilts[col]
    });
  }

  // ROW 3: ATTACK 1 (Frames 18..23)
  // 18: windup, 19: lunge, 20: impact strike (flash), 21: follow-through, 22: recover, 23: return
  const atkConfig = [
    { ox: -2, oy: 0, tilt: -0.06, flash: 0 },
    { ox: 2, oy: -1, tilt: 0.08, flash: 0 },
    { ox: 5, oy: 1, tilt: 0.16, flash: 90 }, // Impact flash!
    { ox: 3, oy: 0, tilt: 0.10, flash: 40 },
    { ox: 1, oy: 0, tilt: 0.04, flash: 0 },
    { ox: 0, oy: 0, tilt: 0, flash: 0 }
  ];
  for (let col = 0; col < 6; col++) {
    const ac = atkConfig[col];
    blit(sheet, col, 3, baseSprite, baseX + ac.ox, baseY + ac.oy, {
      tilt: ac.tilt,
      flash: ac.flash
    });
  }

  // ROW 4: HURT & DEFEND (Frames 24..29)
  // 24: hit recoil, 25: red tint, 26: block/guard, 27..29: collapse/die
  blit(sheet, 0, 4, baseSprite, baseX - 4, baseY - 1, { tilt: -0.12, redTint: 140 }); // Hurt 1
  blit(sheet, 1, 4, baseSprite, baseX - 2, baseY, { tilt: -0.08, redTint: 80 });     // Hurt 2
  blit(sheet, 2, 4, baseSprite, baseX, baseY + 2, { squash: 2 });                     // Guard
  blit(sheet, 3, 4, baseSprite, baseX - 3, baseY + 6, { tilt: -0.25, squash: 6 });    // Fall 1
  blit(sheet, 4, 4, baseSprite, baseX - 6, baseY + 14, { tilt: -0.45, squash: 14 });  // Fall 2
  blit(sheet, 5, 4, baseSprite, baseX - 8, baseY + 22, { tilt: -0.60, squash: 22 });  // Down / KO

  // ROW 5: SPECIAL / SKILL (Frames 30..35)
  // Charging aura stance & energy release
  for (let col = 0; col < 6; col++) {
    const glow = col === 3 ? 120 : col === 4 ? 70 : 0;
    const squ = col === 1 ? 2 : col === 2 ? -2 : 0;
    blit(sheet, col, 5, baseSprite, baseX, baseY + squ, { flash: glow });
  }

  // ROW 6: VICTORY POSE (Frames 36..41)
  for (let col = 0; col < 6; col++) {
    const vicBob = (col % 2 === 0) ? -2 : 0;
    blit(sheet, col, 6, baseSprite, baseX, baseY + vicBob);
  }

  // ROW 7: MISC (Frames 42..47)
  for (let col = 0; col < 6; col++) {
    blit(sheet, col, 7, baseSprite, baseX, baseY);
  }

  const outSheetFile = path.join(spritesDir, `${cls.id}.png`);
  fs.writeFileSync(outSheetFile, PNG.sync.write(sheet));
  console.log(`Generated complete 48-frame HD spritesheet: ${cls.id}.png (384x512)`);
}

console.log('All 7 class spritesheets generated successfully!');

