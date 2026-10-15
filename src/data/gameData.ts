import { FactionData, FactionId, ClassData, PlayerClassId, SkillConfig } from '../types/game';

export const FACTIONS: Record<FactionId, FactionData> = {
  GEARHEADS: {
    id: 'GEARHEADS',
    name: 'The Gearheads',
    subName: 'สถาบันเทคโนโลยีอาชีวะ',
    themeColor: 0xff2a6d,
    hexColor: '#ff2a6d',
    accentColor: '#ff7597',
    leader: 'มิสป๊อปปี้',
    leaderTitle: 'ขุ่นแม่ดงเหล็ก',
    homeBase: 'Rust Port (โซนสนิมเหล็ก)',
    passiveName: 'เลือดเหล็ก & ช่างฝีมือ',
    passives: [
      'เลือดเหล็ก: เพิ่ม HP สูงสุด +15% และลดความเสียหายคริติคอลลง 20%',
      'ช่างฝีมือ: ค่าซ่อมแซมและอัปเกรดอาวุธถูกลง 30%'
    ],
    description: 'นักเรียนสายช่างผู้เชี่ยวชาญเครื่องกลและไฮดรอลิก สู้ด้วยความอึด ถึก และพลังหมัดเหล็กสังหาร'
  },
  ELITES: {
    id: 'ELITES',
    name: 'The Elites',
    subName: 'โรงเรียนเอกชนนานาชาติชั้นสูง',
    themeColor: 0x05d9e8,
    hexColor: '#05d9e8',
    accentColor: '#65fdf0',
    leader: 'อลิซาเบธ',
    leaderTitle: 'ราชินีเลือดเย็น',
    homeBase: 'Sapphire Skyline (โซนหน้าทิพย์)',
    passiveName: 'จุดตาย & ทุนหนา',
    passives: [
      'จุดตาย: เพิ่มค่าความแม่นยำและโอกาสคริติคอล +12%',
      'ทุนหนา: ได้รับเงิน Zen เพิ่ม 25% และซื้อไอเทมฟื้นฟูได้ในราคาพิเศษ'
    ],
    description: 'ทายาทตระกูลไฮโซและนักเรียนหัวกะทิ ใช้พลังสปิริตออร่าแทงทะลวงจุดตายอย่างประณีตและแม่นยำ'
  },
  SYNDICATE: {
    id: 'SYNDICATE',
    name: 'The Syndicate',
    subName: 'โรงเรียนมัธยมรัฐบาล / สายพาณิชย์',
    themeColor: 0x00ff66,
    hexColor: '#00ff66',
    accentColor: '#70ffa0',
    leader: 'ยามาโตะ',
    leaderTitle: 'หมาป่าพเนจร',
    homeBase: 'Neon Alley (โซนตรอกนีออน)',
    passiveName: 'หมาหมู่ & เจ้าถิ่น',
    passives: [
      'หมาหมู่: เมื่อมีสมาชิกในปาร์ตี้/ฝ่ายใกล้กัน เพิ่มความเร็ววิ่ง +15% และหลบหลีก +10%',
      'เจ้าถิ่น: ระยะเวลาเกิดใหม่ (Respawn) ไวขึ้น 35%'
    ],
    description: 'จอมเกเรแห่งตรอกซอกซอย รวมตัวกันด้วยหัวใจนักเลงแท้ๆ ความเร็วจัดจ้านและจำนวนพวกพ้องที่ไร้ขีดจำกัด'
  }
};

