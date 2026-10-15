# 🎮 PROJECT YANKEE (โปรเจกต์แยงกี้ - มหานครนวบูรพา)

> **Web-Based MMORPG (Action-Brawler Non-Target)**  
> **Game Engine**: Phaser 3 (TypeScript + Vite)  
> **Art Style**: 2.5D Isometric Retro Pixel Art (16/32-bit SD) + High-Fidelity Anime Street-Punk UI  

---

## ⚡ วิธีเปิดเกมเล่น (Quick Start)

รันคำสั่งต่อไปนี้ใน Terminal เพื่อเริ่มเล่นเกมได้ทันที:

```bash
# 1. ติดตั้ง Dependencies (ทำครั้งแรก)
npm install

# 2. รัน Local Development Server
npm run dev
```

เปิดเบราว์เซอร์ไปที่: `http://localhost:3000`

หากต้องการ Build สำหรับนำไป Deploy บนเว็บจริง:
```bash
npm run build
npm run preview
```

หากต้องการ Re-generate ชุด Asset พิกเซลทั้งหมด:
```bash
npm run generate:assets
```

---

## 🕹️ การควบคุม (Game Controls)

| ปุ่มกด / การควบคุม | ฟังก์ชันการทำงาน |
| :--- | :--- |
| **W, A, S, D / ปุ่มลูกศร** | เคลื่อนที่ 8 ทิศทางแบบ 2.5D Isometric |
| **เลื่อนเมาส์ (Mouse Aim)** | เล็งทิศทางสปิริตออร่าและการโจมตี |
| **คลิกซ้าย (LMB)** | คอมโบหมัดประชิด 3 จังหวะ (Punch 1 ➔ Punch 2 ➔ Finishing Uppercut) |
| **คลิกขวา (RMB)** | Heavy Strike หมัดชาร์จหนัก ส่งศัตรูกระเด็นถอยหลัง |
| **Q** | **Phantom Slide**: แดชสไลด์หลบหลีก มีสถานะอมตะชั่วขณะ (I-Frame) พร้อมเงาวิญญาณ |
| **1** | **Aura Drive**: ปลดปล่อยคลื่นสปิริตออร่าประจำสถาบัน กวาดล้างศัตรูด้านหน้า (Slash) |
| **2** | **Steel Pierce**: แทงทะลวงเกราะ เจาะลึก Defense ศัตรู (Pierce) |
| **3** | **Aura Ignition**: ระเบิดสปิริตออร่ารอบตัว 360 องศา กระแทกศัตรูรอบทิศ (Strike) |
| **4** | **Energy Boost**: ดื่มเครื่องดื่มชูกำลังตรากระทิงฟ้า ฟื้นฟู 60 HP + 50 Stamina |
| **E** | **Spirit Awakening (Overdrive)**: สถิตวิญญาณ เพิ่มความเร็วเดิน +40% และดาเมจ +50% |
| **F หรือ คลิกที่ตัวละคร** | คุยกับ NPC (วินมอเตอร์ไซค์, โรงรับจำนำ, ผู้นำสถาบัน) |
| **TAB หรือ M หรือคลิกปุ่ม 📱** | เปิดหน้าต่างสมาร์ตโฟน **NEO-NAV** (อัปสเตตัส, ดูกระเป๋า, แผนที่อิทธิพล, ระบบแก๊ง) |

---

## 🏫 ระบบ 3 สถาบันหลัก (Tri-Faction System)

1. **The Gearheads (สถาบันเทคโนโลยีอาชีวะ)**
   * **ผู้นำ**: มิสป๊อปปี้ (ขุ่นแม่ดงเหล็ก)
   * **โทนสี**: ชมพู / แดงสนิม (`#ff2a6d`)
   * **ฐานที่มั่น**: Rust Port (โซนสนิมเหล็ก)
   * **บัฟพิเศษ**: *เลือดเหล็ก* (เพิ่ม HP สูงสุด +15% / ลดดาเมจคริติคอล 20%) และ *ช่างฝีมือ* (ซ่อมแซมและอัปเกรดอาวุธถูกลง 30%)

