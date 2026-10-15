import Phaser from 'phaser';

export type NPCType = 'MISS_POPPY' | 'ELIZABETH' | 'YAMATO' | 'WIN_TAXI' | 'PAWN_VENDOR' | 'SENIOR_GATE' | 'CAFETERIA_AUNT';

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
        texture = 'prop_bosozoku_bike';
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
      case 'SENIOR_GATE':
        texture = 'gearheads_brawler';
        name = 'รุ่นพี่เคนจิ';
        title = 'ผู้คุมกฎหน้าประตูโรงเรียน [Lv.1 Guide]';
        portrait = 'miss_poppy_anime';
        break;
      case 'CAFETERIA_AUNT':
        texture = 'elites_striker';
        name = 'ป้าสมศรี';
        title = 'เจ๊เจ้าของสหกรณ์ & โรงอาหาร';
        portrait = 'elizabeth_anime';
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
          text: '“จะไปไหนน้องชาย? ลุงขับวินสายฟ้าแลบ มุดทะลุรถติดข้ามโซนได้หมด จะไปขึ้นดาดฟ้าซูซูรัน หรือจะไปบุกโรงยิมร้างก็บอกมาเลย!”',
          options: [
            { label: '👑 ไปดาดฟ้าตึกเรียนหลัก (Zone 10 - Boss Hub & Standoff)', action: () => onFastTravel?.('zone_10') },
            { label: '🏫 ไปโถงทางเดินอาคารเรียน (Zone 5 - Lv.5-7)', action: () => onFastTravel?.('zone_5') },
            { label: '🏋️ ไปโรงยิมร้าง (Zone 9 - Sub-Dungeon Lv.10-14)', action: () => onFastTravel?.('zone_9') },
            { label: '🍜 ไปโรงอาหาร & สหกรณ์ (Zone 4 - Safe Zone)', action: () => onFastTravel?.('zone_4') },
            { label: '🚪 กลับหน้าประตูโรงเรียน (Zone 1 - Main Spawn)', action: () => onFastTravel?.('zone_1') }
          ]
        };

      case 'SENIOR_GATE':
        return {
          speaker: this.npcName,
          speakerTitle: this.npcTitle,
          portraitKey: this.portraitKey,
          text: '“เฮ้ยไอ้น้องใหม่! ที่โรงเรียนนี้ไม่มีคำว่าเด็กดีหรอกเว้ย! อยากเอาตัวรอดก็ใช้ WASD เดิน คลิกซ้ายต่อย คลิกขวาหวดหนัก แล้วกด Q พุ่งหลบ! ไปลองซัดหุ่นฟางข้างๆ ก่อน ถ้าพร้อมแล้วก็เดินเข้าวาร์ปขึ้นลานหน้าเสาธงไป!”',
          options: [
            { label: 'รับคำแนะนำการต่อสู้ (Combat Guide)', action: () => alert('เทคนิค: คลิกซ้ายโจมตีต่อเนื่องทำคอมโบ 3 จังหวะ / คลิกขวาเพื่อ Strike ทุบกระจาย / กด 1-4 เพื่อใช้สกิล!') },
            { label: 'ขอพลาสเตอร์ยาฟื้นพลัง x5 (Free Starter Kit)', action: () => alert('ได้รับพลาสเตอร์ยาเริ่มต้น x5 ชิ้น!') },
            { label: 'เข้าใจแล้วครับรุ่นพี่!', action: () => {} }
          ]
        };

      case 'CAFETERIA_AUNT':
        return {
          speaker: this.npcName,
          speakerTitle: this.npcTitle,
          portraitKey: this.portraitKey,
          text: '“เหนื่อยไหมลูกเอ๊ย? มาแวะกินขนมปังยากิโซบะกับน้ำโซดาเย็นๆ ก่อนสิ หรือจะกดตู้น้ำอัตโนมัติข้างๆ เพื่อฟื้นเลือดให้เต็มหลอดก็ได้นะจ๊ะ!”',
          options: [
            { label: '🍞 ขนมปังยากิโซบะฟื้นพลัง (ฟื้นฟู HP/Stamina เต็ม)', action: () => alert('ทานขนมปังยากิโซบะร้อนๆ ฟื้นฟู HP/Stamina เต็มหลอด!') },
            { label: '🧼 รับงานพาร์ทไทม์ล้างจาน (+100 Zen)', action: () => alert('ล้างจานเสร็จเรียบร้อย! ได้รับค่าขนม 100 Zen') },
            { label: 'ขอบคุณครับป้า', action: () => {} }
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