export const CLASSES: Record<PlayerClassId, ClassData> = {
  VANGUARD: {
    id: 'VANGUARD',
    name: 'The Vanguard',
    thaiName: 'แนวหน้า',
    role: 'Tank / Hard CC',
    primaryDamageType: 'STRIKE',
    subclasses: ['Juggernaut (เกราะเหล็ก)', 'Riot Guard (ปราบจลาจล)', 'Iron Bastion (กำแพงผีสิง)'],
    description: 'แนวหน้าเกราะหนา รับดาเมจแทนเพื่อน ล็อกขาเป้าหมายด้วยโล่และสนับเข่าเหล็ก',
    baseWeapon: 'โล่ปราบจลาจล & กระบองเหล็ก',
    starterStats: { str: 14, agi: 8, int: 6, dex: 8, vit: 16, luk: 8 }
  },
  BRAWLER: {
    id: 'BRAWLER',
    name: 'The Brawler',
    thaiName: 'ขาลุย',
    role: 'Melee Sustained DPS',
    primaryDamageType: 'STRIKE',
    subclasses: ['Street Boxer (มวยข้างถนน)', 'Grappler (นักทุ่ม)', 'Aura Berserker (คนคลั่งสปิริต)'],
    description: 'ขาลุยแลกหมัดระยะประชิด ยิ่งตียิ่งไว สะสมพลังแค้นปล่อยหมัดคลื่นกระแทก',
    baseWeapon: 'สนับมือหนาม & ผ้าพันมือผ้าดิบ',
    starterStats: { str: 16, agi: 12, int: 6, dex: 10, vit: 12, luk: 4 }
  },
  STRIKER: {
    id: 'STRIKER',
    name: 'The Striker',
    thaiName: 'หน่วยทะลวง',
    role: 'Burst Assassin',
    primaryDamageType: 'SLASH',
    subclasses: ['Shadow Blade (ดาบคู่เงา)', 'Cutthroat (มีดพกเฉือนคอ)', 'Phantom Dasher (สไลด์มรณะ)'],
    description: 'นักฆ่าความเร็วสูง ล้วงแนวหลังศัตรู ปิดบัญชีในคอมโบเดียวด้วยมีดสั้นและดาบคัตเตอร์ยักษ์',
    baseWeapon: 'มีดบาลิซอง & ดาบคัตเตอร์สปิริต',
    starterStats: { str: 12, agi: 16, int: 6, dex: 14, vit: 8, luk: 4 }
  },
  SHARPSHOOTER: {
    id: 'SHARPSHOOTER',
    name: 'The Sharpshooter',
    thaiName: 'ตัวสอย',
    role: 'Ranged DPS',
    primaryDamageType: 'PIERCE',
    subclasses: ['Archery Ace (ชมรมยิงธนู)', 'Sling Bomber (เด็กหลังห้องสายปา)', 'Crossbow Tech (ช่างหน้าไม้)'],
    description: 'สอยศัตรูจากวงนอกระยะปลอดภัยด้วยหน้าไม้ไฮเทคและหนังสติ๊กลูกแก้วสปิริต',
    baseWeapon: 'หน้าไม้พับกลไก & ลูกศรเจาะเกราะ',
    starterStats: { str: 8, agi: 14, int: 8, dex: 16, vit: 8, luk: 6 }
  },
  SUPPLIER: {
    id: 'SUPPLIER',
    name: 'The Supplier',
    thaiName: 'หน่วยเสบียง',
    role: 'Healer / Cleanser',
    primaryDamageType: 'STRIKE',
    subclasses: ['Combat Medic (พยาบาลสนาม)', 'Aura Chemist (เภสัชกรออร่า)', 'Snack Carrier (กระเป๋าสดยูนิต)'],
    description: 'ฝ่ายสนับสนุนสำคัญ ปาเครื่องดื่มชูกำลัง ปฐมพยาบาล และล้างสถานะผิดปกติให้เพื่อนในแก๊ง',
    baseWeapon: 'กระเป๋าพยาบาลยุทธวิธี & สเปรย์แช่แข็ง',
    starterStats: { str: 8, agi: 8, int: 16, dex: 10, vit: 12, luk: 6 }
  },
  INSTIGATOR: {
    id: 'INSTIGATOR',
    name: 'The Instigator',
    thaiName: 'ตัวเปิด',
    role: 'Buffer / Controller (Soft CC)',
    primaryDamageType: 'SLASH',
    subclasses: ['Cheer Captain (ผู้นำเชียร์มรณะ)', 'War Cryer (จอมตะโกนปลุกใจ)', 'Street Idol (ไอดอลออร่า)'],
    description: 'ตัวเปิดไฟต์ ป่วนประสาทศัตรูด้วยโทรโข่งและเสียงหัวเราะเยาะ พร้อมปลุกใจบัฟสถิติเพื่อนรอบตัว',
    baseWeapon: 'โทรโข่งดัดแปลง & ธงสถาบัน',
    starterStats: { str: 10, agi: 10, int: 14, dex: 10, vit: 10, luk: 6 }
  },
  SABOTEUR: {
    id: 'SABOTEUR',
    name: 'The Saboteur',
    thaiName: 'ตัวป่วน',
    role: 'Area Control / Trapper',
    primaryDamageType: 'PIERCE',
    subclasses: ['Trapper (วางกับดักตะปูเรือใบ)', 'Pyromaniac (บอมบ์ขวดไฟ)', 'Electro Specialist (กับดักไฟช็อต)'],
    description: 'เจ้าแห่งการคุมโซน วางกับดักตะปูเรือใบ ระเบิดขวด และปล่อยควันอำพรางตัดกำลังคู่ต่อสู้',
    baseWeapon: 'กล่องชนวน & ระเบิดควันสี',
    starterStats: { str: 10, agi: 12, int: 12, dex: 12, vit: 10, luk: 4 }
  }
};

