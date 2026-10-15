import Phaser from 'phaser';

export type NPCType = 'MISS_POPPY' | 'ELIZABETH' | 'YAMATO' | 'WIN_TAXI' | 'PAWN_VENDOR';

export interface DialogueNode {
  speaker: string;
  speakerTitle: string;
  portraitKey: string;
  text: string;
  options: {
    label: string;
    action: () => void;
  }[];
}

export class NPC extends Phaser.Physics.Arcade.Sprite {
  public npcType: NPCType;
  public npcName: string;
  public npcTitle: string;
  public portraitKey: string;

  private namePlate: Phaser.GameObjects.Text;
  private promptKey: Phaser.GameObjects.Text;
  private isPlayerNearby: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, type: NPCType) {
    let texture = 'gearheads_brawler';
    let name = 'NPC';
    let title = 'ชาวเมืองนวบูรพา';
    let portrait = 'miss_poppy_anime';

    switch (type) {
      case 'MISS_POPPY':
        texture = 'gearheads_brawler';
        name = 'มิสป๊อปปี้';
        title = 'ผู้นำ The Gearheads [ขุ่นแม่ดงเหล็ก]';
        portrait = 'miss_poppy_anime';
        break;
      case 'ELIZABETH':
        texture = 'elites_striker';
        name = 'อลิซาเบธ';
        title = 'ผู้นำ The Elites [ราชินีเลือดเย็น]';
        portrait = 'elizabeth_anime';
        break;
      case 'YAMATO':
        texture = 'syndicate_delinquent';
        name = 'ยามาโตะ';
        title = 'ผู้นำ The Syndicate [หมาป่าพเนจร]';
        portrait = 'yamato_anime';
        break;
      case 'WIN_TAXI':
        texture = 'motorcycle';
        name = 'วินลุงเดช';
        title = 'คิววินมอเตอร์ไซค์ ซิ่งข้ามโซน';
        portrait = 'yamato_anime';
        break;
      case 'PAWN_VENDOR':
        texture = 'gearheads_brawler';
        name = 'เฮียเส็ง คลองถม';
        title = 'โรงรับจำนำ & ตลาดมืดนวบูรพา';
        portrait = 'miss_poppy_anime';
        break;
    }

    super(scene, x, y, texture, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.npcType = type;
    this.npcName = name;
    this.npcTitle = title;
    this.portraitKey = portrait;

    this.setImmovable(true);
    this.setDepth(y);

    if (type === 'WIN_TAXI') {
      this.setSize(44, 24);
    } else {
      this.setSize(28, 24);
      this.setOffset(18, 38);
    }

    // Nameplate
    this.namePlate = scene.add.text(x, y - (type === 'WIN_TAXI' ? 30 : 52), `${this.npcName}\n[${this.npcTitle}]`, {
      fontFamily: 'Chakra Petch, sans-serif',
      fontSize: '11px',
      color: '#ffd700',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // Press [F] or Click prompt
    this.promptKey = scene.add.text(x, y - (type === 'WIN_TAXI' ? 50 : 76), '▼ กดคุย [F / คลิก]', {
      fontFamily: 'Share Tech Mono, monospace',
      fontSize: '10px',
      color: '#00ff66',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setVisible(false);

    // Bobbing tween for prompt
    scene.tweens.add({
      targets: this.promptKey,
      y: this.promptKey.y - 4,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    this.setInteractive({ useHandCursor: true });
  }

  public checkPlayerDistance(playerX: number, playerY: number): boolean {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    this.isPlayerNearby = dist < 75;
    this.promptKey.setVisible(this.isPlayerNearby);
    return this.isPlayerNearby;
  }

  public getDialogue(onFastTravel?: (targetZone: string) => void): DialogueNode {
    switch (this.npcType) {
      case 'MISS_POPPY':
        return {
          speaker: this.npcName,
          speakerTitle: this.npcTitle,
          portraitKey: this.portraitKey,
          text: '“ไอ้หนู! แกอยากให้หมัดแกหนักขึ้น หรืออยากให้ชุดเกราะเหล็กแกทนส้นตีนพวกแก๊งอื่น? ที่ Rust Port พวกเราไม่พูดเยอะ ถ้าใจพร้อมก็หยิบประแจแล้วตามแม่มา!”',
          options: [
            { label: 'รับบัฟสถาบัน: เลือดเหล็ก & ช่างฝีมือ', action: () => alert('ได้รับพรแห่ง The Gearheads: Max HP +15%!') },
            { label: 'ซ่อมแซมและบำรุงรักษาอาวุธ', action: () => alert('ซ่อมอาวุธเสร็จสิ้น! คืนค่าความคงทน 100%') },
            { label: 'ไว้เจอกันครับขุ่นแม่', action: () => {} }
          ]
        };

      case 'ELIZABETH':
        return {
          speaker: this.npcName,
          speakerTitle: this.npcTitle,
          portraitKey: this.portraitKey,
          text: '“ความป่าเถื่อนไร้ทิศทางมีแต่จะนำพาความพ่ายแพ้มาสู่แก... The Elites ปกครองเมืองนี้ด้วยสติปัญญาและวิชาแทงจุดตาย จงทำตัวให้มีค่า แล้วฉันจะมอบเกียรติยศให้”',
          options: [
            { label: 'รับบัฟสถาบัน: จุดตาย & ทุนหนา', action: () => alert('ได้รับพรแห่ง The Elites: Critical Rate +12%!') },
            { label: 'เบิกจ่ายทุนการศึกษาสปิริตออร่า', action: () => alert('ได้รับทุนสนับสนุน 500 Zen!') },
            { label: 'ขอตัวก่อนครับท่านประธาน', action: () => {} }
          ]
        };

      case 'YAMATO':
        return {
          speaker: this.npcName,
          speakerTitle: this.npcTitle,
          portraitKey: this.portraitKey,
          text: '“ใน Neon Alley ไม่มีใครสู้คนเดียวหรอกเว้ย... เมื่อไหร่ที่หมาป่าหอน เพื่อนในฝูงจะวิ่งมารวมตัวกัน แกพร้อมจะลุยข้ามเขตไปเหยียบพวกหน้าทิพย์รึยังล่ะ?”',
          options: [
            { label: 'รับบัฟสถาบัน: หมาหมู่ & เจ้าถิ่น', action: () => alert('ได้รับพรแห่ง The Syndicate: ความเร็ววิ่ง +15%!') },
            { label: 'ชวนตั้งปาร์ตี้ลงดันเจี้ยน Tartarus', action: () => alert('ค้นหาปาร์ตี้ในเขต Neon Alley สำเร็จ!') },
            { label: 'เจอกันกลางไฟต์ลูกพี่', action: () => {} }
          ]
        };

      case 'WIN_TAXI':
        return {
          speaker: this.npcName,
          speakerTitle: this.npcTitle,
          portraitKey: this.portraitKey,
          text: '“จะไปไหนน้องชาย? ลุงขับวินสายฟ้าแลบ มุดทะลุรถติดข้ามโซนได้หมด จะไปชอปปิ้งตลาดกลาง หรือจะไปโดนตบที่ Apex Ground Zero ก็บอกมาเลย!”',
          options: [
            { label: '🚏 ไป Crossroads Trade District (ตลาดกลาง)', action: () => onFastTravel?.('CROSSROADS') },
            { label: '🏭 ไป Rust Port (เขต The Gearheads)', action: () => onFastTravel?.('RUST_PORT') },
            { label: '🌃 ไป Neon Alley (เขต The Syndicate)', action: () => onFastTravel?.('NEON_ALLEY') },
            { label: '🏛️ ไป Sapphire Skyline (เขต The Elites)', action: () => onFastTravel?.('SAPPHIRE') },
            { label: '⚠️ ไป Apex Ground Zero (เขต Free PK ดงสงคราม!)', action: () => onFastTravel?.('APEX') }
          ]
        };

      case 'PAWN_VENDOR':
        return {
          speaker: this.npcName,
          speakerTitle: this.npcTitle,
          portraitKey: this.portraitKey,
          text: '“ยินดีต้อนรับสู่โรงรับจำนำคลองถม! มีเศษเหล็กจากมอนสเตอร์ หรืออยากเอาชุดเก่ามาสลายเป็นผงออร่าช่างไหมล่ะ? ที่นี่รับซื้อหมด ราคายุติธรรม!”',
          options: [
            { label: '💰 ขายขยะมอนสเตอร์ทั้งหมด', action: () => alert('ขายเศษเหล็กและของเหลือใช้ ได้รับ 350 Zen!') },
            { label: '🔨 สลายอุปกรณ์เหลือใช้เป็นผงวัตถุดิบ (Crafting)', action: () => alert('สลายอุปกรณ์สำเร็จ! ได้รับ Aura Dust x10') },
            { label: '📦 เปิดดูสินค้าตลาดมืด (Black Market)', action: () => alert('เปิดหน้าต่างประมูลกลาง') },
            { label: 'ไว้แวะมาใหม่ครับเฮีย', action: () => {} }
          ]
        };
    }
  }

  public destroy(fromScene?: boolean) {
    this.namePlate.destroy();
    this.promptKey.destroy();
    super.destroy(fromScene);
  }
}

