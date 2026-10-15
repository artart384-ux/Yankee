import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { FACTIONS, CLASSES } from '../data/gameData';
import { SoundSynthesizer } from '../systems/SoundSynthesizer';
import { SCHOOL_ZONES } from '../data/SchoolZonesConfig';

export class NeoNavHUD {
  private scene: Phaser.Scene;
  private player: Player;
  private soundSynth: SoundSynthesizer;

  // Top-Left Status Pod
  private statusContainer: Phaser.GameObjects.Container;
  private statusBg: Phaser.GameObjects.Graphics;
  private avatarCircle: Phaser.GameObjects.Graphics;
  private avatarSprite?: Phaser.GameObjects.Sprite;
  private hpFill: Phaser.GameObjects.Graphics;
  private staFill: Phaser.GameObjects.Graphics;
  private auraFill: Phaser.GameObjects.Graphics;
  private expFill: Phaser.GameObjects.Graphics;
  private nameLabel: Phaser.GameObjects.Text;
  private levelLabel: Phaser.GameObjects.Text;
  private hpText: Phaser.GameObjects.Text;
  private staText: Phaser.GameObjects.Text;
  private auraText: Phaser.GameObjects.Text;

  // Top-Center Zone Banner
  private centerBannerContainer: Phaser.GameObjects.Container;
  private centerBannerBg: Phaser.GameObjects.Graphics;
  private centerBannerText: Phaser.GameObjects.Text;
  private hazardBeacon: Phaser.GameObjects.Graphics;

  // Top-Right GPS Radar
  private radarContainer: Phaser.GameObjects.Container;
  private radarBg: Phaser.GameObjects.Graphics;
  private radarBeam: Phaser.GameObjects.Graphics;
  private radarBlips: Phaser.GameObjects.Graphics;
  private radarAngle: number = 0;
  private coordText: Phaser.GameObjects.Text;

  // Bottom-Center Hotbar
  private hotbarContainer: Phaser.GameObjects.Container;
  private skillSlots: Array<{
    box: Phaser.GameObjects.Graphics;
    cooldownOverlay: Phaser.GameObjects.Graphics;
    cooldownText: Phaser.GameObjects.Text;
    keyLabel: Phaser.GameObjects.Text;
    icon: Phaser.GameObjects.Text;
  }> = [];

