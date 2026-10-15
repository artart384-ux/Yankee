import { DamageType, PlayerClassId, SkillConfig, StatusEffectType } from '../types/game';

export interface ClassSkillSpec {
  id: string;
  name: string;
  keySlot: 'LCLICK' | 'RCLICK' | '1' | '2' | '3' | '4' | 'Q' | 'E';
  iconChar: string;
  cooldown: number;
  auraCost: number;
  staminaCost: number;
  baseDamage: number;
  damageType: DamageType;
  description: string;
  skillType:
    | 'melee_strike'
    | 'melee_dash'
    | 'melee_aoe'
    | 'ranged_single'
    | 'ranged_multi'
    | 'ranged_pierce'
    | 'ranged_ground_aoe'
    | 'heal_self_party'
    | 'cleanse_buff'
    | 'sonic_cone'
    | 'trap_place'
    | 'buff_self'
    | 'buff_party';
  projectileType?: 'SLING_BALL' | 'PIERCE_BOLT' | 'MOLOTOV' | 'TONIC_BOTTLE' | 'SONIC_WAVE' | 'CALTROPS' | 'CHAIN_WHIP';
  range: number;
  statusEffect?: StatusEffectType;
}

export interface ClassCombatConfig {
  classId: PlayerClassId;
  name: string;
  thaiName: string;
  attackType: 'melee' | 'ranged';
  primaryRange: number;
  primaryCooldownMs: number;
  primaryDamageType: DamageType;
  projectileType?: 'SLING_BALL' | 'PIERCE_BOLT' | 'MOLOTOV' | 'TONIC_BOTTLE' | 'SONIC_WAVE' | 'CALTROPS' | 'CHAIN_WHIP';
  projectileSpeed?: number;
  skills: Record<string, ClassSkillSpec>;
}