export const BASE_SKILLS: SkillConfig[] = [
  {
    id: 'skill_attack_primary',
    name: 'Brawl Combo',
    keySlot: 'LCLICK',
    cooldown: 350,
    lastUsedTime: 0,
    auraCost: 0,
    staminaCost: 5,
    damageType: 'STRIKE',
    baseDamage: 25,
    description: 'คอมโบหมัดสามทิศทาง โจมตีศัตรูด้านหน้าอย่างรวดเร็ว',
    iconChar: '👊'
  },
  {
    id: 'skill_heavy_attack',
    name: 'Heavy Strike',
    keySlot: 'RCLICK',
    cooldown: 1200,
    lastUsedTime: 0,
    auraCost: 5,
    staminaCost: 15,
    damageType: 'STRIKE',
    baseDamage: 60,
    description: 'ชาร์จซัดหมัดหนัก ส่งศัตรูกระเด็นถอยหลังพร้อมติดสถานะ Stun',
    iconChar: '💥'
  },
  {
    id: 'skill_dash',
    name: 'Phantom Slide',
    keySlot: 'Q',
    cooldown: 2000,
    lastUsedTime: 0,
    auraCost: 0,
    staminaCost: 25,
    damageType: 'SLASH',
    baseDamage: 15,
    description: 'แดชสไลด์หลบหลีกอย่างรวดเร็ว ได้รับสถานะอมตะชั่วขณะ (I-Frame)',
    iconChar: '⚡'
  },
  {
    id: 'skill_faction_aura',
    name: 'Aura Drive',
    keySlot: '1',
    cooldown: 4000,
    lastUsedTime: 0,
    auraCost: 20,
    staminaCost: 10,
    damageType: 'SLASH',
    baseDamage: 55,
    description: 'ปลดปล่อยคลื่นสปิริตออร่าประจำสถาบัน กวาดล้างศัตรูด้านหน้า',
    iconChar: '🔥'
  },
  {
    id: 'skill_weapon_tech',
    name: 'Steel Pierce',
    keySlot: '2',
    cooldown: 5000,
    lastUsedTime: 0,
    auraCost: 25,
    staminaCost: 15,
    damageType: 'PIERCE',
    baseDamage: 85,
    description: 'แทงทะลวงเกราะศัตรู สร้างความเสียหายทะลุ Defense และมีโอกาสติด Bleed',
    iconChar: '🗡️'
  },
  {
    id: 'skill_spirit_burst',
    name: 'Aura Ignition',
    keySlot: '3',
    cooldown: 8000,
    lastUsedTime: 0,
    auraCost: 40,
    staminaCost: 0,
    damageType: 'STRIKE',
    baseDamage: 120,
    description: 'ระเบิดออร่ารอบตัวเป็นวงกว้าง กระแทกศัตรูทุกตัวที่ล้อมรอบ',
    iconChar: '🌀'
  },
  {
    id: 'skill_tonic',
    name: 'Energy Boost',
    keySlot: '4',
    cooldown: 6000,
    lastUsedTime: 0,
    auraCost: 0,
    staminaCost: 0,
    damageType: 'STRIKE',
    baseDamage: 0,
    description: 'ดื่มเครื่องดื่มชูกำลังตรากระทิงฟ้า ฟื้นฟู 60 HP และ 50 Stamina ทันที',
    iconChar: '🧪'
  },
  {
    id: 'skill_overdrive',
    name: 'Spirit Awakening',
    keySlot: 'E',
    cooldown: 20000,
    lastUsedTime: 0,
    auraCost: 60,
    staminaCost: 0,
    damageType: 'STRIKE',
    baseDamage: 0,
    description: 'เข้าสู่โหมดสถิตวิญญาณ เพิ่มความเร็วเดิน +40% และพลังโจมตี +50% ชั่วคราว',
    iconChar: '👑'
  }
];

