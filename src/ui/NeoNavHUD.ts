import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { FACTIONS, CLASSES } from '../data/gameData';
import { SoundSynthesizer } from '../systems/SoundSynthesizer';

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
    // 1. TOP-LEFT SMARTPHONE STATUS POD (Matching Image 2 Mockup)
    // -------------------------------------------------------------
    this.statusContainer = scene.add.container(18, 14);
    this.statusBg = scene.add.graphics();
    this.avatarCircle = scene.add.graphics();
    this.hpFill = scene.add.graphics();
    this.staFill = scene.add.graphics();
    this.auraFill = scene.add.graphics();
    this.expFill = scene.add.graphics();

    const faction = FACTIONS[player.factionId];

    // Character Face Avatar Sprite inside Circular Pod
    const spriteKey = player.factionId === 'GEARHEADS' ? 'gearheads_brawler' :
                      player.factionId === 'ELITES' ? 'elites_striker' : 'syndicate_delinquent';
    this.avatarSprite = scene.add.sprite(36, 40, spriteKey, 0);
    this.avatarSprite.setScale(1.2);

    this.levelLabel = scene.add.text(78, 14, `Lv.${player.stats.level}`, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffd700',
      stroke: '#000',
      strokeThickness: 3
    });

    this.nameLabel = scene.add.text(130, 14, `${player.playerName} [${faction.name}]`, {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: faction.hexColor,
      stroke: '#000',
      strokeThickness: 3
    });

    this.hpText = scene.add.text(285, 34, 'HP', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '10px',
      color: '#ffffff'
    });

    this.staText = scene.add.text(285, 49, 'STA', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '10px',
      color: '#ffffff'
    });

    this.auraText = scene.add.text(285, 64, 'AURA', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '10px',
      color: '#ffffff'
    });

    this.statusContainer.add([
      this.statusBg,
      this.avatarCircle,
      this.avatarSprite,
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
    // 3. TOP-RIGHT DIGITAL GPS RADAR
    // -------------------------------------------------------------
    const rw = 120;
    this.radarContainer = scene.add.container(w - rw - 18, 14);
    this.radarBg = scene.add.graphics();
    this.radarBeam = scene.add.graphics();
    this.radarBlips = scene.add.graphics();

    this.coordText = scene.add.text(rw / 2, rw + 8, 'X: 1200 Y: 1000', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '10px',
      color: '#05d9e8',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.radarContainer.add([this.radarBg, this.radarBeam, this.radarBlips, this.coordText]);

    // -------------------------------------------------------------
    // 4. BOTTOM-CENTER ACTION HOTBAR
    // -------------------------------------------------------------
    this.hotbarContainer = scene.add.container(0, 0);
    this.setupHotbar();

    // -------------------------------------------------------------
    // 5. BOTTOM-RIGHT PHONE BUTTON
    // -------------------------------------------------------------
    this.phoneBtn = this.setupPhoneButton(onTogglePhone);
  }

  private setupHotbar() {
    const w = this.scene.cameras.main.width;
    const h = this.scene.cameras.main.height;

    const skills = this.player.skills;
    const slotSize = 48;
    const gap = 8;
    const totalW = skills.length * slotSize + (skills.length - 1) * gap;
    const startX = (w - totalW) / 2;
    const startY = h - 68;

    skills.forEach((skill, i) => {
      const sx = startX + i * (slotSize + gap);
      const sy = startY;

      const box = this.scene.add.graphics();
      box.fillStyle(0x0e111a, 0.92);
      box.fillRoundedRect(sx, sy, slotSize, slotSize, 6);
      box.lineStyle(2, 0x05d9e8, 0.9);
      box.strokeRoundedRect(sx, sy, slotSize, slotSize, 6);

      const icon = this.scene.add.text(sx + slotSize / 2, sy + 18, skill.iconChar, {
        fontSize: '20px'
      }).setOrigin(0.5);

      const keyLabel = this.scene.add.text(sx + 5, sy + 32, skill.keySlot, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '11px',
        color: '#ff2a6d',
        fontStyle: 'bold'
      });

      const cooldownOverlay = this.scene.add.graphics();
      const cooldownText = this.scene.add.text(sx + slotSize / 2, sy + slotSize / 2, '', {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000',
        strokeThickness: 3
      }).setOrigin(0.5);

      // Clickable hotbar slot
      const hitZone = this.scene.add.zone(sx + slotSize / 2, sy + slotSize / 2, slotSize, slotSize).setInteractive({ useHandCursor: true });
      hitZone.on('pointerdown', () => {
        if (skill.keySlot === 'Q') this.player.executeDash(this.scene.input.activePointer);
        else if (skill.keySlot === '1') this.player.executeAuraSkill();
        else if (skill.keySlot === '2') this.player.executeWeaponTech();
        else if (skill.keySlot === '3') this.player.executeSpiritBurst();
        else if (skill.keySlot === '4') this.player.executeTonic();
        else if (skill.keySlot === 'E') this.player.executeAwakening();
        this.soundSynth.playPunch();
      });

      this.hotbarContainer.add([box, icon, keyLabel, cooldownOverlay, cooldownText, hitZone]);

      this.skillSlots.push({
        box,
        cooldownOverlay,
        cooldownText,
        keyLabel,
        icon
      });
    });
  }

  private setupPhoneButton(onToggle: () => void): Phaser.GameObjects.Container {
    const w = this.scene.cameras.main.width;
    const h = this.scene.cameras.main.height;
    const btn = this.scene.add.container(w - 76, h - 68);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x131724, 0.95);
    bg.fillRoundedRect(0, 0, 60, 54, 10);
    bg.lineStyle(2, 0xff2a6d, 1);
    bg.strokeRoundedRect(0, 0, 60, 54, 10);

    const icon = this.scene.add.text(30, 20, '📱', { fontSize: '20px' }).setOrigin(0.5);
    const label = this.scene.add.text(30, 42, 'NEO-NAV', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '8px',
      color: '#05d9e8'
    }).setOrigin(0.5);

    btn.add([bg, icon, label]);
    btn.setSize(60, 54);
    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => {
      this.soundSynth.playUI();
      onToggle();
    });

    btn.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0xff2a6d, 1);
      bg.fillRoundedRect(0, 0, 60, 54, 10);
      bg.lineStyle(2, 0xffffff, 1);
      bg.strokeRoundedRect(0, 0, 60, 54, 10);
    });

    btn.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x131724, 0.95);
      bg.fillRoundedRect(0, 0, 60, 54, 10);
      bg.lineStyle(2, 0xff2a6d, 1);
      bg.strokeRoundedRect(0, 0, 60, 54, 10);
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

    const pw = 360, ph = 84;
    // Curved pod backing
    this.statusBg.fillStyle(0x0a0c16, 0.92);
    this.statusBg.fillRoundedRect(0, 0, pw, ph, 16);
    this.statusBg.lineStyle(2, 0x05d9e8, 0.9);
    this.statusBg.strokeRoundedRect(0, 0, pw, ph, 16);

    // Tech chamfer accents
    this.statusBg.fillStyle(0xff2a6d, 1);
    this.statusBg.fillRect(20, 0, 40, 3);
    this.statusBg.fillStyle(0x05d9e8, 1);
    this.statusBg.fillRect(pw - 50, ph - 3, 30, 3);

    // Avatar Circle Frame
    this.avatarCircle.fillStyle(0x151a28, 1);
    this.avatarCircle.fillCircle(36, 42, 26);
    this.avatarCircle.lineStyle(2, 0xff2a6d, 1);
    this.avatarCircle.strokeCircle(36, 42, 26);

    const barX = 76, barW = 200, barH = 11;

    // A) Segmented Neon Green HP Gauge
    const hpRatio = Math.max(0, Math.min(1, stats.hp / stats.maxHp));
    this.hpFill.fillStyle(0x1a281e, 1);
    this.hpFill.fillRect(barX, 33, barW, barH);
    this.hpFill.fillStyle(0x00ff66, 1);
    this.hpFill.fillRect(barX, 33, barW * hpRatio, barH);
    // Dark segment notches
    this.hpFill.fillStyle(0x0a0c16, 0.7);
    for (let s = 1; s < 8; s++) {
      this.hpFill.fillRect(barX + (barW / 8) * s, 33, 2, barH);
    }
    this.hpText.setText(`${Math.round(stats.hp)} / ${stats.maxHp}`);

    // B) Segmented Neon Orange/Gold Stamina Gauge
    const staRatio = Math.max(0, Math.min(1, stats.stamina / stats.maxStamina));
    this.staFill.fillStyle(0x282012, 1);
    this.staFill.fillRect(barX, 48, barW, barH);
    this.staFill.fillStyle(0xffd700, 1);
    this.staFill.fillRect(barX, 48, barW * staRatio, barH);
    this.staFill.fillStyle(0x0a0c16, 0.7);
    for (let s = 1; s < 8; s++) {
      this.staFill.fillRect(barX + (barW / 8) * s, 48, 2, barH);
    }
    this.staText.setText(`${Math.round(stats.stamina)} / ${stats.maxStamina}`);

    // C) Segmented Neon Cyan/Purple Aura Gauge
    const auraRatio = Math.max(0, Math.min(1, stats.aura / stats.maxAura));
    this.auraFill.fillStyle(0x101f2e, 1);
    this.auraFill.fillRect(barX, 63, barW, barH);
    this.auraFill.fillStyle(0x05d9e8, 1);
    this.auraFill.fillRect(barX, 63, barW * auraRatio, barH);
    this.auraFill.fillStyle(0x0a0c16, 0.7);
    for (let s = 1; s < 8; s++) {
      this.auraFill.fillRect(barX + (barW / 8) * s, 63, 2, barH);
    }
    this.auraText.setText(`${Math.round(stats.aura)} / ${stats.maxAura}`);

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
    const bw = 380, bh = 32;
    const isApex = currentZone === 'APEX';
    const bannerColor = isApex ? 0xff2a6d : 0x00ff66;

    this.centerBannerBg.fillStyle(0x0b0e18, 0.92);
    this.centerBannerBg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 8);
    this.centerBannerBg.lineStyle(2, bannerColor, 0.9);
    this.centerBannerBg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 8);

    // Blinking hazard beacon
    const blink = Math.floor(Date.now() / 400) % 2 === 0;
    this.hazardBeacon.fillStyle(blink ? bannerColor : 0x222230, 1);
    this.hazardBeacon.fillCircle(-bw / 2 + 16, 0, 5);
    this.hazardBeacon.fillCircle(bw / 2 - 16, 0, 5);

    if (isApex) {
      this.centerBannerText.setText('⚡ APEX GROUND ZERO // [FREE PK ZONE] ⚡');
      this.centerBannerText.setColor('#ff2a6d');
    } else {
      this.centerBannerText.setText('🛡️ CROSSROADS // [SAFE TRADE HAVEN] 🛡️');
      this.centerBannerText.setColor('#00ff66');
    }

    // -------------------------------------------------------------
    // 3. UPDATE RADAR SWEEP (Top-Right)
    // -------------------------------------------------------------
    const rw = 120;
    const rcx = rw / 2;
    const rcy = rw / 2;
    const rrad = rw / 2 - 6;

    this.radarBg.clear();
    this.radarBeam.clear();
    this.radarBlips.clear();

    // Radar circular frame
    this.radarBg.fillStyle(0x0a0c16, 0.92);
    this.radarBg.fillCircle(rcx, rcy, rrad);
    this.radarBg.lineStyle(2, 0x05d9e8, 0.9);
    this.radarBg.strokeCircle(rcx, rcy, rrad);

    // Range rings
    this.radarBg.lineStyle(1, 0x162a3a, 0.8);
    this.radarBg.strokeCircle(rcx, rcy, rrad * 0.4);
    this.radarBg.strokeCircle(rcx, rcy, rrad * 0.75);

    // Crosshairs
    this.radarBg.lineBetween(rcx, rcy - rrad, rcx, rcy + rrad);
    this.radarBg.lineBetween(rcx - rrad, rcy, rcx + rrad, rcy);

    // Radar sweeping beam
    this.radarAngle += 0.04;
    if (this.radarAngle > Math.PI * 2) this.radarAngle -= Math.PI * 2;
    const beamX = rcx + Math.cos(this.radarAngle) * (rrad - 2);
    const beamY = rcy + Math.sin(this.radarAngle) * (rrad - 2);
    this.radarBeam.lineStyle(2, 0x00ff66, 0.8);
    this.radarBeam.lineBetween(rcx, rcy, beamX, beamY);

    // Center player blip
    this.radarBlips.fillStyle(0x00ff66, 1);
    this.radarBlips.fillCircle(rcx, rcy, 3);

    // Coordinates update
    this.coordText.setText(`X: ${Math.round(this.player.x)}  Y: ${Math.round(this.player.y)}`);

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