export const CLASS_COMBAT_CONFIGS: Record<PlayerClassId, ClassCombatConfig> = {
  VANGUARD: {
    classId: 'VANGUARD',
    name: 'The Vanguard',
    thaiName: 'แนวหน้า',
    attackType: 'melee',
    primaryRange: 75,
    primaryCooldownMs: 500,
    primaryDamageType: 'STRIKE',
    skills: {
      LCLICK: {
        id: 'vanguard_primary',
        name: 'Riot Shield Sweep',
        keySlot: 'LCLICK',
        iconChar: '🛡️',
        cooldown: 500,
        auraCost: 0,
        staminaCost: 6,
        baseDamage: 28,
        damageType: 'STRIKE',
        description: 'กวาดฝาถังขยะ/โล่ปราบจลาจลด้านหน้าเป็นรูปพัดระยะ 75px',
        skillType: 'melee_strike',
        range: 75
      },
      RCLICK: {
        id: 'vanguard_heavy',
        name: 'Shield Slam',
        keySlot: 'RCLICK',
        iconChar: '💥',
        cooldown: 1200,
        auraCost: 5,
        staminaCost: 15,
        baseDamage: 65,
        damageType: 'STRIKE',
        description: 'กระแทกโล่ลงพื้นอย่างแรง ศัตรูชะงักติด Stun ชั่วขณะ',
        skillType: 'melee_strike',
        range: 90,
        statusEffect: 'FRACTURE'
      },
      '1': {
        id: 'vanguard_shield_bash',
        name: 'พุ่งชนโล่ (Shield Bash)',
        keySlot: '1',
        iconChar: '🐗',
        cooldown: 5000,
        auraCost: 15,
        staminaCost: 15,
        baseDamage: 75,
        damageType: 'STRIKE',
        description: 'พุ่งชน 180px ด้านหน้า กระแทกศัตรูติด Stun 1.5 วินาที',
        skillType: 'melee_dash',
        range: 180,
        statusEffect: 'FRACTURE'
      },
      '2': {
        id: 'vanguard_sweep',
        name: 'กวาดล้าง (Sweeping Strike)',
        keySlot: '2',
        iconChar: '🔄',
        cooldown: 6000,
        auraCost: 20,
        staminaCost: 12,
        baseDamage: 85,
        damageType: 'STRIKE',
        description: 'ฟาดหมุนรอบตัว 110px ลดความเร็วเคลื่อนที่ศัตรู 40%',
        skillType: 'melee_aoe',
        range: 110
      },
      '3': {
        id: 'vanguard_earthquake',
        name: 'กระทืบปฐพี (Ground Quake)',
        keySlot: '3',
        iconChar: '🌋',
        cooldown: 9000,
        auraCost: 35,
        staminaCost: 20,
        baseDamage: 130,
        damageType: 'STRIKE',
        description: 'กระทืบพื้นสร้างคลื่นสะเทือน 160px รอบตัว ดาเมจมหาศาล',
        skillType: 'melee_aoe',
        range: 160,
        statusEffect: 'FRACTURE'
      },
      '4': {
        id: 'vanguard_bandage',
        name: 'ผ้าพันแผลด่วน (Quick Wrap)',
        keySlot: '4',
        iconChar: '🩹',
        cooldown: 8000,
        auraCost: 0,
        staminaCost: 0,
        baseDamage: 0,
        damageType: 'STRIKE',
        description: 'พันแผลด่วน ฟื้นฟู 70 HP และ 40 Stamina ทันที',
        skillType: 'heal_self_party',
        range: 0
      },
      Q: {
        id: 'vanguard_taunt',
        name: 'ยั่วยุ (Street Taunt)',
        keySlot: 'Q',
        iconChar: '📢',
        cooldown: 8000,
        auraCost: 10,
        staminaCost: 15,
        baseDamage: 20,
        damageType: 'STRIKE',
        description: 'ตะโกนท้าทาย บังคับศัตรูในระยะ 200px หันมาโจมตีตัวเอง',
        skillType: 'melee_aoe',
        range: 200
      },
      E: {
        id: 'vanguard_iron_guard',
        name: 'ตั้งการ์ดเหล็ก (Iron Guard)',
        keySlot: 'E',
        iconChar: '🛡️',
        cooldown: 14000,
        auraCost: 40,
        staminaCost: 10,
        baseDamage: 0,
        damageType: 'STRIKE',
        description: 'ยกโล่ตั้งการ์ด ลดความเสียหายที่ได้รับ 60% นาน 6 วินาที',
        skillType: 'buff_self',
        range: 0
      }
    }
  },

  BRAWLER: {
    classId: 'BRAWLER',
    name: 'The Brawler',
    thaiName: 'ขาลุย',
    attackType: 'melee',
    primaryRange: 65,
    primaryCooldownMs: 320,
    primaryDamageType: 'STRIKE',
    skills: {
      LCLICK: {
        id: 'brawler_primary',
        name: 'Knuckle Combo',
        keySlot: 'LCLICK',
        iconChar: '👊',
        cooldown: 320,
        auraCost: 0,
        staminaCost: 4,
        baseDamage: 24,
        damageType: 'STRIKE',
        description: 'รัวหมัดสนับมือต่อเนื่อง 3 จังหวะระยะประชิด 65px',
        skillType: 'melee_strike',
        range: 65
      },
      RCLICK: {
        id: 'brawler_heavy',
        name: 'Haymaker Punch',
        keySlot: 'RCLICK',
        iconChar: '🥊',
        cooldown: 1000,
        auraCost: 5,
        staminaCost: 12,
        baseDamage: 60,
        damageType: 'STRIKE',
        description: 'เหวี่ยงฮุกขวาเต็มข้อ น็อกศัตรูกระเด็นถอยหลัง',
        skillType: 'melee_strike',
        range: 80,
        statusEffect: 'FRACTURE'
      },
      '1': {
        id: 'brawler_double_jab',
        name: 'หมัดแย็บคู่ (Double Jab)',
        keySlot: '1',
        iconChar: '⚡',
        cooldown: 4000,
        auraCost: 10,
        staminaCost: 10,
        baseDamage: 68,
        damageType: 'STRIKE',
        description: 'สาวหมัดแย็บซ้าย-ขวารวดเร็ว 3 ฮิตติดกัน',
        skillType: 'melee_strike',
        range: 75
      },
      '2': {
        id: 'brawler_uppercut',
        name: 'อัปเปอร์คัต (Rising Uppercut)',
        keySlot: '2',
        iconChar: '🥊',
        cooldown: 5500,
        auraCost: 15,
        staminaCost: 14,
        baseDamage: 90,
        damageType: 'STRIKE',
        description: 'เสยหมัดขวาขึ้นฟ้า ทำให้ศัตรูลอยชะงัก (Stun)',
        skillType: 'melee_strike',
        range: 75,
        statusEffect: 'FRACTURE'
      },
      '3': {
        id: 'brawler_flurry',
        name: 'สนับมือคลั่ง (Fist Flurry)',
        keySlot: '3',
        iconChar: '🔥',
        cooldown: 8000,
        auraCost: 30,
        staminaCost: 20,
        baseDamage: 140,
        damageType: 'STRIKE',
        description: 'รัวหมัดรอบทิศทาง 8 ฮิตติดต่อกันอย่างบ้าคลั่ง',
        skillType: 'melee_aoe',
        range: 120
      },
      '4': {
        id: 'brawler_tonic',
        name: 'กระทิงดุ (Energy Drink)',
        keySlot: '4',
        iconChar: '🥤',
        cooldown: 7000,
        auraCost: 0,
        staminaCost: 0,
        baseDamage: 0,
        damageType: 'STRIKE',
        description: 'กระดกเครื่องดื่มชูกำลัง ฟื้น Stamina เต็ม 100%',
        skillType: 'heal_self_party',
        range: 0
      },
      Q: {
        id: 'brawler_aura_surge',
        name: 'ระเบิดออร่า (Aura Surge)',
        keySlot: 'Q',
        iconChar: '💨',
        cooldown: 7000,
        auraCost: 15,
        staminaCost: 10,
        baseDamage: 30,
        damageType: 'STRIKE',
        description: 'แดชพุ่งไปข้างหน้าพร้อมเพิ่ม ASPD และ Speed 40% นาน 4 วินาที',
        skillType: 'melee_dash',
        range: 180
      },
      E: {
        id: 'brawler_undying',
        name: 'กัดฟันสู้ (Undying Spirit)',
        keySlot: 'E',
        iconChar: '🩸',
        cooldown: 15000,
        auraCost: 45,
        staminaCost: 0,
        baseDamage: 0,
        damageType: 'STRIKE',
        description: 'ปลุกใจนักสู้ ได้รับการดูดเลือด (Lifesteal 35%) จากทุกหมัด นาน 6 วินาที',
        skillType: 'buff_self',
        range: 0
      }
    }
  },

  STRIKER: {
    classId: 'STRIKER',
    name: 'The Striker',
    thaiName: 'หน่วยทะลวง',
    attackType: 'melee',
    primaryRange: 85,
    primaryCooldownMs: 400,
    primaryDamageType: 'SLASH',
    skills: {
      LCLICK: {
        id: 'striker_primary',
        name: 'Bat & Blade Slash',
        keySlot: 'LCLICK',
        iconChar: '🗡️',
        cooldown: 400,
        auraCost: 0,
        staminaCost: 5,
        baseDamage: 26,
        damageType: 'SLASH',
        description: 'หวดไม้เบสบอลเหล็ก/มีดพับฟันศัตรูระยะ 85px มีโอกาสติด Bleed',
        skillType: 'melee_strike',
        range: 85,
        statusEffect: 'BLEED'
      },
      RCLICK: {
        id: 'striker_heavy',
        name: 'Deep Thrust',
        keySlot: 'RCLICK',
        iconChar: '⚔️',
        cooldown: 1100,
        auraCost: 5,
        staminaCost: 14,
        baseDamage: 70,
        damageType: 'PIERCE',
        description: 'แทงมีดทะลุจุดอ่อน เจาะเกราะศัตรู 40%',
        skillType: 'melee_strike',
        range: 95,
        statusEffect: 'BLEED'
      },
      '1': {
        id: 'striker_flash_step',
        name: 'ก้าวพริบตา (Flash Step)',
        keySlot: '1',
        iconChar: '⚡',
        cooldown: 5000,
        auraCost: 20,
        staminaCost: 15,
        baseDamage: 80,
        damageType: 'SLASH',
        description: 'พุ่งทะลุหลังเป้าหมาย 220px พร้อมเฉือนดาเมจ คริติคอลสูง',
        skillType: 'melee_dash',
        range: 220
      },
      '2': {
        id: 'striker_vital_strike',
        name: 'ฟาดจุดตาย (Vital Strike)',
        keySlot: '2',
        iconChar: '🎯',
        cooldown: 6500,
        auraCost: 25,
        staminaCost: 15,
        baseDamage: 110,
        damageType: 'SLASH',
        description: 'หวดเข้าจุดสำคัญ ติดคริติคอล 100% พร้อมเลือดไหล (Bleed)',
        skillType: 'melee_strike',
        range: 90,
        statusEffect: 'BLEED'
      },
      '3': {
        id: 'striker_blade_cyclone',
        name: 'พายุใบมีด (Blade Cyclone)',
        keySlot: '3',
        iconChar: '🌪️',
        cooldown: 9000,
        auraCost: 35,
        staminaCost: 20,
        baseDamage: 135,
        damageType: 'SLASH',
        description: 'ควงมีดหมุนตัว 360 องศา ฟันศัตรูรอบตัว 140px ทุกตัว',
        skillType: 'melee_aoe',
        range: 140,
        statusEffect: 'BLEED'
      },
      '4': {
        id: 'striker_spray',
        name: 'สเปรย์ปฐมพยาบาล',
        keySlot: '4',
        iconChar: '🧴',
        cooldown: 7500,
        auraCost: 0,
        staminaCost: 0,
        baseDamage: 0,
        damageType: 'SLASH',
        description: 'ฉีดสเปรย์ห้ามเลือด ฟื้นฟู 80 HP ทันที',
        skillType: 'heal_self_party',
        range: 0
      },
      Q: {
        id: 'striker_sprint_step',
        name: 'สเต็ปเท้าไฟ (Sprint Step)',
        keySlot: 'Q',
        iconChar: '👟',
        cooldown: 5000,
        auraCost: 10,
        staminaCost: 20,
        baseDamage: 25,
        damageType: 'SLASH',
        description: 'สไลด์หลบหลีกเร็วสูง ไม่สน Unit Collision พร้อมเพิ่ม Speed 50%',
        skillType: 'melee_dash',
        range: 200
      },
      E: {
        id: 'striker_homerun',
        name: 'โฮมรัน (Grand Slam)',
        keySlot: 'E',
        iconChar: '⚾',
        cooldown: 12000,
        auraCost: 40,
        staminaCost: 15,
        baseDamage: 160,
        damageType: 'STRIKE',
        description: 'ง้างหวดไม้เบสบอลเต็มเหนี่ยว น็อกศัตรูกระเด็นถอยหลังไกลมาก',
        skillType: 'melee_strike',
        range: 100,
        statusEffect: 'FRACTURE'
      }
    }
  },

  SHARPSHOOTER: {
    classId: 'SHARPSHOOTER',
    name: 'The Sharpshooter',
    thaiName: 'ตัวสอย',
    attackType: 'ranged',
    primaryRange: 400,
    primaryCooldownMs: 420,
    primaryDamageType: 'PIERCE',
    projectileType: 'SLING_BALL',
    projectileSpeed: 600,
    skills: {
      LCLICK: {
        id: 'sharpshooter_primary',
        name: 'Sling Shot',
        keySlot: 'LCLICK',
        iconChar: '🏹',
        cooldown: 420,
        auraCost: 0,
        staminaCost: 4,
        baseDamage: 25,
        damageType: 'PIERCE',
        description: 'ยิงลูกเหล็กหนังสติ๊กระยะไกล 400px พุ่งตรงตามพิกัดเมาส์',
        skillType: 'ranged_single',
        projectileType: 'SLING_BALL',
        range: 400
      },
      RCLICK: {
        id: 'sharpshooter_heavy',
        name: 'Power Bolt',
        keySlot: 'RCLICK',
        iconChar: '🎯',
        cooldown: 1200,
        auraCost: 10,
        staminaCost: 12,
        baseDamage: 65,
        damageType: 'PIERCE',
        description: 'ชาร์จยิงลูกดอกหน้าไม้เจาะเกราะ พุ่งทะลวงระยะ 450px',
        skillType: 'ranged_pierce',
        projectileType: 'PIERCE_BOLT',
        range: 450
      },
      '1': {
        id: 'sharpshooter_barrage',
        name: 'รัวหนังสติ๊ก (Sling Barrage)',
        keySlot: '1',
        iconChar: '💥',
        cooldown: 4500,
        auraCost: 15,
        staminaCost: 12,
        baseDamage: 35,
        damageType: 'PIERCE',
        description: 'ยิงกระสุนลูกเหล็ก 3 นัดซ้อนกระจายเป็นมุมพัดไปยังเมาส์',
        skillType: 'ranged_multi',
        projectileType: 'SLING_BALL',
        range: 420
      },
      '2': {
        id: 'sharpshooter_tear_shot',
        name: 'ลูกดอกฉีกเนื้อ (Tear-Shot)',
        keySlot: '2',
        iconChar: '⚡',
        cooldown: 6500,
        auraCost: 20,
        staminaCost: 14,
        baseDamage: 95,
        damageType: 'PIERCE',
        description: 'ยิงลูกดอกหน้าไม้พุ่งทะลุศัตรูทุกตัวเป็นเส้นตรง (Pierce Line)',
        skillType: 'ranged_pierce',
        projectileType: 'PIERCE_BOLT',
        range: 500,
        statusEffect: 'BLEED'
      },
      '3': {
        id: 'sharpshooter_headshot',
        name: 'เล็งจุดตาย (Headshot Sniper)',
        keySlot: '3',
        iconChar: '👁️',
        cooldown: 9000,
        auraCost: 35,
        staminaCost: 20,
        baseDamage: 155,
        damageType: 'PIERCE',
        description: 'เล็งยิงกระสุนหัวกระสุนหนัก ดาเมจมหาศาล + Stun 1.5 วินาที',
        skillType: 'ranged_single',
        projectileType: 'PIERCE_BOLT',
        range: 520,
        statusEffect: 'FRACTURE'
      },
      '4': {
        id: 'sharpshooter_breather',
        name: 'พักหายใจ (Breather)',
        keySlot: '4',
        iconChar: '💧',
        cooldown: 7000,
        auraCost: 0,
        staminaCost: 0,
        baseDamage: 0,
        damageType: 'PIERCE',
        description: 'ดื่มน้ำพักเหนื่อย ฟื้น Stamina 60 และ HP 40',
        skillType: 'heal_self_party',
        range: 0
      },
      Q: {
        id: 'sharpshooter_molotov',
        name: 'ระเบิดขวด (Molotov Cocktail)',
        keySlot: 'Q',
        iconChar: '🍾',
        cooldown: 9000,
        auraCost: 25,
        staminaCost: 15,
        baseDamage: 80,
        damageType: 'PIERCE',
        description: 'ปาระเบิดขวดไฟสร้างทะเลเพลิง (Burn AoE) เผาไหม้ศัตรูบนพื้น 4 วินาที',
        skillType: 'ranged_ground_aoe',
        projectileType: 'MOLOTOV',
        range: 350,
        statusEffect: 'BURN'
      },
      E: {
        id: 'sharpshooter_backstep',
        name: 'ดีดตัวถอยยิง (Backstep Shot)',
        keySlot: 'E',
        iconChar: '💨',
        cooldown: 8000,
        auraCost: 15,
        staminaCost: 15,
        baseDamage: 55,
        damageType: 'PIERCE',
        description: 'กระโดดถอยหลังหนี 200px พร้อมยิงกระสุนสกัดด้านหน้าทันที',
        skillType: 'ranged_single',
        projectileType: 'SLING_BALL',
        range: 300
      }
    }
  },

  SUPPLIER: {
    classId: 'SUPPLIER',
    name: 'The Supplier',
    thaiName: 'หน่วยเสบียง',
    attackType: 'ranged',
    primaryRange: 240,
    primaryCooldownMs: 500,
    primaryDamageType: 'STRIKE',
    projectileType: 'TONIC_BOTTLE',
    projectileSpeed: 450,
    skills: {
      LCLICK: {
        id: 'supplier_primary',
        name: 'Bottle Toss',
        keySlot: 'LCLICK',
        iconChar: '🍾',
        cooldown: 500,
        auraCost: 0,
        staminaCost: 4,
        baseDamage: 22,
        damageType: 'STRIKE',
        description: 'ปาขวดน้ำ/กระป๋องน้ำอัดลมใส่ศัตรูระยะ 240px',
        skillType: 'ranged_single',
        projectileType: 'TONIC_BOTTLE',
        range: 240
      },
      RCLICK: {
        id: 'supplier_heavy',
        name: 'Medkit Slam',
        keySlot: 'RCLICK',
        iconChar: '💼',
        cooldown: 1100,
        auraCost: 5,
        staminaCost: 12,
        baseDamage: 55,
        damageType: 'STRIKE',
        description: 'เอาลังยา/กระเป๋าพยาบาลทุบศัตรูระยะใกล้ให้กระเด็น',
        skillType: 'melee_strike',
        range: 80
      },
      '1': {
        id: 'supplier_toss_tonic',
        name: 'โยนเครื่องดื่ม (Toss Tonic)',
        keySlot: '1',
        iconChar: '🥤',
        cooldown: 4000,
        auraCost: 15,
        staminaCost: 5,
        baseDamage: 0,
        damageType: 'STRIKE',
        description: 'โยนกระป๋องชูกำลัง ฮีล 90 HP และฟื้น 40 Stamina ให้ตัวเอง/เพื่อน',
        skillType: 'heal_self_party',
        range: 280
      },
      '2': {
        id: 'supplier_painkiller',
        name: 'สเปรย์แก้ปวด (Painkiller Spray)',
        keySlot: '2',
        iconChar: '🧴',
        cooldown: 7000,
        auraCost: 20,
        staminaCost: 10,
        baseDamage: 40,
        damageType: 'STRIKE',
        description: 'ฉีดสเปรย์ละอองยา ล้างสถานะผิดปกติ (Cleanse) และฟื้นฟู 60 HP',
        skillType: 'cleanse_buff',
        range: 180
      },
      '3': {
        id: 'supplier_smoke_pod',
        name: 'ลูกปิงปองควัน (Smoke Pod)',
        keySlot: '3',
        iconChar: '💨',
        cooldown: 8500,
        auraCost: 20,
        staminaCost: 10,
        baseDamage: 45,
        damageType: 'STRIKE',
        description: 'ปาลูกควันใส่ศัตรู ทำให้ศัตรูในระยะ 140px ตีวืด (Blind) 3 วินาที',
        skillType: 'ranged_ground_aoe',
        projectileType: 'TONIC_BOTTLE',
        range: 260
      },
      '4': {
        id: 'supplier_emergency_kit',
        name: 'กล่องปฐมพยาบาลฉุกเฉิน',
        keySlot: '4',
        iconChar: '🧰',
        cooldown: 9000,
        auraCost: 0,
        staminaCost: 0,
        baseDamage: 0,
        damageType: 'STRIKE',
        description: 'เปิดกล่องปฐมพยาบาล ฟื้นฟู 120 HP ตัวเองทันที',
        skillType: 'heal_self_party',
        range: 0
      },
      Q: {
        id: 'supplier_heal_bag',
        name: 'วางกระเป๋าพยาบาล (Healing Station)',
        keySlot: 'Q',
        iconChar: '🎒',
        cooldown: 12000,
        auraCost: 35,
        staminaCost: 15,
        baseDamage: 0,
        damageType: 'STRIKE',
        description: 'วางกระเป๋ายาบนพื้น สร้างอาณาเขตฮีลต่อเนื่อง (HoT) นาน 6 วินาที',
        skillType: 'heal_self_party',
        range: 200
      },
      E: {
        id: 'supplier_party_feast',
        name: 'เปิดกล่องปาร์ตี้ (Party Feast)',
        keySlot: 'E',
        iconChar: '🍱',
        cooldown: 18000,
        auraCost: 50,
        staminaCost: 10,
        baseDamage: 0,
        damageType: 'STRIKE',
        description: 'แจกเสบียงใหญ่ ฮีลเต็มพิกัด 180 HP รอบตัว 300px + บัฟรีเจน Aura',
        skillType: 'buff_party',
        range: 300
      }
    }
  },

  INSTIGATOR: {
    classId: 'INSTIGATOR',
    name: 'The Instigator',
    thaiName: 'ตัวเปิด',
    attackType: 'ranged',
    primaryRange: 220,
    primaryCooldownMs: 450,
    primaryDamageType: 'SLASH',
    projectileType: 'SONIC_WAVE',
    projectileSpeed: 480,
    skills: {
      LCLICK: {
        id: 'instigator_primary',
        name: 'Megaphone Blast',
        keySlot: 'LCLICK',
        iconChar: '📢',
        cooldown: 450,
        auraCost: 0,
        staminaCost: 4,
        baseDamage: 24,
        damageType: 'SLASH',
        description: 'ตะโกนใส่โทรโข่ง ปล่อยคลื่นเสียงรูปพัดระยะ 220px',
        skillType: 'sonic_cone',
        projectileType: 'SONIC_WAVE',
        range: 220
      },
      RCLICK: {
        id: 'instigator_heavy',
        name: 'Sonic Shove',
        keySlot: 'RCLICK',
        iconChar: '🔊',
        cooldown: 1100,
        auraCost: 8,
        staminaCost: 12,
        baseDamage: 60,
        damageType: 'SLASH',
        description: 'เปิดโทรโข่งระดับสูงสุด คลื่นเสียงอัดกระแทกศัตรูกระเด็นถอยหลัง',
        skillType: 'sonic_cone',
        projectileType: 'SONIC_WAVE',
        range: 240
      },
      '1': {
        id: 'instigator_spray_paint',
        name: 'พ่นสีสเปรย์ (Graffiti Blind)',
        keySlot: '1',
        iconChar: '🎨',
        cooldown: 5000,
        auraCost: 15,
        staminaCost: 10,
        baseDamage: 50,
        damageType: 'SLASH',
        description: 'ฉีดพ่นสเปรย์สีใส่หน้าศัตรูรูปกรวย ทำให้ติดตาบอด (Blind) 3 วินาที',
        skillType: 'sonic_cone',
        range: 180
      },
      '2': {
        id: 'instigator_firecracker',
        name: 'ปาประทัดยักษ์ (Firecracker Toss)',
        keySlot: '2',
        iconChar: '🧨',
        cooldown: 7000,
        auraCost: 20,
        staminaCost: 12,
        baseDamage: 85,
        damageType: 'STRIKE',
        description: 'ปาประทัดยักษ์ระเบิดเสียงดังสนั่น Stun ศัตรูในรัศมี 2 วินาที',
        skillType: 'ranged_ground_aoe',
        projectileType: 'MOLOTOV',
        range: 280,
        statusEffect: 'FRACTURE'
      },
      '3': {
        id: 'instigator_whistle',
        name: 'เป่านกหวีดไล่ (Whistle Blast)',
        keySlot: '3',
        iconChar: '🚨',
        cooldown: 8000,
        auraCost: 25,
        staminaCost: 15,
        baseDamage: 90,
        damageType: 'SLASH',
        description: 'เป่านกหวีดเสียงแหลมสูง ขัดจังหวะการร่ายสกิลของศัตรูทั้งหมด',
        skillType: 'melee_aoe',
        range: 180
      },
      '4': {
        id: 'instigator_balm',
        name: 'ยาหม่องเด็กช่าง',
        keySlot: '4',
        iconChar: '🌿',
        cooldown: 7000,
        auraCost: 0,
        staminaCost: 0,
        baseDamage: 0,
        damageType: 'STRIKE',
        description: 'ดมยาหม่อง ฟื้น Stamina 60 และล้างสถานะผิดปกติ',
        skillType: 'cleanse_buff',
        range: 0
      },
      Q: {
        id: 'instigator_anthem',
        name: 'เพลงมาร์ชสถาบัน (School Anthem)',
        keySlot: 'Q',
        iconChar: '🎵',
        cooldown: 11000,
        auraCost: 30,
        staminaCost: 15,
        baseDamage: 0,
        damageType: 'SLASH',
        description: 'เปิดเพลงมาร์ชปลุกใจ บัฟเพิ่มพลังโจมตี +35% และความเร็ว +25% ให้ทีม',
        skillType: 'buff_party',
        range: 280
      },
      E: {
        id: 'instigator_roar',
        name: 'ตะโกนด่ากราด (Megaphone Roar)',
        keySlot: 'E',
        iconChar: '🗣️',
        cooldown: 14000,
        auraCost: 40,
        staminaCost: 15,
        baseDamage: 110,
        damageType: 'SLASH',
        description: 'ตะโกนด่าใส่โทรโข่งรอบทิศทาง ลดเกราะศัตรู 40% นาน 6 วินาที',
        skillType: 'melee_aoe',
        range: 240
      }
    }
  },

  SABOTEUR: {
    classId: 'SABOTEUR',
    name: 'The Saboteur',
    thaiName: 'ตัวป่วน',
    attackType: 'ranged',
    primaryRange: 200,
    primaryCooldownMs: 440,
    primaryDamageType: 'PIERCE',
    projectileType: 'CHAIN_WHIP',
    projectileSpeed: 500,
    skills: {
      LCLICK: {
        id: 'saboteur_primary',
        name: 'Chain Whip',
        keySlot: 'LCLICK',
        iconChar: '⛓️',
        cooldown: 440,
        auraCost: 0,
        staminaCost: 4,
        baseDamage: 25,
        damageType: 'PIERCE',
        description: 'สะบัดโซ่จักรยาน/ปาหมุดเหล็กระยะกลาง 200px',
        skillType: 'ranged_single',
        projectileType: 'CHAIN_WHIP',
        range: 200
      },
      RCLICK: {
        id: 'saboteur_heavy',
        name: 'Chain Pull',
        keySlot: 'RCLICK',
        iconChar: '🪝',
        cooldown: 1200,
        auraCost: 8,
        staminaCost: 14,
        baseDamage: 60,
        damageType: 'PIERCE',
        description: 'เหวี่ยงโซ่เกี่ยวศัตรูดึงเข้ามาหาตัว พร้อมฟาดติด Stun',
        skillType: 'ranged_single',
        projectileType: 'CHAIN_WHIP',
        range: 260
      },
      '1': {
        id: 'saboteur_caltrops',
        name: 'โรยตะปูเรือใบ (Caltrops Trap)',
        keySlot: '1',
        iconChar: '📌',
        cooldown: 5500,
        auraCost: 15,
        staminaCost: 12,
        baseDamage: 55,
        damageType: 'PIERCE',
        description: 'โรยตะปูเรือใบลงบนพื้น ศัตรูที่เหยียบสปีดลด 80% + เลือดออก (Bleed)',
        skillType: 'trap_place',
        projectileType: 'CALTROPS',
        range: 220,
        statusEffect: 'BLEED'
      },
      '2': {
        id: 'saboteur_tripwire',
        name: 'ขึงลวดสลิง (Tripwire)',
        keySlot: '2',
        iconChar: '🧵',
        cooldown: 7500,
        auraCost: 20,
        staminaCost: 14,
        baseDamage: 75,
        damageType: 'PIERCE',
        description: 'ขึงลวดสลิงกับดัก ศัตรูที่วิ่งชนจะสะดุดล้มติด Stun 2 วินาที',
        skillType: 'trap_place',
        range: 200,
        statusEffect: 'FRACTURE'
      },
      '3': {
        id: 'saboteur_ied_barrel',
        name: 'ถังน้ำมันดักบึ้ม (IED Drum)',
        keySlot: '3',
        iconChar: '🛢️',
        cooldown: 9500,
        auraCost: 35,
        staminaCost: 20,
        baseDamage: 145,
        damageType: 'STRIKE',
        description: 'วางถังน้ำมันดักระเบิด เมื่อศัตรูเข้าใกล้จะระเบิดเป็นไฟลุกท่วม',
        skillType: 'trap_place',
        range: 160,
        statusEffect: 'BURN'
      },
      '4': {
        id: 'saboteur_disinfectant',
        name: 'ทิงเจอร์ล้างแผล',
        keySlot: '4',
        iconChar: '🧪',
        cooldown: 7000,
        auraCost: 0,
        staminaCost: 0,
        baseDamage: 0,
        damageType: 'PIERCE',
        description: 'ราดทิงเจอร์ล้างแผล ฟื้นฟู 75 HP ทันที',
        skillType: 'heal_self_party',
        range: 0
      },
      Q: {
        id: 'saboteur_wire_dash',
        name: 'สไลด์โหนลวด (Wire Slide)',
        keySlot: 'Q',
        iconChar: '🪢',
        cooldown: 6000,
        auraCost: 15,
        staminaCost: 15,
        baseDamage: 40,
        damageType: 'PIERCE',
        description: 'ยิงสลิงดีดตัวพุ่งข้ามหัวศัตรู 220px พร้อมทิ้งกับดักไว้ด้านหลัง',
        skillType: 'melee_dash',
        range: 220
      },
      E: {
        id: 'saboteur_smoke_screen',
        name: 'ระเบิดควันนินจา (Smoke Screen)',
        keySlot: 'E',
        iconChar: '💨',
        cooldown: 14000,
        auraCost: 35,
        staminaCost: 10,
        baseDamage: 0,
        damageType: 'PIERCE',
        description: 'ปาระเบิดควันดำพรางตัว เข้าสู่สถานะล่องหนชั่วขณะ + อัตราหลบหลีก 100%',
        skillType: 'buff_self',
        range: 0
      }
    }
  }
};

export class ClassCombatSystem {
  public static getClassConfig(classId: PlayerClassId): ClassCombatConfig {
    return CLASS_COMBAT_CONFIGS[classId] || CLASS_COMBAT_CONFIGS.BRAWLER;
  }

  public static getInitialSkills(classId: PlayerClassId): SkillConfig[] {
    const config = this.getClassConfig(classId);
    return Object.values(config.skills).map(s => ({
      id: s.id,
      name: s.name,
      keySlot: s.keySlot,
      cooldown: s.cooldown,
      lastUsedTime: 0,
      auraCost: s.auraCost,
      staminaCost: s.staminaCost,
      damageType: s.damageType,
      baseDamage: s.baseDamage,
      description: s.description,
      iconChar: s.iconChar
    }));
  }
}

