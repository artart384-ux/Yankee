import Phaser from 'phaser';
import { DialogueNode } from '../entities/NPC';
import { SoundSynthesizer } from '../systems/SoundSynthesizer';

export class DialogueModal {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private bgGraphics: Phaser.GameObjects.Graphics;
  private portraitImage: Phaser.GameObjects.Image;
  private speakerText: Phaser.GameObjects.Text;
  private titleText: Phaser.GameObjects.Text;
  private dialogueBodyText: Phaser.GameObjects.Text;
  private optionButtons: Phaser.GameObjects.Container[] = [];
  private soundSynth: SoundSynthesizer;
  public isOpen: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.soundSynth = SoundSynthesizer.getInstance();

    const w = scene.cameras.main.width;
    const h = scene.cameras.main.height;

    this.container = scene.add.container(0, 0);
    this.container.setDepth(1000);
    this.container.setVisible(false);

    // Dim overlay behind dialog
    this.bgGraphics = scene.add.graphics();
    this.container.add(this.bgGraphics);

    // Left Portrait Frame
    this.portraitImage = scene.add.image(140, h - 130, 'miss_poppy_anime');
    this.portraitImage.setDisplaySize(160, 200);
    this.container.add(this.portraitImage);

    // Speaker Name Plate
    this.speakerText = scene.add.text(250, h - 215, '', {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.container.add(this.speakerText);

    // Title Tag
    this.titleText = scene.add.text(250, h - 190, '', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '12px',
      color: '#05d9e8'
    });
    this.container.add(this.titleText);

    // Main Dialogue text
    this.dialogueBodyText = scene.add.text(250, h - 165, '', {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '15px',
      color: '#e0e5ff',
      wordWrap: { width: Math.max(300, w - 300) },
      lineSpacing: 6
    });
    this.container.add(this.dialogueBodyText);
  }

  public show(node: DialogueNode) {
    this.isOpen = true;
    this.container.setVisible(true);
    this.soundSynth.playUI();

    const w = this.scene.cameras.main.width;
    const h = this.scene.cameras.main.height;

    // Draw Dialog Window
    this.bgGraphics.clear();
    // Backdrop dim
    this.bgGraphics.fillStyle(0x05060a, 0.65);
    this.bgGraphics.fillRect(0, 0, w, h);

    // Dialog Box
    const boxY = h - 240;
    const boxH = 220;
    this.bgGraphics.fillStyle(0x0e111a, 0.95);
    this.bgGraphics.fillRect(20, boxY, w - 40, boxH);

    // Tech Neon Accent borders
    this.bgGraphics.lineStyle(2, 0xff2a6d, 1);
    this.bgGraphics.strokeRect(20, boxY, w - 40, boxH);
    this.bgGraphics.lineStyle(1, 0x05d9e8, 0.8);
    this.bgGraphics.strokeRect(24, boxY + 4, w - 48, boxH - 8);

    // Corner decorative notches
    this.bgGraphics.fillStyle(0x05d9e8, 1);
    this.bgGraphics.fillRect(20, boxY, 12, 4);
    this.bgGraphics.fillRect(20, boxY, 4, 12);
    this.bgGraphics.fillRect(w - 32, boxY, 12, 4);
    this.bgGraphics.fillRect(w - 24, boxY, 4, 12);

    // Update Portrait
    if (this.scene.textures.exists(node.portraitKey)) {
      this.portraitImage.setTexture(node.portraitKey);
      this.portraitImage.setVisible(true);
    } else {
      this.portraitImage.setVisible(false);
    }

    this.speakerText.setText(node.speaker);
    this.titleText.setText(node.speakerTitle);
    this.dialogueBodyText.setText(node.text);

    // Clear previous option buttons
    this.optionButtons.forEach(btn => btn.destroy());
    this.optionButtons = [];

    // Render interactive options
    let optY = h - 85;
    node.options.forEach((opt, idx) => {
      const btnContainer = this.scene.add.container(250 + (idx % 2) * 340, optY + Math.floor(idx / 2) * 36);

      const btnBg = this.scene.add.graphics();
      btnBg.fillStyle(0x1a2133, 0.9);
      btnBg.fillRect(0, 0, 320, 30);
      btnBg.lineStyle(1, 0x05d9e8, 0.6);
      btnBg.strokeRect(0, 0, 320, 30);

      const label = this.scene.add.text(12, 6, `▶ ${opt.label}`, {
        fontFamily: 'Chakra Petch, sans-serif',
        fontSize: '13px',
        color: '#ffffff'
      });

      btnContainer.add([btnBg, label]);
      btnContainer.setSize(320, 30);
      btnContainer.setInteractive({ useHandCursor: true });

      btnContainer.on('pointerover', () => {
        btnBg.clear();
        btnBg.fillStyle(0xff2a6d, 0.95);
        btnBg.fillRect(0, 0, 320, 30);
        btnBg.lineStyle(1, 0xffffff, 1);
        btnBg.strokeRect(0, 0, 320, 30);
        this.soundSynth.playUI();
      });

      btnContainer.on('pointerout', () => {
        btnBg.clear();
        btnBg.fillStyle(0x1a2133, 0.9);
        btnBg.fillRect(0, 0, 320, 30);
        btnBg.lineStyle(1, 0x05d9e8, 0.6);
        btnBg.strokeRect(0, 0, 320, 30);
      });

      btnContainer.on('pointerdown', () => {
        this.soundSynth.playUI();
        this.hide();
        opt.action();
      });

      this.container.add(btnContainer);
      this.optionButtons.push(btnContainer);
    });
  }

  public hide() {
    this.isOpen = false;
    this.container.setVisible(false);
  }
}

