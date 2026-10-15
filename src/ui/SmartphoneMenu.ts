import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { FACTIONS, CLASSES } from '../data/gameData';
import { StatsSystem } from '../systems/StatsSystem';
import { SoundSynthesizer } from '../systems/SoundSynthesizer';
import { CharacterStats } from '../types/game';

export class SmartphoneMenu {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private bgGraphics: Phaser.GameObjects.Graphics;
  private contentContainer: Phaser.GameObjects.Container;
  private currentTab: 'STATS' | 'INVENTORY' | 'TURF' | 'CREW' = 'STATS';
  private player: Player;
  private soundSynth: SoundSynthesizer;
  public isOpen: boolean = false;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.soundSynth = SoundSynthesizer.getInstance();

    this.container = scene.add.container(0, 0);
    this.container.setDepth(1200);
    this.container.setVisible(false);

    this.bgGraphics = scene.add.graphics();
    this.container.add(this.bgGraphics);

    this.contentContainer = scene.add.container(0, 0);
    this.container.add(this.contentContainer);
  }

  public toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public open() {
    this.isOpen = true;
    this.container.setVisible(true);
    this.soundSynth.playUI();
    this.render();
  }

  public close() {
    this.isOpen = false;
    this.container.setVisible(false);
    this.soundSynth.playUI();
  }

  private render() {
    const w = this.scene.cameras.main.width;
    const h = this.scene.cameras.main.height;

    this.bgGraphics.clear();
    this.contentContainer.removeAll(true);

    // Dim Background
    this.bgGraphics.fillStyle(0x060810, 0.7);
    this.bgGraphics.fillRect(0, 0, w, h);

    // Smartphone Chassis (Centrally aligned phone: 380px wide x 580px high)
    const phoneW = 420;
    const phoneH = Math.min(580, h - 40);
    const px = (w - phoneW) / 2;
    const py = (h - phoneH) / 2;

    // Phone Outer Case
    this.bgGraphics.fillStyle(0x12141f, 1);
    this.bgGraphics.fillRoundedRect(px, py, phoneW, phoneH, 20);
    this.bgGraphics.lineStyle(3, 0xff2a6d, 1);
    this.bgGraphics.strokeRoundedRect(px, py, phoneW, phoneH, 20);

    // Phone Screen Glass
    const screenX = px + 12;
    const screenY = py + 30;
    const screenW = phoneW - 24;
    const screenH = phoneH - 50;

    this.bgGraphics.fillStyle(0x0d0f1a, 1);
    this.bgGraphics.fillRect(screenX, screenY, screenW, screenH);
    this.bgGraphics.lineStyle(1, 0x05d9e8, 0.5);
    this.bgGraphics.strokeRect(screenX, screenY, screenW, screenH);

    // Top Status Bar (Clock, 5G, Battery)
    const topBarText = this.scene.add.text(screenX + 12, py + 8, 'NEO-NAV OS v3.8  //  5G  ▲ 98%', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '11px',
      color: '#05d9e8'
    });
    this.contentContainer.add(topBarText);

    // Close Button (Top right X)
    const closeBtn = this.scene.add.text(px + phoneW - 32, py + 6, '✕', {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '18px',
      color: '#ff2a6d'
    }).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.close());
    this.contentContainer.add(closeBtn);

    // Navigation Tabs: [STATS] [INVENTORY] [TURF] [CREW]
    const tabs: Array<{ id: 'STATS' | 'INVENTORY' | 'TURF' | 'CREW'; label: string }> = [
      { id: 'STATS', label: 'สเตตัส' },
      { id: 'INVENTORY', label: 'ไอเทม' },
      { id: 'TURF', label: 'ยึดเมือง' },
      { id: 'CREW', label: 'แก๊ง' }
    ];

    tabs.forEach((tab, i) => {
      const tabX = screenX + i * (screenW / 4);
      const tabY = screenY;
      const tabW = screenW / 4;
      const isSelected = this.currentTab === tab.id;

      const tabBg = this.scene.add.graphics();
      tabBg.fillStyle(isSelected ? 0xff2a6d : 0x181c2b, 1);
      tabBg.fillRect(tabX, tabY, tabW, 32);
      tabBg.lineStyle(1, 0x222a3d, 1);
      tabBg.strokeRect(tabX, tabY, tabW, 32);

      const tabText = this.scene.add.text(tabX + tabW / 2, tabY + 16, tab.label, {
        fontFamily: 'Chakra Petch, sans-serif',
        fontSize: '12px',
        color: isSelected ? '#ffffff' : '#8899bb'
      }).setOrigin(0.5);

      const tabHit = this.scene.add.zone(tabX + tabW / 2, tabY + 16, tabW, 32).setInteractive({ useHandCursor: true });
      tabHit.on('pointerdown', () => {
        this.currentTab = tab.id;
        this.soundSynth.playUI();
        this.render();
      });

      this.contentContainer.add([tabBg, tabText, tabHit]);
    });

    // Content area based on tab
    const contentY = screenY + 40;
    if (this.currentTab === 'STATS') {
      this.renderStatsTab(screenX + 16, contentY, screenW - 32);
    } else if (this.currentTab === 'INVENTORY') {
      this.renderInventoryTab(screenX + 16, contentY, screenW - 32);
    } else if (this.currentTab === 'TURF') {
      this.renderTurfTab(screenX + 16, contentY, screenW - 32);
    } else if (this.currentTab === 'CREW') {
      this.renderCrewTab(screenX + 16, contentY, screenW - 32);
    }
  }

  private renderStatsTab(x: number, y: number, width: number) {
    const stats = this.player.stats;
    const faction = FACTIONS[this.player.factionId];
    const classInfo = CLASSES[this.player.classId];

    // Character Header
    const nameText = this.scene.add.text(x, y, `${this.player.playerName} (Lv.${stats.level})`, {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff'
    });

    const subText = this.scene.add.text(x, y + 24, `${faction.name}  |  ${classInfo.name} (${classInfo.thaiName})`, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '12px',
      color: faction.hexColor
    });

    // Stat Points Banner
    const pointsText = this.scene.add.text(x, y + 48, `แต้มอัปสเตตัสคงเหลือ: ${stats.statPoints} แต้ม`, {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '13px',
      color: stats.statPoints > 0 ? '#00ff66' : '#888888',
      fontStyle: 'bold'
    });

    this.contentContainer.add([nameText, subText, pointsText]);

    // Six Classic Stats list: STR, AGI, INT, DEX, VIT, LUK
    const statKeys: Array<{ key: keyof Pick<CharacterStats, 'str' | 'agi' | 'int' | 'dex' | 'vit' | 'luk'>; label: string; desc: string }> = [
      { key: 'str', label: 'STR (พลังกาย)', desc: 'เพิ่มพลังโจมตีกายภาพ' },
      { key: 'agi', label: 'AGI (ความว่องไว)', desc: 'เพิ่มความเร็ววิ่ง/หลบหลีก' },
      { key: 'int', label: 'INT (พลังสปิริต)', desc: 'เพิ่มพลังออร่าและ Max Aura' },
      { key: 'dex', label: 'DEX (ความชำนาญ)', desc: 'เพิ่มแม่นยำ/เจาะเกราะ' },
      { key: 'vit', label: 'VIT (ความอดทน)', desc: 'เพิ่ม Max HP และเกราะ' },
      { key: 'luk', label: 'LUK (โชคชะตา)', desc: 'เพิ่มโอกาสคริติคอล/ดรอป' }
    ];

    statKeys.forEach((item, idx) => {
      const sy = y + 75 + idx * 34;

      const statLabel = this.scene.add.text(x, sy, `${item.label}:`, {
        fontFamily: 'Chakra Petch, sans-serif',
        fontSize: '13px',
        color: '#e0e5ff'
      });

      const statVal = this.scene.add.text(x + 150, sy, `${stats[item.key]}`, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#05d9e8'
      });

      this.contentContainer.add([statLabel, statVal]);

      // Add '+' button if points available
      if (stats.statPoints > 0) {
        const plusBtn = this.scene.add.text(x + 200, sy - 2, '[ + ]', {
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '14px',
          fontStyle: 'bold',
          color: '#00ff66'
        }).setInteractive({ useHandCursor: true });

        plusBtn.on('pointerdown', () => {
          StatsSystem.allocatePoint(stats, item.key, this.player.factionId);
          this.soundSynth.playUI();
          this.render();
        });

        this.contentContainer.add(plusBtn);
      }
    });

    // Derived Combat Parameters
    const combatY = y + 290;
    const divider = this.scene.add.graphics();
    divider.lineStyle(1, 0x222a3d);
    divider.lineBetween(x, combatY, x + width, combatY);

    const derivedStatsText = this.scene.add.text(x, combatY + 10,
      `พลังโจมตี: ${stats.physicalAttack}   |   พลังออร่า: ${stats.auraPower}\n` +
      `พลังป้องกัน: ${stats.defense}   |   โอกาสคริติคอล: ${(stats.critChance * 100).toFixed(1)}%\n` +
      `แรงคริติคอล: ${(stats.critMultiplier * 100).toFixed(0)}%   |   ความเร็ววิ่ง: ${stats.moveSpeed}`, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '12px',
      color: '#ffd700',
      lineSpacing: 6
    });

    this.contentContainer.add([divider, derivedStatsText]);
  }

  private renderInventoryTab(x: number, y: number, width: number) {
    const title = this.scene.add.text(x, y, 'กระเป๋าไอเทม & ความคงทนอุปกรณ์ (Durability)', {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffffff'
    });

    const items = [
      { name: 'สนับมือเหล็กสนิม +3 (Iron Knuckle)', type: 'อาวุธ', durability: '92/100', icon: '🥊' },
      { name: 'เสื้อแจ็คเก็ตนักเรียนช่างปักลาย', type: 'เกราะ', durability: '100/100', icon: '🥼' },
      { name: 'เครื่องดื่มชูกำลังตรากระทิงฟ้า x5', type: 'ยาฟื้นฟู', durability: 'พร้อมใช้', icon: '🧪' },
      { name: 'เศษเหล็กและน็อตจากหุ่นโดรน x14', type: 'วัตถุดิบ', durability: 'ขายได้', icon: '⚙️' },
      { name: 'ผงสปิริตออร่าบริสุทธิ์ x8', type: 'คราฟต์', durability: 'วัตถุดิบแรร์', icon: '✨' }
    ];

    items.forEach((item, idx) => {
      const iy = y + 35 + idx * 46;
      const cardBg = this.scene.add.graphics();
      cardBg.fillStyle(0x131724, 0.9);
      cardBg.fillRect(x, iy, width, 40);
      cardBg.lineStyle(1, 0x242c40, 1);
      cardBg.strokeRect(x, iy, width, 40);

      const itemText = this.scene.add.text(x + 10, iy + 6, `${item.icon} ${item.name}`, {
        fontFamily: 'Chakra Petch, sans-serif',
        fontSize: '12px',
        color: '#ffffff'
      });

      const sub = this.scene.add.text(x + 10, iy + 22, `ประเภท: ${item.type}  |  ความคงทน: ${item.durability}`, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '10px',
        color: '#05d9e8'
      });

      this.contentContainer.add([cardBg, itemText, sub]);
    });

    const actionBtn = this.scene.add.text(x, y + 280, '[ 🔨 สลายของเหลือใช้เป็นวัตถุดิบ (Pawn Shop) ]', {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '13px',
      color: '#00ff66'
    }).setInteractive({ useHandCursor: true });
    actionBtn.on('pointerdown', () => {
      this.soundSynth.playUI();
      alert('สลายขยะมอนสเตอร์เป็นผงสปิริต x5 สำเร็จ!');
    });

    this.contentContainer.add([title, actionBtn]);
  }

  private renderTurfTab(x: number, y: number, width: number) {
    const title = this.scene.add.text(x, y, 'แผนที่อิทธิพล 3 สถาบัน (Tri-Faction Turf War)', {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff'
    });

    const turfs = [
      { name: 'Rust Port (สถาบันเทคโนโลยีอาชีวะ)', faction: 'The Gearheads', color: '#ff2a6d', percent: '42%' },
      { name: 'Sapphire Skyline (เอกชนนานาชาติ)', faction: 'The Elites', color: '#05d9e8', percent: '36%' },
      { name: 'Neon Alley (โรงเรียนมัธยมรัฐบาล)', faction: 'The Syndicate', color: '#00ff66', percent: '22%' },
      { name: 'Apex Ground Zero (ศูนย์กลางเมืองหลวง)', faction: '⚔️ FREE PK ZONE (แย่งชิง)', color: '#ffaa00', percent: 'สมรภูมิเดือด' }
    ];

    turfs.forEach((t, idx) => {
      const ty = y + 36 + idx * 62;
      const card = this.scene.add.graphics();
      card.fillStyle(0x131724, 0.9);
      card.fillRect(x, ty, width, 52);
      card.lineStyle(1, 0x242c40, 1);
      card.strokeRect(x, ty, width, 52);

      const zoneName = this.scene.add.text(x + 10, ty + 6, t.name, {
        fontFamily: 'Chakra Petch, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: t.color
      });

      const zoneSub = this.scene.add.text(x + 10, ty + 28, `ฝ่ายครองพื้นที่: ${t.faction}  (อัตราครองเมือง: ${t.percent})`, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '11px',
        color: '#e0e5ff'
      });

      this.contentContainer.add([card, zoneName, zoneSub]);
    });

    const info = this.scene.add.text(x, y + 300, '⭐ สงครามเสาธงประจำสัปดาห์: เสาร์-อาทิตย์ 20:00 น.\nผู้ชนะจะได้รับบัฟ Aura คูณ 2 ทั้งสถาบัน!', {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '12px',
      color: '#ffd700',
      lineSpacing: 4
    });

    this.contentContainer.add([title, info]);
  }

  private renderCrewTab(x: number, y: number, width: number) {
    const title = this.scene.add.text(x, y, 'ระบบแก๊งและกิลด์ย่อย (Crew & Hideout)', {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#ffffff'
    });

    const desc = this.scene.add.text(x, y + 30,
      'รวมกลุ่มเพื่อนซี้ 10-20 คน สร้างแก๊งย่อย\n' +
      'พ่นสัญลักษณ์สเปรย์ (Spray Logo) บนเสื้อแจ็คเก็ต\n' +
      'และบุกยึดตึกเซฟเฮาส์ในแผนที่เพื่อเก็บภาษี Passive Income!', {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '12px',
      color: '#e0e5ff',
      lineSpacing: 6
    });

    const createBtn = this.scene.add.text(x, y + 130, '[ 👑 ก่อตั้งแก๊งใหม่ (ค่าธรรมเนียม 5,000 Zen) ]', {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '13px',
      color: '#05d9e8'
    }).setInteractive({ useHandCursor: true });

    createBtn.on('pointerdown', () => {
      this.soundSynth.playUI();
      const gangName = prompt('ระบุชื่อแก๊งของคุณ:');
      if (gangName) {
        alert(`จัดตั้งแก๊ง [${gangName}] สำเร็จ! สามารถชวนเพื่อนร่วมแก๊งได้สูงสุด 20 คน`);
      }
    });

    this.contentContainer.add([title, desc, createBtn]);
  }
}