  // Bottom-Right Phone Trigger
  private phoneBtn: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, player: Player, onTogglePhone: () => void) {
    this.scene = scene;
    this.player = player;
    this.soundSynth = SoundSynthesizer.getInstance();

    const w = scene.cameras.main.width;
    const h = scene.cameras.main.height;

    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // 1. TOP-LEFT NEO-NAV STATUS POD (Matching Attached Image)
    // -------------------------------------------------------------
    this.statusContainer = scene.add.container(18, 14);
    this.statusBg = scene.add.graphics();
    this.avatarCircle = scene.add.graphics();
    this.hpFill = scene.add.graphics();
    this.staFill = scene.add.graphics();
    this.auraFill = scene.add.graphics();
    this.expFill = scene.add.graphics();

    const faction = FACTIONS[player.factionId];

    // Character Face Avatar Sprite inside Square Frame (Matching Reference Image)
    const spriteKey = `class_${player.classId.toLowerCase()}`;
    this.avatarSprite = scene.add.sprite(36, 40, spriteKey, 0);
    this.avatarSprite.setScale(1.15);

    // Settings Gear Icon next to Avatar
    const settingsGear = scene.add.text(12, 12, '⚙️', { fontSize: '11px' }).setInteractive({ useHandCursor: true });
    settingsGear.on('pointerdown', () => onTogglePhone());

    // Header Badge: NEO-NAV
    const neoNavHeader = scene.add.text(12, -4, 'NEO-NAV', {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 3
    });

    this.levelLabel = scene.add.text(78, 14, `Lv.${player.stats.level}`, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 3
    });

    this.nameLabel = scene.add.text(124, 14, `${player.playerName}`, {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 3
    });

    this.hpText = scene.add.text(76, 32, 'HP', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 2
    });

    this.staText = scene.add.text(76, 46, 'STAMINA', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 2
    });

    this.auraText = scene.add.text(76, 60, 'AURA', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 2
    });

    this.statusContainer.add([
      this.statusBg,
      this.avatarCircle,
      this.avatarSprite,
      settingsGear,
      neoNavHeader,
      this.hpFill,
      this.staFill,
      this.auraFill,
      this.levelLabel,
      this.nameLabel,
      this.hpText,
      this.staText,
      this.auraText
    ]);

    // -------------------------------------------------------------
    // 2. TOP-CENTER CURVED ZONE BANNER
    // -------------------------------------------------------------
    this.centerBannerContainer = scene.add.container(w / 2, 22);
    this.centerBannerBg = scene.add.graphics();
    this.hazardBeacon = scene.add.graphics();
    this.centerBannerText = scene.add.text(0, 0, '⚡ APEX GROUND ZERO // [FREE PK ZONE] ⚡', {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ff2a6d',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5);

    this.centerBannerContainer.add([this.centerBannerBg, this.hazardBeacon, this.centerBannerText]);

    // -------------------------------------------------------------
    // 3. TOP-RIGHT GPS RADAR (Matching Reference Image)
    // -------------------------------------------------------------
    const rw = 130;
    this.radarContainer = scene.add.container(w - rw - 18, 14);
    this.radarBg = scene.add.graphics();
    this.radarBeam = scene.add.graphics();
    this.radarBlips = scene.add.graphics();

    const radarHeader = scene.add.text(8, 6, 'GPS RADAR', {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 3
    });

    const radarCloseBtn = scene.add.text(rw - 16, 6, '✖', {
      fontSize: '10px',
      color: '#ff2a6d'
    }).setInteractive({ useHandCursor: true });

    this.coordText = scene.add.text(rw / 2, rw + 4, 'CROSSROADS\nSCHOOL SQUARE // LEVEL 1-10', {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '9px',
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.radarContainer.add([this.radarBg, radarHeader, radarCloseBtn, this.radarBeam, this.radarBlips, this.coordText]);

    // -------------------------------------------------------------
    // 4. BOTTOM-CENTER ACTION HOTBAR & QUICK ITEMS
    // -------------------------------------------------------------
    this.hotbarContainer = scene.add.container(0, 0);
    this.setupHotbar();

    // -------------------------------------------------------------
    // 5. BOTTOM-RIGHT CRACKED SMARTPHONE (Matching Reference Image)
    // -------------------------------------------------------------
    this.phoneBtn = this.setupPhoneButton(onTogglePhone);
  }

  private setupHotbar() {
    const w = this.scene.cameras.main.width;
    const h = this.scene.cameras.main.height;

    const skills = this.player.skills;
    const slotSize = 42;
    const gap = 6;
    const skillsW = skills.length * slotSize + (skills.length - 1) * gap;
    const spaceW = 70;
    const itemsW = 3 * slotSize + 2 * gap;
    const totalW = skillsW + 12 + spaceW + 24 + itemsW;
    const startX = (w - totalW) / 2;
    const startY = h - 60;

    // Header: DIGITAL ACTION SKILL
    const skillHeader = this.scene.add.text(startX, startY - 18, 'DIGITAL ACTION SKILL', {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 3
    });
    this.hotbarContainer.add(skillHeader);

    // Skill Slots
    skills.forEach((skill, i) => {
      const sx = startX + i * (slotSize + gap);
      const sy = startY;

      const box = this.scene.add.graphics();
      box.fillStyle(0x0e111a, 0.92);
      box.fillRoundedRect(sx, sy, slotSize, slotSize, 5);
      box.lineStyle(1.5, 0x4a5568, 0.9);
      box.strokeRoundedRect(sx, sy, slotSize, slotSize, 5);

      const icon = this.scene.add.text(sx + slotSize / 2, sy + 16, skill.iconChar, {
        fontSize: '18px'
      }).setOrigin(0.5);

      const keyBox = this.scene.add.graphics();
      keyBox.fillStyle(0x1a202c, 0.9);
      keyBox.fillRoundedRect(sx + 2, sy + slotSize - 13, 14, 11, 2);

      const keyLabel = this.scene.add.text(sx + 9, sy + slotSize - 8, skill.keySlot, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '9px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      const cooldownOverlay = this.scene.add.graphics();
      const cooldownText = this.scene.add.text(sx + slotSize / 2, sy + slotSize / 2, '', {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000',
        strokeThickness: 3
      }).setOrigin(0.5);

      const hitZone = this.scene.add.zone(sx + slotSize / 2, sy + slotSize / 2, slotSize, slotSize).setInteractive({ useHandCursor: true });
      hitZone.on('pointerdown', () => {
        const ws = (this.scene as any).worldScene || (this.scene.scene ? this.scene.scene.get('WorldScene') as any : null);
        if (ws && typeof ws.performClassSkill === 'function') {
          ws.performClassSkill(skill.keySlot);
        } else {
          this.player.executeClassSkill(skill.keySlot as any, this.scene.input.activePointer.worldX, this.scene.input.activePointer.worldY);
        }
        this.soundSynth.playPunch();
      });

      this.hotbarContainer.add([box, icon, keyBox, keyLabel, cooldownOverlay, cooldownText, hitZone]);

      this.skillSlots.push({
        box,
        cooldownOverlay,
        cooldownText,
        keyLabel,
        icon
      });
    });

    // Spacebar Button
    const spaceX = startX + skillsW + 8;
    const spaceBox = this.scene.add.graphics();
    spaceBox.fillStyle(0x0e111a, 0.92);
    spaceBox.fillRoundedRect(spaceX, startY, spaceW, slotSize, 5);
    spaceBox.lineStyle(1.5, 0x4a5568, 0.9);
    spaceBox.strokeRoundedRect(spaceX, startY, spaceW, slotSize, 5);

    const spaceIcon = this.scene.add.text(spaceX + spaceW / 2, startY + 15, '📜', { fontSize: '16px' }).setOrigin(0.5);
    const spaceText = this.scene.add.text(spaceX + spaceW / 2, startY + 30, 'Spacebar', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '9px',
      color: '#ffffff'
    }).setOrigin(0.5);
    const spaceHitZone = this.scene.add.zone(spaceX + spaceW / 2, startY + slotSize / 2, spaceW, slotSize).setInteractive({ useHandCursor: true });
    spaceHitZone.on('pointerdown', () => {
      this.player.executeDodgeRoll(this.scene.input.activePointer);
    });
    this.hotbarContainer.add([spaceBox, spaceIcon, spaceText, spaceHitZone]);

    // Header: QUICK HEALTH ITEMS
    const itemStartX = spaceX + spaceW + 20;
    const itemHeader = this.scene.add.text(itemStartX, startY - 18, 'QUICK HEALTH ITEMS', {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 3
    });
    this.hotbarContainer.add(itemHeader);

    // 3 Quick Health Items matching image
    const quickItems = [
      { icon: '🍶', count: 5, key: '1' },
      { icon: '🥫', count: 8, key: '2' },
      { icon: '💵', count: 13, key: '3' }
    ];

    quickItems.forEach((item, idx) => {
      const ix = itemStartX + idx * (slotSize + gap);
      const iy = startY;

      const ibox = this.scene.add.graphics();
      ibox.fillStyle(0x0e111a, 0.92);
      ibox.fillRoundedRect(ix, iy, slotSize, slotSize, 5);
      ibox.lineStyle(1.5, 0x4a5568, 0.9);
      ibox.strokeRoundedRect(ix, iy, slotSize, slotSize, 5);

      const iIcon = this.scene.add.text(ix + slotSize / 2, iy + 16, item.icon, { fontSize: '18px' }).setOrigin(0.5);
      const iCount = this.scene.add.text(ix + slotSize - 4, iy + slotSize - 6, `${item.count}`, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '9px',
        color: '#00ff66',
        fontStyle: 'bold'
      }).setOrigin(1, 1);

      const iKeyBox = this.scene.add.graphics();
      iKeyBox.fillStyle(0x1a202c, 0.9);
      iKeyBox.fillRoundedRect(ix + 2, iy + slotSize - 13, 12, 11, 2);

      const iKey = this.scene.add.text(ix + 8, iy + slotSize - 8, item.key, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '9px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.hotbarContainer.add([ibox, iIcon, iCount, iKeyBox, iKey]);
    });
  }

  private setupPhoneButton(onToggle: () => void): Phaser.GameObjects.Container {
    const w = this.scene.cameras.main.width;
    const h = this.scene.cameras.main.height;
    const btn = this.scene.add.container(w - 75, h - 90);

    const phoneSprite = this.scene.add.image(0, 0, 'ui_cracked_phone');
    phoneSprite.setScale(0.72);

    btn.add(phoneSprite);
    btn.setSize(75, 120);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => {
      this.soundSynth.playUI();
      onToggle();
    });

    btn.on('pointerover', () => {
      phoneSprite.setScale(0.78);
    });

    btn.on('pointerout', () => {
      phoneSprite.setScale(0.72);
    });

    return btn;
  }
  public update(currentZone: string) {
    const stats = this.player.stats;

    // -------------------------------------------------------------
    // 1. UPDATE STATUS POD (Top-Left)
    // -------------------------------------------------------------
    this.statusBg.clear();
    this.avatarCircle.clear();
    this.hpFill.clear();
    this.staFill.clear();
    this.auraFill.clear();

    const pw = 330, ph = 78;
    // Dark steel rectangular frame (Matching reference image)
    this.statusBg.fillStyle(0x0e111a, 0.95);
    this.statusBg.fillRoundedRect(0, 0, pw, ph, 4);
    this.statusBg.lineStyle(2, 0x4a5568, 0.9);
    this.statusBg.strokeRoundedRect(0, 0, pw, ph, 4);

    // Avatar Square Frame (Matching reference image)
    this.avatarCircle.fillStyle(0x1a202c, 1);
    this.avatarCircle.fillRoundedRect(12, 14, 52, 52, 4);
    this.avatarCircle.lineStyle(1.5, 0x718096, 1);
    this.avatarCircle.strokeRoundedRect(12, 14, 52, 52, 4);

    const barX = 126, barW = 180, barH = 10;

    // A) Thick Crimson Red HP Gauge (Matching reference image)
    const hpRatio = Math.max(0, Math.min(1, stats.hp / stats.maxHp));
    this.hpFill.fillStyle(0x2d1519, 1);
    this.hpFill.fillRect(barX, 32, barW, barH);
    this.hpFill.fillStyle(0xe62038, 1);
    this.hpFill.fillRect(barX, 32, barW * hpRatio, barH);
    this.hpFill.lineStyle(1, 0x1a0507, 1);
    this.hpFill.strokeRect(barX, 32, barW, barH);
    this.hpText.setText('HP');

    // B) Cyan Blue Stamina Gauge (Matching reference image)
    const staRatio = Math.max(0, Math.min(1, stats.stamina / stats.maxStamina));
    this.staFill.fillStyle(0x102530, 1);
    this.staFill.fillRect(barX, 46, barW, barH);
    this.staFill.fillStyle(0x00e5ff, 1);
    this.staFill.fillRect(barX, 46, barW * staRatio, barH);
    this.staFill.lineStyle(1, 0x051a24, 1);
    this.staFill.strokeRect(barX, 46, barW, barH);
    this.staText.setText('STAMINA');

    // C) Deep Blue Aura Gauge (Matching reference image)
    const auraRatio = Math.max(0, Math.min(1, stats.aura / stats.maxAura));
    this.auraFill.fillStyle(0x0e172a, 1);
    this.auraFill.fillRect(barX, 60, barW, barH);
    this.auraFill.fillStyle(0x2563eb, 1);
    this.auraFill.fillRect(barX, 60, barW * auraRatio, barH);
    this.auraFill.lineStyle(1, 0x070c18, 1);
    this.auraFill.strokeRect(barX, 60, barW, barH);
    this.auraText.setText('AURA');

    this.levelLabel.setText(`Lv.${stats.level}`);

    // Bottom EXP bar
    const w = this.scene.cameras.main.width;
    const h = this.scene.cameras.main.height;
    const expRatio = Math.max(0, Math.min(1, stats.exp / stats.maxExp));
    this.expFill.clear();
    this.expFill.fillStyle(0x101422, 0.9);
    this.expFill.fillRect(0, h - 5, w, 5);
    this.expFill.fillStyle(0x00ff66, 1);
    this.expFill.fillRect(0, h - 5, w * expRatio, 5);

    // -------------------------------------------------------------
    // 2. UPDATE TOP-CENTER CURVED BANNER
    // -------------------------------------------------------------
    this.centerBannerBg.clear();
    this.hazardBeacon.clear();
    const bw = 500, bh = 34;
    const schoolZone = SCHOOL_ZONES[currentZone];

    let bannerTitle = '🛡️ CROSSROADS PLAZA // [SAFE TRADE HAVEN] 🛡️';
    let bannerColor = 0x00ff66;
    let textColor = '#00ff66';

    if (schoolZone) {
      bannerTitle = `⚡ ${schoolZone.name} // [${schoolZone.levelRange}] ⚡`;
      bannerColor = schoolZone.themeColor;
      textColor = schoolZone.bannerColor;
    } else if (currentZone === 'APEX' || currentZone === 'zone_10') {
      bannerTitle = '👑 10. ดาดฟ้าตึกเรียนหลัก [DUEL ARENA & BOSS HUB] 👑';
      bannerColor = 0xff2a6d;
      textColor = '#ff2a6d';
    } else if (currentZone === 'RUST_PORT') {
      bannerTitle = '🔧 RUST PORT GARAGE // [THE GEARHEADS WORKSHOP] 🔧';
      bannerColor = 0xffa500;
      textColor = '#ffa500';
    } else if (currentZone === 'ELITES_ACADEMY') {
      bannerTitle = '🏛️ ELITES ARCHIVE // [STUDENT COUNCIL ACADEMY] 🏛️';
      bannerColor = 0x05d9e8;
      textColor = '#05d9e8';
    } else if (currentZone === 'SYNDICATE_ALLEY') {
      bannerTitle = '🌙 SYNDICATE BACK-ALLEY // [UNDERWORLD CONFLICT] 🌙';
      bannerColor = 0xd800ff;
      textColor = '#d800ff';
    }

    this.centerBannerBg.fillStyle(0x0b0e18, 0.92);
    this.centerBannerBg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 8);
    this.centerBannerBg.lineStyle(2, bannerColor, 0.9);
    this.centerBannerBg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 8);

    // Blinking hazard beacon
    const blink = Math.floor(Date.now() / 400) % 2 === 0;
    this.hazardBeacon.fillStyle(blink ? bannerColor : 0x222230, 1);
    this.hazardBeacon.fillCircle(-bw / 2 + 16, 0, 5);
    this.hazardBeacon.fillCircle(bw / 2 - 16, 0, 5);

    this.centerBannerText.setText(bannerTitle);
    this.centerBannerText.setColor(textColor);

    // -------------------------------------------------------------
    // 3. UPDATE GPS RADAR (Top-Right Rectangular Mini-Map)
    // -------------------------------------------------------------
    const rw = 130, rh = 120;
    this.radarBg.clear();
    this.radarBeam.clear();
    this.radarBlips.clear();

    // Dark rectangular frame
    this.radarBg.fillStyle(0x0e111a, 0.95);
    this.radarBg.fillRoundedRect(0, 0, rw, rh + 32, 4);
    this.radarBg.lineStyle(2, 0x4a5568, 0.9);
    this.radarBg.strokeRoundedRect(0, 0, rw, rh + 32, 4);

    // Mini-map ground area
    this.radarBg.fillStyle(0x1a202c, 0.95);
    this.radarBg.fillRect(6, 22, rw - 12, rh - 26);

    // Grid lines on radar
    this.radarBg.lineStyle(1, 0x2d3748, 0.7);
    for (let gx = 18; gx < rw - 12; gx += 22) {
      this.radarBg.lineBetween(gx, 22, gx, rh - 4);
    }
    for (let gy = 32; gy < rh - 4; gy += 18) {
      this.radarBg.lineBetween(6, gy, rw - 6, gy);
    }

    // Player position on radar (Yellow chevron marker)
    const mapCenter = { x: rw / 2, y: 22 + (rh - 26) / 2 };
    this.radarBlips.fillStyle(0xffd700, 1);
    this.radarBlips.fillTriangle(
      mapCenter.x, mapCenter.y - 5,
      mapCenter.x - 4, mapCenter.y + 4,
      mapCenter.x + 4, mapCenter.y + 4
    );

    // Red Enemy Blips
    const worldScene = this.scene.scene.get('WorldScene') as { enemies?: Array<{ x: number; y: number; isDead?: boolean }> };
    if (worldScene?.enemies) {
      this.radarBlips.fillStyle(0xff2a4d, 1);
      worldScene.enemies.forEach(e => {
        if (e.isDead) return;
        const relX = (e.x - this.player.x) * 0.05;
        const relY = (e.y - this.player.y) * 0.05;
        if (Math.abs(relX) < (rw - 20) / 2 && Math.abs(relY) < (rh - 34) / 2) {
          this.radarBlips.fillCircle(mapCenter.x + relX, mapCenter.y + relY, 2.5);
        }
      });
    }

    if (schoolZone) {
      this.coordText.setText(`ZONE ${schoolZone.zoneNumber} // ${schoolZone.levelRange}\n${schoolZone.subtitle.substring(0, 24)}`);
    } else {
      this.coordText.setText(`CROSSROADS\nCAMPUS SQUARE // LEVEL 1-15`);
    }

    // -------------------------------------------------------------
    // 4. UPDATE HOTBAR COOLDOWNS
    // -------------------------------------------------------------
    const now = Date.now();
    this.player.skills.forEach((skill, i) => {
      const slot = this.skillSlots[i];
      slot.cooldownOverlay.clear();
      slot.cooldownText.setText('');

      const elapsed = now - skill.lastUsedTime;
      if (elapsed < skill.cooldown) {
        const remainingRatio = 1 - (elapsed / skill.cooldown);
        const slotSize = 48;
        const sx = slot.keyLabel.x - 5;
        const sy = slot.keyLabel.y - 32;

        slot.cooldownOverlay.fillStyle(0x000000, 0.75);
        slot.cooldownOverlay.fillRect(sx, sy, slotSize, slotSize * remainingRatio);

        const secsLeft = ((skill.cooldown - elapsed) / 1000).toFixed(1);
        slot.cooldownText.setText(`${secsLeft}s`);
      }
    });
  }

  public destroy() {
    this.statusContainer.destroy();
    this.centerBannerContainer.destroy();
    this.radarContainer.destroy();
    this.hotbarContainer.destroy();
    this.phoneBtn.destroy();
    this.expFill.destroy();
  }
}