2. **The Elites (โรงเรียนเอกชนนานาชาติชั้นสูง)**
   * **ผู้นำ**: อลิซาเบธ (ราชินีเลือดเย็น)
   * **โทนสี**: น้ำเงิน / แซฟไฟร์ (`#05d9e8`)
   * **ฐานที่มั่น**: Sapphire Skyline (โซนหน้าทิพย์)
   * **บัฟพิเศษ**: *จุดตาย* (เพิ่มความแม่นยำและโอกาสคริติคอล +12%) และ *ทุนหนา* (ได้รับเงิน Zen เพิ่ม 25% ซื้อไอเทมราคาพิเศษ)

3. **The Syndicate (โรงเรียนมัธยมรัฐบาล / สายพาณิชย์)**
   * **ผู้นำ**: ยามาโตะ (หมาป่าพเนจร)
   * **โทนสี**: เขียวนีออน (`#00ff66`)
   * **ฐานที่มั่น**: Neon Alley (โซนตรอกนีออน)
   * **บัฟพิเศษ**: *หมาหมู่* (เพิ่มความเร็ววิ่ง +15% และหลบหลีก +10%) และ *เจ้าถิ่น* (เกิดใหม่ไวขึ้น 35%)

---

## ⚔️ ระบบ 7 คลาสอาชีพหลัก (7 Classes)

* **The Vanguard (แนวหน้า)**: สาย Tank & Hard CC อึด ถึก บล็อกดาเมจแทนเพื่อน
* **The Brawler (ขาลุย)**: สาย Melee Sustained DPS ยืนแลกหมัดต่อเนื่อง ยิ่งตียิ่งเร็ว
* **The Striker (หน่วยทะลวง)**: สาย Assassin Burst ความเร็วสูง ปิดบัญชีในคอมโบเดียว
* **The Sharpshooter (ตัวสอย)**: สาย Ranged DPS สอยจากวงนอกด้วยหน้าไม้และหนังสติ๊ก
* **The Supplier (หน่วยเสบียง)**: สาย Healer & Cleanser โยนยา ปฐมพยาบาล ล้างสถานะ
* **The Instigator (ตัวเปิด)**: สาย Buffer & Soft CC ป่วนประสาทศัตรูและปลุกใจเพื่อนร่วมทีม
* **The Saboteur (ตัวป่วน)**: สาย Area Control วางกับดักตะปู ระเบิดควัน และคุมโซน

---

## 🎨 ทิศทางงานศิลป์และ Assets ที่สร้างขึ้น

โปรเจกต์มีระบบ Asset Pipeline ครบถ้วน:
1. **ภาพประกอบสไตล์ High-Fidelity Anime Street-Punk**:
   * ภาพพอร์ตเทรตขนาดใหญ่ของผู้นำสถาบันทั้ง 3 คน (มิสป๊อปปี้, อลิซาเบธ, ยามาโตะ) สำหรับใช้ในหน้าต่างบทสนทนาและหน้าเลือกตัวละคร
2. **2.5D Isometric Retro Pixel Art Spritesheets (16/32-bit SD)**:
   * Spritesheet ตัวละคร 3 สถาบัน พร้อมเฟรม Idle, เดิน/วิ่ง, โจมตี 1, โจมตี 2, แดช, เจ็บ
   * Spritesheet ศัตรู: แก๊งเกเรนอกคอก (Enemy Thug), โดรนตรวจการสนิมเหล็ก (Patrol Drone), หุ่นซ้อมสปิริต (Training Dummy)
   * Street Props: ตู้กดน้ำอัตโนมัติไฟนีออน, เสาไฟถนนนีออน, ถังขยะพ่นลายกราฟิตี้, รั้วกั้นเขตอันตราย Apex, รถมอเตอร์ไซค์วินลุงเดช
   * Street Tileset: พื้นถนนแอสฟัลต์, ทางม้าลายพ่นสีสตรีท, ฝาท่อระบายน้ำ, ขอบทางนีออน
   * Combat VFX: คลื่นฟัน Slash, ลำแสงแทง Pierce, วงกระแทก Strike, ดาวประกายสปาร์ก
