import Phaser from 'phaser';
import { FactionId, PlayerClassId } from '../types/game';
import { FACTIONS, CLASSES } from '../data/gameData';
import { SoundSynthesizer } from '../systems/SoundSynthesizer';

export class CharacterSelectScene extends Phaser.Scene {
  private selectedFaction: FactionId = 'GEARHEADS';
  private selectedClass: PlayerClassId = 'BRAWLER';
  private playerName: string = 'Iron Spike';

  private previewSprite?: Phaser.GameObjects.Sprite;
  private previewAura?: Phaser.GameObjects.Graphics;
  private factionCards: Phaser.GameObjects.Container[] = [];
  private classButtons: Phaser.GameObjects.Container[] = [];
  private infoContainer?: Phaser.GameObjects.Container;
  private soundSynth: SoundSynthesizer;

  constructor() {
    super('CharacterSelectScene');
    this.soundSynth = SoundSynthesizer.getInstance();
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Start street synth BGM on first interaction
    this.input.once('pointerdown', () => {
      this.soundSynth.startStreetSynthBGM();
    });

    // Dark Cyberpunk Grid Background
    const bg = this.add.graphics();
    bg.fillStyle(0x080910, 1);
    bg.fillRect(0, 0, w, h);

    // Neon grid lines
    bg.lineStyle(1, 0x161a29, 0.6);
    for (let x = 0; x < w; x += 40) bg.lineBetween(x, 0, x, h);
    for (let y = 0; y < h; y += 40) bg.lineBetween(0, y, w, y);

    // Top Header Banner
    const titleText = this.add.text(w / 2, 38, 'PROJECT YANKEE : นวบูรพา', {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    const subText = this.add.text(w / 2, 68, 'เลือกสถาบัน & คลาสอาชีพเพื่อปลุก "สปิริตออร่า" ประจำตัวของคุณ', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '13px',
      color: '#05d9e8'
    }).setOrigin(0.5);

    // 1. FACTION CARDS (Top-Left to Top-Right)
    this.createFactionCards();

    // 2. CLASS SELECTOR BUTTONS (Left Side)
    this.createClassSelector();

    // 3. CENTER PREVIEW AREA (Pixel Character + Live Aura Glow)
    this.createCharacterPreview();

    // 4. RIGHT SIDE INFO PANEL (Lore, Leader Portrait & Passives)
    this.createInfoPanel();

    // 5. BOTTOM START BUTTON
    this.createStartButton();
  }

  private createFactionCards() {
    const w = this.cameras.main.width;
    const cardW = 280;
    const cardH = 100;
    const gap = 24;
    const totalW = cardW * 3 + gap * 2;
    const startX = (w - totalW) / 2;
    const startY = 95;

    const factionList: FactionId[] = ['GEARHEADS', 'ELITES', 'SYNDICATE'];

    factionList.forEach((fid, idx) => {
      const fx = startX + idx * (cardW + gap);
      const fy = startY;
      const fData = FACTIONS[fid];
      const isSelected = this.selectedFaction === fid;

      const container = this.add.container(fx, fy);
      const bg = this.add.graphics();

      const drawCard = (selected: boolean) => {
        bg.clear();
        bg.fillStyle(0x0e111a, 0.95);
        bg.fillRect(0, 0, cardW, cardH);
        bg.lineStyle(selected ? 3 : 1, selected ? fData.themeColor : 0x242c40, 1);
        bg.strokeRect(0, 0, cardW, cardH);

        // Top accent line
        bg.fillStyle(fData.themeColor, 1);
        bg.fillRect(0, 0, cardW, 4);
      };

      drawCard(isSelected);

      const title = this.add.text(14, 12, fData.name, {
        fontFamily: 'Chakra Petch, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: fData.hexColor
      });

      const sub = this.add.text(14, 34, fData.subName, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '11px',
        color: '#a0aabf'
      });

      const leader = this.add.text(14, 52, `ผู้นำ: ${fData.leader} [${fData.leaderTitle}]`, {
        fontFamily: 'Chakra Petch, sans-serif',
        fontSize: '11px',
        color: '#ffd700'
      });

      const passive = this.add.text(14, 72, `บัฟ: ${fData.passiveName}`, {
        fontFamily: 'Chakra Petch, sans-serif',
        fontSize: '11px',
        color: '#00ff66'
      });

      container.add([bg, title, sub, leader, passive]);
      container.setSize(cardW, cardH);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerdown', () => {
        this.selectedFaction = fid;
        this.soundSynth.playUI();
        this.updateSelection();
      });

      this.factionCards.push(container);
    });
  }

  private createClassSelector() {
    const classList: PlayerClassId[] = [
      'VANGUARD',
      'BRAWLER',
      'STRIKER',
      'SHARPSHOOTER',
      'SUPPLIER',
      'INSTIGATOR',
      'SABOTEUR'
    ];

    const startX = 60;
    const startY = 220;
    const btnW = 220;
    const btnH = 44;
    const gap = 8;

    classList.forEach((cid, idx) => {
      const cy = startY + idx * (btnH + gap);
      const cData = CLASSES[cid];
      const isSelected = this.selectedClass === cid;

      const container = this.add.container(startX, cy);
      const bg = this.add.graphics();

      const drawBtn = (selected: boolean) => {
        bg.clear();
        bg.fillStyle(selected ? 0x1f283d : 0x10131d, 0.95);
        bg.fillRect(0, 0, btnW, btnH);
        bg.lineStyle(selected ? 2 : 1, selected ? 0x05d9e8 : 0x202636, 1);
        bg.strokeRect(0, 0, btnW, btnH);
        if (selected) {
          bg.fillStyle(0x05d9e8, 1);
          bg.fillRect(0, 0, 4, btnH);
        }
      };

      drawBtn(isSelected);

      const name = this.add.text(12, 6, `${cData.name}`, {
        fontFamily: 'Chakra Petch, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: isSelected ? '#05d9e8' : '#ffffff'
      });

      const role = this.add.text(12, 24, `${cData.thaiName}  |  ${cData.role}`, {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '10px',
        color: '#8b97ab'
      });

      container.add([bg, name, role]);
      container.setSize(btnW, btnH);
      container.setInteractive({ useHandCursor: true });

      container.on('pointerdown', () => {
        this.selectedClass = cid;
        this.soundSynth.playUI();
        this.updateSelection();
      });

      this.classButtons.push(container);
    });
  }

  private createCharacterPreview() {
    const w = this.cameras.main.width;
    const cx = w / 2 - 30;
    const cy = 360;

    const fData = FACTIONS[this.selectedFaction];

    // Pedestal Platform
    const pedestal = this.add.graphics();
    pedestal.fillStyle(0x131724, 0.95);
    pedestal.fillEllipse(cx, cy + 65, 180, 46);
    pedestal.lineStyle(3, fData.themeColor, 0.9);
    pedestal.strokeEllipse(cx, cy + 65, 180, 46);

    // Inner glowing pedestal ring
    pedestal.lineStyle(1.5, 0xffffff, 0.6);
    pedestal.strokeEllipse(cx, cy + 65, 150, 36);

    // Live Aura Glow Ring
    this.previewAura = this.add.graphics();

    // Player Animated Sprite (HD 64x64 upscale to 3.0x matching selected class)
    const classKey = this.selectedClass.toLowerCase();
    const texture = `class_${classKey}`;
    this.previewSprite = this.add.sprite(cx, cy + 5, texture, 0);
    this.previewSprite.setScale(3.0); // 3x HD Pixel Art Scale

    this.previewSprite.play(`${classKey}_idle`);

    // Test Animation Action Buttons below preview
    const actionBtns = [
      { label: '⚔️ ฟัน', animSuffix: 'attack1' },
      { label: '🗡️ แทง', animSuffix: 'attack2' },
      { label: '💥 ทุบ', animSuffix: 'attack3' },
      { label: '💨 แดช', animSuffix: 'dash' }
    ];
    actionBtns.forEach((ab, idx) => {
      const bx = cx - 110 + idx * 56;
      const by = cy + 96;

      const btnBg = this.add.graphics();
      btnBg.fillStyle(0x0e111a, 0.9);
      btnBg.fillRoundedRect(bx, by, 50, 24, 4);
      btnBg.lineStyle(1, 0x05d9e8, 0.8);
      btnBg.strokeRoundedRect(bx, by, 50, 24, 4);

      const btnText = this.add.text(bx + 25, by + 12, ab.label, {
        fontFamily: 'Chakra Petch, sans-serif',
        fontSize: '11px',
        color: '#ffffff'
      }).setOrigin(0.5);

      const hit = this.add.zone(bx + 25, by + 12, 50, 24).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        this.soundSynth.playUI();
        const c = this.selectedClass.toLowerCase();
        const fullAnim = `${c}_${ab.animSuffix}`;
        if (this.previewSprite) {
          this.previewSprite.play(fullAnim);
          this.previewSprite.once('animationcomplete', () => {
            this.previewSprite?.play(`${c}_idle`);
          });
        }
      });
    });

    // Random Name Generator Button
    const nameGenBg = this.add.graphics();
    nameGenBg.fillStyle(0x121724, 0.9);
    nameGenBg.fillRect(cx - 100, cy + 130, 200, 32);
    nameGenBg.lineStyle(1, 0x05d9e8, 0.8);
    nameGenBg.strokeRect(cx - 100, cy + 130, 200, 32);

    const nameText = this.add.text(cx, cy + 146, `ฉายา: ${this.playerName} 🎲`, {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '13px',
      color: '#ffffff'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const nicknames = [
      'Iron Spike', 'Neon Wolf', 'Sapphire Blade', 'Poppy Crusher',
      'Yamato Fang', 'Elizabeth Cane', 'Rust Striker', 'Cyber Punk',
      'Ghost Brawler', 'Thunder Fist'
    ];

    nameText.on('pointerdown', () => {
      this.playerName = nicknames[Math.floor(Math.random() * nicknames.length)];
      nameText.setText(`ฉายา: ${this.playerName} 🎲`);
      this.soundSynth.playUI();
    });
  }

  private createInfoPanel() {
    const w = this.cameras.main.width;
    const ix = w - 380;
    const iy = 220;
    const iw = 320;
    const ih = 360;

    this.infoContainer = this.add.container(ix, iy);
    this.renderInfoPanelContent(iw, ih);
  }

  private renderInfoPanelContent(iw: number, ih: number) {
    if (!this.infoContainer) return;
    this.infoContainer.removeAll(true);

    const fData = FACTIONS[this.selectedFaction];
    const cData = CLASSES[this.selectedClass];

    const bg = this.add.graphics();
    bg.fillStyle(0x0e111a, 0.95);
    bg.fillRect(0, 0, iw, ih);
    bg.lineStyle(1, fData.themeColor, 1);
    bg.strokeRect(0, 0, iw, ih);

    // Faction Leader Portrait (High-Res Anime Portrait)
    const portraitKey = this.selectedFaction === 'GEARHEADS' ? 'miss_poppy_anime' :
                        this.selectedFaction === 'ELITES' ? 'elizabeth_anime' : 'yamato_anime';

    if (this.textures.exists(portraitKey)) {
      const portrait = this.add.image(60, 65, portraitKey);
      portrait.setDisplaySize(90, 105);
      this.infoContainer.add(portrait);
    }

    // Leader info
    const leaderTitle = this.add.text(115, 20, fData.leader, {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: fData.hexColor
    });

    const leaderSub = this.add.text(115, 45, fData.leaderTitle, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '12px',
      color: '#ffd700'
    });

    const homeBase = this.add.text(115, 65, `ฐาน: ${fData.homeBase}`, {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '11px',
      color: '#a0aabf'
    });

    // Faction Passives
    const passiveTitle = this.add.text(16, 130, '⚡ บัฟพิเศษประจำสถาบัน:', {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#00ff66'
    });

    const passiveLines = this.add.text(16, 155, fData.passives.join('\n\n'), {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '11px',
      color: '#e0e5ff',
      wordWrap: { width: iw - 32 },
      lineSpacing: 4
    });

    // Class details
    const divider = this.add.graphics();
    divider.lineStyle(1, 0x222a3d);
    divider.lineBetween(16, 255, iw - 16, 255);

    const classHeader = this.add.text(16, 265, `⚔️ คลาส: ${cData.name} (${cData.thaiName})`, {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#05d9e8'
    });

    const classDesc = this.add.text(16, 290, cData.description, {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '11px',
      color: '#c0c8dd',
      wordWrap: { width: iw - 100 },
      lineSpacing: 3
    });

    const classSub = this.add.text(16, 332, `สายย่อย: ${cData.subclasses.join(', ')}`, {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '10px',
      color: '#ffd700'
    });

    // High-Res Class Portrait Badge
    const classPortraitKey = `class_${this.selectedClass.toLowerCase()}_portrait`;
    let classPortrait: Phaser.GameObjects.Image | undefined;
    if (this.textures.exists(classPortraitKey)) {
      classPortrait = this.add.image(iw - 50, 305, classPortraitKey);
      classPortrait.setDisplaySize(68, 96);
    }

    const containerChildren: Phaser.GameObjects.GameObject[] = [
      bg, leaderTitle, leaderSub, homeBase, passiveTitle,
      passiveLines, divider, classHeader, classDesc, classSub
    ];
    if (classPortrait) containerChildren.push(classPortrait);

    this.infoContainer.add(containerChildren);
  }

  private createStartButton() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const btnW = 340;
    const btnH = 50;
    const bx = (w - btnW) / 2;
    const by = h - 75;

    const container = this.add.container(bx, by);
    const bg = this.add.graphics();

    bg.fillStyle(0xff2a6d, 1);
    bg.fillRect(0, 0, btnW, btnH);
    bg.lineStyle(2, 0xffffff, 1);
    bg.strokeRect(0, 0, btnW, btnH);

    const label = this.add.text(btnW / 2, btnH / 2, '⚡ เข้าสู่เมืองนวบูรพา (ENTER WORLD)', {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(btnW, btnH);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x05d9e8, 1);
      bg.fillRect(0, 0, btnW, btnH);
      bg.lineStyle(2, 0xffffff, 1);
      bg.strokeRect(0, 0, btnW, btnH);
      label.setColor('#000000');
      this.soundSynth.playUI();
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0xff2a6d, 1);
      bg.fillRect(0, 0, btnW, btnH);
      bg.lineStyle(2, 0xffffff, 1);
      bg.strokeRect(0, 0, btnW, btnH);
      label.setColor('#ffffff');
    });

    container.on('pointerdown', () => {
      this.soundSynth.playAuraBurst();
      this.scene.start('WorldScene', {
        playerName: this.playerName,
        factionId: this.selectedFaction,
        classId: this.selectedClass
      });
    });
  }

  private updateSelection() {
    // Redraw cards & buttons
    this.factionCards.forEach(c => c.destroy());
    this.factionCards = [];
    this.createFactionCards();

    this.classButtons.forEach(b => b.destroy());
    this.classButtons = [];
    this.createClassSelector();

    // Update center preview sprite
    if (this.previewSprite) {
      const classKey = this.selectedClass.toLowerCase();
      const texture = `class_${classKey}`;
      this.previewSprite.setTexture(texture);
      this.previewSprite.play(`${classKey}_idle`);
    }

    // Update info panel
    this.renderInfoPanelContent(320, 360);
  }
}

