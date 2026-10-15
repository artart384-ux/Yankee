import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { WorldScene } from './WorldScene';
import { NeoNavHUD } from '../ui/NeoNavHUD';
import { ChatBox } from '../ui/ChatBox';
import { SmartphoneMenu } from '../ui/SmartphoneMenu';
import { DialogueModal } from '../ui/DialogueModal';
import { DialogueNode } from '../entities/NPC';

export class UIScene extends Phaser.Scene {
  private player!: Player;
  private worldScene!: WorldScene;
  private hud!: NeoNavHUD;
  private chatBox!: ChatBox;
  private phoneMenu!: SmartphoneMenu;
  private dialogueModal!: DialogueModal;

  constructor() {
    super('UIScene');
  }

  init(data: { player: Player; worldScene: WorldScene }) {
    this.player = data.player;
    this.worldScene = data.worldScene;
  }

  create() {
    // 1. Create Smartphone Menu Drawer
    this.phoneMenu = new SmartphoneMenu(this, this.player);

    // 2. Create Dialogue Modal
    this.dialogueModal = new DialogueModal(this);

    // 3. Create NEO-NAV HUD Overlay
    this.hud = new NeoNavHUD(this, this.player, () => {
      this.phoneMenu.toggle();
    });

    // 4. Create Street Chat Box
    this.chatBox = new ChatBox(this);

    // 5. Connect WorldScene Events
    this.worldScene.events.on('CHAT_LOG', (channel: 'ALL' | 'FACTION' | 'GANG' | 'SYSTEM', text: string) => {
      this.chatBox.addMessage('System', text, channel, this.player.factionId);
    });

    this.worldScene.events.on('SHOW_DIALOGUE', (node: DialogueNode) => {
      this.dialogueModal.show(node);
    });

    this.worldScene.events.on('TOGGLE_PHONE', () => {
      this.phoneMenu.toggle();
    });
  }

  public isDialogueOpen(): boolean {
    return this.dialogueModal?.isOpen || this.phoneMenu?.isOpen || false;
  }

  update() {
    if (!this.player || !this.hud) return;
    this.hud.update(this.worldScene.currentZone);
  }

  destroy() {
    this.chatBox?.destroy();
    this.hud?.destroy();
  }
}