3. **Web Audio Synthesizer**:
   * เสียงเอฟเฟกต์ต่อย, ฟัน, แทง, แดช, ระเบิดออร่า, เลเวลอัป, และเพลง BGM ซินธ์เวฟสตรีทพังก์ที่เล่นผ่าน Web Audio API โดยไม่ต้องโหลดไฟล์ภายนอก

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
c:\Users\Newdawn\Documents\Yankee\
├── index.html                  # HTML Shell หน้าเว็บเกม
├── package.json                # Config และ Dependencies (Phaser 3, Vite, TS)
├── tsconfig.json               # TypeScript Compiler Options
├── vite.config.ts              # Vite Bundler Config
├── scripts/
│   └── generate-assets.cjs     # ตัวสร้าง Asset พิกเซลอาร์ตอัตโนมัติ
├── public/
│   └── assets/
│       ├── portraits/          # ภาพ Anime Street-Punk ของผู้นำสถาบัน
│       ├── sprites/            # Spritesheet ตัวละคร, ศัตรู, หุ่นซ้อม
│       ├── props/              # พร็อพฉากเมือง (ตู้กดน้ำ, วินมอไซค์, เสาไฟ)
│       ├── tiles/              # Tileset พื้นถนนสตรีท
│       └── vfx/                # เอฟเฟกต์การต่อสู้ (Slash, Pierce, Strike)
└── src/
    ├── main.ts                 # Phaser Game Initialization
    ├── types/game.ts           # Game Data Types & Interfaces
    ├── data/gameData.ts        # Database สถาบัน, คลาส, สกิล
    ├── systems/
    │   ├── CombatSystem.ts     # คำนวณดาเมจ, เจาะเกราะ, คริติคอล, สถานะ
    │   ├── StatsSystem.ts      # สูตรสเตตัส STR, AGI, INT, DEX, VIT, LUK, เลเวล
    │   └── SoundSynthesizer.ts # ซินธ์เสียง SFX และเพลง BGM สไตล์ 16/32-bit
    ├── entities/
    │   ├── Player.ts           # ระบบบังคับตัวละคร, คอมโบ, สกิล, แดช, ออร่า
    │   ├── Enemy.ts            # ศัตรู, AI ไล่ตาม, หุ่นซ้อมรับดาเมจ
    │   └── NPC.ts              # NPC ในเมือง, บทสนทนา, วินมอไซค์วาร์ปข้ามโซน
    ├── ui/
    │   ├── NeoNavHUD.ts        # HUD สมาร์ตโฟน (หลอดเลือด, มินิแมพ, ฮ็อตบาร์สกิล)
    │   ├── ChatBox.ts          # กล่องแชทแบ่ง 4 ช่อง [ทั้งหมด, สถาบัน, แก๊ง, ระบบ]
    │   ├── SmartphoneMenu.ts   # เมนูมือถือ NEO-NAV (อัปสเตตัส, คราฟต์, แย่งเมือง, แก๊ง)
    │   └── DamageText.ts       # ตัวเลขดาเมจลอยตามประเภท (Slash, Pierce, Strike)
    └── scenes/
        ├── BootScene.ts            # โหลด Asset และสร้าง Global Animations
        ├── CharacterSelectScene.ts # หน้าเลือกสถาบันและ 7 คลาสอาชีพ
        ├── WorldScene.ts           # แผนที่โลก 2.5D และระบบต่อสู้แบบ Non-target
        └── UIScene.ts              # ฉาก Overlay UI แบบ Real-time
```

