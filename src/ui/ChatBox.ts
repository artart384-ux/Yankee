import Phaser from 'phaser';
import { ChatMessage, FactionId } from '../types/game';
import { FACTIONS } from '../data/gameData';

export class ChatBox {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private bgGraphics: Phaser.GameObjects.Graphics;
  private activeChannel: 'ALL' | 'FACTION' | 'GANG' | 'SYSTEM' = 'ALL';
  private messages: ChatMessage[] = [];
  private messageTexts: Phaser.GameObjects.Text[] = [];
  private inputDom?: HTMLInputElement;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const h = scene.cameras.main.height;

    this.container = scene.add.container(20, h - 210);
    this.container.setDepth(900);

    this.bgGraphics = scene.add.graphics();
    this.container.add(this.bgGraphics);

    this.renderFrame();
    this.setupChannels();
    this.setupInput();

    // Default welcome messages
    this.addMessage('SYSTEM', 'ยินดีต้อนรับสู่ Project Yankee: มหานครนวบูรพา!', 'SYSTEM');
    this.addMessage('SYSTEM', 'ควบคุม: WASD เดิน | คลิกซ้าย ต่อยคอมโบ | คลิกขวา หมัดหนัก | Q แดชสไลด์ | E สถิตวิญญาณ | TAB เมนูสมาร์ตโฟน', 'SYSTEM');
    this.addMessage('SYSTEM', 'กดคุยกับ NPC วินมอเตอร์ไซค์ หรือแม่ทัพสถาบันเพื่อรับบัฟและวาร์ปข้ามโซน!', 'SYSTEM');
  }

  private renderFrame() {
    this.bgGraphics.clear();
    const boxW = 340;
    const boxH = 180;

    // Chat background (Street-punk dark slate)
    this.bgGraphics.fillStyle(0x0a0c16, 0.82);
    this.bgGraphics.fillRoundedRect(0, 0, boxW, boxH, 8);
    this.bgGraphics.lineStyle(1.5, 0x1f2738, 1);
    this.bgGraphics.strokeRoundedRect(0, 0, boxW, boxH, 8);

    // Neon cyan & magenta corner street tags
    this.bgGraphics.fillStyle(0x05d9e8, 1);
    this.bgGraphics.fillRect(0, 0, 18, 3);
    this.bgGraphics.fillRect(0, 0, 3, 18);

    this.bgGraphics.fillStyle(0xff2a6d, 1);
    this.bgGraphics.fillRect(boxW - 18, boxH - 3, 18, 3);
    this.bgGraphics.fillRect(boxW - 3, boxH - 18, 3, 18);
  }

  private setupChannels() {
    const channels: Array<'ALL' | 'FACTION' | 'GANG' | 'SYSTEM'> = ['ALL', 'FACTION', 'GANG', 'SYSTEM'];
    const channelLabels = { ALL: 'ทั้งหมด', FACTION: 'สถาบัน', GANG: 'แก๊ง', SYSTEM: 'ระบบ' };

    channels.forEach((ch, i) => {
      const tabX = i * 75;
      const isSelected = this.activeChannel === ch;

      const tabText = this.scene.add.text(tabX + 10, 6, channelLabels[ch], {
        fontFamily: 'Chakra Petch, sans-serif',
        fontSize: '11px',
        color: isSelected ? '#ff2a6d' : '#8899aa',
        fontStyle: isSelected ? 'bold' : 'normal'
      }).setInteractive({ useHandCursor: true });

      tabText.on('pointerdown', () => {
        this.activeChannel = ch;
        this.renderMessages();
      });

      this.container.add(tabText);
    });

    const divider = this.scene.add.graphics();
    divider.lineStyle(1, 0x222a3d);
    divider.lineBetween(0, 24, 340, 24);
    this.container.add(divider);
  }

  private setupInput() {
    // HTML input placed over chatbox for clean typing in browser
    this.inputDom = document.createElement('input');
    this.inputDom.type = 'text';
    this.inputDom.placeholder = 'กด Enter เพื่อพิมพ์คุย...';
    this.inputDom.style.position = 'absolute';
    this.inputDom.style.left = '25px';
    this.inputDom.style.bottom = '35px';
    this.inputDom.style.width = '320px';
    this.inputDom.style.height = '24px';
    this.inputDom.style.background = 'rgba(15, 20, 32, 0.85)';
    this.inputDom.style.border = '1px solid #05d9e8';
    this.inputDom.style.color = '#ffffff';
    this.inputDom.style.fontFamily = 'Chakra Petch, sans-serif';
    this.inputDom.style.fontSize = '12px';
    this.inputDom.style.padding = '2px 8px';
    this.inputDom.style.outline = 'none';
    this.inputDom.style.zIndex = '500';

    document.getElementById('game-container')?.appendChild(this.inputDom);

    this.inputDom.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = this.inputDom?.value.trim();
        if (val) {
          this.addMessage('Player', val, this.activeChannel);
          if (this.inputDom) this.inputDom.value = '';
          this.inputDom?.blur();
        }
      }
    });
  }

  public addMessage(sender: string, text: string, channel: 'ALL' | 'FACTION' | 'GANG' | 'SYSTEM', faction?: FactionId) {
    const time = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    this.messages.push({
      id: Math.random().toString(),
      sender,
      channel,
      text,
      timestamp: time,
      faction
    });

    if (this.messages.length > 30) {
      this.messages.shift();
    }

    this.renderMessages();
  }

  private renderMessages() {
    this.messageTexts.forEach(t => t.destroy());
    this.messageTexts = [];

    const filtered = this.messages.filter(m => {
      if (this.activeChannel === 'ALL') return true;
      return m.channel === this.activeChannel;
    });

    const displayCount = 6;
    const slice = filtered.slice(-displayCount);

    slice.forEach((msg, idx) => {
      let color = '#ffffff';
      if (msg.channel === 'SYSTEM') color = '#05d9e8';
      else if (msg.channel === 'FACTION') color = '#ff2a6d';
      else if (msg.channel === 'GANG') color = '#ffd700';

      const line = `[${msg.timestamp}] ${msg.sender}: ${msg.text}`;
      const textObj = this.scene.add.text(10, 30 + idx * 20, line, {
        fontFamily: 'Chakra Petch, sans-serif',
        fontSize: '11px',
        color: color,
        wordWrap: { width: 320 }
      });

      this.container.add(textObj);
      this.messageTexts.push(textObj);
    });
  }

  public destroy() {
    if (this.inputDom) {
      this.inputDom.remove();
    }
    this.container.destroy();
  }
}

