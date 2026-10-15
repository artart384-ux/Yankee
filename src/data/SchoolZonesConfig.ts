export interface PortalConfig {
  targetZone: string;
  label: string;
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  x: number;
  y: number;
  spawnX: number;
  spawnY: number;
}

export interface MonsterSpawnConfig {
  monsterId: string;
  name: string;
  level: number;
  damageType: 'Slash' | 'Pierce' | 'Strike';
  count: number;
  x?: number;
  y?: number;
  isMiniBoss?: boolean;
}

export interface PropSpawnConfig {
  texture: string;
  x: number;
  y: number;
  scale?: number;
  flipX?: boolean;
  isObstacle?: boolean;
  obstacleWidth?: number;
  obstacleHeight?: number;
  interactive?: boolean;
  interactMessage?: string;
  interactAction?: 'HEAL' | 'INFO';
}

export interface NPCSpawnConfig {
  npcType: 'MISS_POPPY' | 'ELIZABETH' | 'YAMATO' | 'WIN_TAXI' | 'PAWN_VENDOR' | 'SENIOR_GATE' | 'CAFETERIA_AUNT';
  x: number;
  y: number;
}

export interface SchoolZoneData {
  id: string;
  zoneNumber: number;
  name: string;
  subtitle: string;
  levelRange: string;
  isSafeZone: boolean;
  allowDuel: boolean;
  floorType: 'asphalt' | 'concrete' | 'tiles' | 'wood_parquet' | 'dirty_concrete' | 'wet_tiles';
  themeColor: number;
  ambientTint: number;
  bannerColor: string;
  mapWidth: number;
  mapHeight: number;
  walkableBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  portals: PortalConfig[];
  monsters: MonsterSpawnConfig[];
  npcs: NPCSpawnConfig[];
  props: PropSpawnConfig[];
}

export const SCHOOL_ZONES: Record<string, SchoolZoneData> = {
  zone_1: {
    id: 'zone_1',
    zoneNumber: 1,
    name: '1. หน้าประตูโรงเรียน & คิววิน [SAFE ZONE]',
    subtitle: 'Main Spawn //จุดเกิดผู้เล่นใหม่ & วินมอเตอร์ไซค์',
    levelRange: 'Safe Zone',
    isSafeZone: true,
    allowDuel: true,
    floorType: 'asphalt',
    themeColor: 0x2b2d42,
    ambientTint: 0xffffff,
    bannerColor: '#00ff66',
    mapWidth: 1600,
    mapHeight: 1200,
    walkableBounds: { x: 120, y: 220, width: 1360, height: 880 },
    portals: [
      {
        targetZone: 'zone_2',
        label: '▲ ลานหน้าเสาธง (Lv.1-3)',
        direction: 'UP',
        x: 800,
        y: 160,
        spawnX: 800,
        spawnY: 960
      },
      {
        targetZone: 'zone_9',
        label: '▼ โรงยิมร้าง (Lv.10-14)',
        direction: 'DOWN',
        x: 800,
        y: 1040,
        spawnX: 800,
        spawnY: 260
      }
    ],
    npcs: [
      { npcType: 'WIN_TAXI', x: 620, y: 700 },
      { npcType: 'SENIOR_GATE', x: 960, y: 680 }
    ],
    monsters: [
      { monsterId: 'dummy_slash', name: 'หุ่นซ้อมสายฟัน [Slash Dummy]', level: 1, damageType: 'Slash', count: 1, x: 500, y: 480 },
      { monsterId: 'dummy_strike', name: 'หุ่นซ้อมสายทุบ [Strike Dummy]', level: 1, damageType: 'Strike', count: 1, x: 1100, y: 480 }
    ],
    props: [
      // School Entrance Gates & Fences
      { texture: 'prop_chainlink_fence', x: 400, y: 220, isObstacle: true, obstacleWidth: 120, obstacleHeight: 30 },
      { texture: 'prop_chainlink_fence', x: 1200, y: 220, isObstacle: true, obstacleWidth: 120, obstacleHeight: 30 },
      { texture: 'prop_graffiti_wall', x: 250, y: 220, isObstacle: true, obstacleWidth: 100, obstacleHeight: 30 },
      { texture: 'prop_graffiti_wall', x: 1350, y: 220, isObstacle: true, obstacleWidth: 100, obstacleHeight: 30 },
      // Custom Bosozoku Bikes & Cars
      { texture: 'prop_bosozoku_bike', x: 540, y: 720, scale: 1.15, isObstacle: true, interactive: true, interactMessage: '🏍️ รถซิ่งโบโซโซคุของวินลุงเดช ท่อไอเสียยกสูงพร้อมซิ่งข้ามเขตโรงเรียน!' },
      { texture: 'motorcycle', x: 700, y: 730, isObstacle: true },
      { texture: 'prop_cyber_car', x: 300, y: 850, isObstacle: true },
      { texture: 'street_lamp', x: 450, y: 350 },
      { texture: 'street_lamp', x: 1150, y: 350 },
      { texture: 'street_lamp', x: 450, y: 900 },
      { texture: 'street_lamp', x: 1150, y: 900 },
      { texture: 'trash_bin', x: 350, y: 600, isObstacle: true },
      { texture: 'vending_machine', x: 1250, y: 600, isObstacle: true, interactive: true, interactAction: 'HEAL' }
    ]
  },

  zone_2: {
    id: 'zone_2',
    zoneNumber: 2,
    name: '2. ลานหน้าเสาธง & โถงล็อกเกอร์',
    subtitle: 'Courtyard & Lockers // เขตฝึกหัดมือใหม่',
    levelRange: 'Lv. 1 - 3',
    isSafeZone: false,
    allowDuel: true,
    floorType: 'concrete',
    themeColor: 0x3a3d45,
    ambientTint: 0xf4f1de,
    bannerColor: '#33ccff',
    mapWidth: 1600,
    mapHeight: 1100,
    walkableBounds: { x: 140, y: 220, width: 1320, height: 780 },
    portals: [
      {
        targetZone: 'zone_1',
        label: '▼ หน้าประตูโรงเรียน (Safe)',
        direction: 'DOWN',
        x: 800,
        y: 1040,
        spawnX: 800,
        spawnY: 260
      },
      {
        targetZone: 'zone_3',
        label: '◄ โรงจอดรถหลังรั้ว (Lv.3-5)',
        direction: 'LEFT',
        x: 160,
        y: 600,
        spawnX: 1360,
        spawnY: 600
      },
      {
        targetZone: 'zone_4',
        label: '► โรงอาหาร & สหกรณ์ (Safe)',
        direction: 'RIGHT',
        x: 1440,
        y: 600,
        spawnX: 240,
        spawnY: 600
      },
      {
        targetZone: 'zone_5',
        label: '▲ โถงทางเดินชั้น 2 (Lv.5-7)',
        direction: 'UP',
        x: 800,
        y: 160,
        spawnX: 800,
        spawnY: 960
      }
    ],
    npcs: [],
    monsters: [
      { monsterId: 'lost_freshman', name: 'เด็กใหม่หลงทาง (Lost Freshman)', level: 1, damageType: 'Strike', count: 4 },
      { monsterId: 'locker_punk', name: 'นักเลงหางแถว (Locker Punk)', level: 2, damageType: 'Slash', count: 4 }
    ],
    props: [
      // Shoe Lockers & Banners
      { texture: 'prop_school_desk', x: 500, y: 350, isObstacle: true },
      { texture: 'prop_school_desk', x: 620, y: 350, isObstacle: true },
      { texture: 'prop_school_desk', x: 980, y: 350, isObstacle: true },
      { texture: 'prop_school_desk', x: 1100, y: 350, isObstacle: true },
      { texture: 'prop_teacher_podium', x: 800, y: 380, isObstacle: true, interactive: true, interactMessage: '📢 แท่นเสาธงโรงเรียน มีรอยสลัก "สถาบันนี้ ผู้ชนะคือราชา"' },
      { texture: 'street_lamp', x: 350, y: 400 },
      { texture: 'street_lamp', x: 1250, y: 400 },
      { texture: 'trash_bin', x: 420, y: 780, isObstacle: true },
      { texture: 'trash_bin', x: 1180, y: 780, isObstacle: true }
    ]
  },

  zone_3: {
    id: 'zone_3',
    zoneNumber: 3,
    name: '3. โรงจอดรถ & กำแพงหลังโรงเรียน',
    subtitle: 'Bike Shed & Back Wall // แหล่งฟาร์มเศษเหล็ก',
    levelRange: 'Lv. 3 - 5',
    isSafeZone: false,
    allowDuel: true,
    floorType: 'dirty_concrete',
    themeColor: 0x473322,
    ambientTint: 0xdeb887,
    bannerColor: '#ff9900',
    mapWidth: 1500,
    mapHeight: 1100,
    walkableBounds: { x: 140, y: 240, width: 1220, height: 760 },
    portals: [
      {
        targetZone: 'zone_2',
        label: '► ลานหน้าเสาธง (Lv.1-3)',
        direction: 'RIGHT',
        x: 1440,
        y: 600,
        spawnX: 260,
        spawnY: 600
      }
    ],
    npcs: [],
    monsters: [
      { monsterId: 'bike_thug', name: 'เด็กแว้นเฝ้ารถ (Bike Thug)', level: 3, damageType: 'Strike', count: 5 },
      { monsterId: 'alley_mechanic', name: 'ช่างเถื่อนหลังรั้ว (Alley Mechanic)', level: 5, damageType: 'Pierce', count: 3 }
    ],
    props: [
      { texture: 'prop_iso_oil_barrels', x: 450, y: 320, isObstacle: true, interactive: true, interactMessage: '🛢️ ถังน้ำมันเครื่องเก่า ส่งกลิ่นน้ำมันเบนซินคลุ้ง' },
      { texture: 'prop_iso_oil_barrels', x: 1050, y: 320, isObstacle: true },
      { texture: 'prop_bosozoku_bike', x: 600, y: 420, isObstacle: true },
      { texture: 'motorcycle', x: 740, y: 420, isObstacle: true },
      { texture: 'motorcycle', x: 880, y: 420, isObstacle: true },
      { texture: 'prop_graffiti_wall', x: 300, y: 200, isObstacle: true },
      { texture: 'prop_graffiti_wall', x: 700, y: 200, isObstacle: true },
      { texture: 'prop_graffiti_wall', x: 1100, y: 200, isObstacle: true },
      { texture: 'barrier', x: 350, y: 800, isObstacle: true },
      { texture: 'barrier', x: 1150, y: 800, isObstacle: true }
    ]
  },

  zone_4: {
    id: 'zone_4',
    zoneNumber: 4,
    name: '4. โรงอาหาร & ร้านค้าสหกรณ์ [SAFE ZONE]',
    subtitle: 'Cafeteria & Coop // จุดพักฟื้นและซื้อเสบียง',
    levelRange: 'Safe Zone',
    isSafeZone: true,
    allowDuel: true,
    floorType: 'tiles',
    themeColor: 0x223a30,
    ambientTint: 0xffffff,
    bannerColor: '#00ff99',
    mapWidth: 1600,
    mapHeight: 1200,
    walkableBounds: { x: 140, y: 220, width: 1320, height: 880 },
    portals: [
      {
        targetZone: 'zone_2',
        label: '◄ ลานหน้าเสาธง (Lv.1-3)',
        direction: 'LEFT',
        x: 160,
        y: 600,
        spawnX: 1340,
        spawnY: 600
      }
    ],
    npcs: [
      { npcType: 'CAFETERIA_AUNT', x: 800, y: 380 },
      { npcType: 'PAWN_VENDOR', x: 1200, y: 450 }
    ],
    monsters: [],
    props: [
      { texture: 'prop_teacher_podium', x: 800, y: 340, isObstacle: true },
      { texture: 'vending_machine', x: 500, y: 280, isObstacle: true, interactive: true, interactAction: 'HEAL' },
      { texture: 'vending_machine', x: 1100, y: 280, isObstacle: true, interactive: true, interactAction: 'HEAL' },
      // Dining Tables
      { texture: 'prop_school_desk', x: 500, y: 560, scale: 1.1, isObstacle: true },
      { texture: 'prop_school_desk', x: 650, y: 560, scale: 1.1, isObstacle: true },
      { texture: 'prop_school_desk', x: 950, y: 560, scale: 1.1, isObstacle: true },
      { texture: 'prop_school_desk', x: 1100, y: 560, scale: 1.1, isObstacle: true },
      { texture: 'prop_school_desk', x: 500, y: 780, scale: 1.1, isObstacle: true },
      { texture: 'prop_school_desk', x: 650, y: 780, scale: 1.1, isObstacle: true },
      { texture: 'prop_school_desk', x: 950, y: 780, scale: 1.1, isObstacle: true },
      { texture: 'prop_school_desk', x: 1100, y: 780, scale: 1.1, isObstacle: true },
      { texture: 'trash_bin', x: 300, y: 650, isObstacle: true }
    ]
  },

  zone_5: {
    id: 'zone_5',
    zoneNumber: 5,
    name: '5. โถงทางเดินอาคารเรียนชั้น 2',
    subtitle: 'Main Corridor // ทางเชื่อมห้องเรียน & ลาดตระเวน',
    levelRange: 'Lv. 5 - 7',
    isSafeZone: false,
    allowDuel: true,
    floorType: 'wood_parquet',
    themeColor: 0x4d3826,
    ambientTint: 0xffd28e, // Warm sunset lighting beam
    bannerColor: '#ffbb33',
    mapWidth: 1800,
    mapHeight: 900,
    walkableBounds: { x: 120, y: 220, width: 1560, height: 580 },
    portals: [
      {
        targetZone: 'zone_2',
        label: '▼ ลานหน้าเสาธง (Lv.1-3)',
        direction: 'DOWN',
        x: 800,
        y: 1040,
        spawnX: 800,
        spawnY: 260
      },
      {
        targetZone: 'zone_6',
        label: '◄ ห้องเรียนปี 3 ห้อง D (Lv.6-8)',
        direction: 'LEFT',
        x: 160,
        y: 600,
        spawnX: 1340,
        spawnY: 600
      },
      {
        targetZone: 'zone_7',
        label: '► ห้องน้ำชายหลังตึก [MINI-BOSS]',
        direction: 'RIGHT',
        x: 1440,
        y: 600,
        spawnX: 240,
        spawnY: 600
      },
      {
        targetZone: 'zone_8',
        label: '▲ บันไดหนีไฟ & ห้องเก็บของ (Lv.10-12)',
        direction: 'UP',
        x: 800,
        y: 160,
        spawnX: 800,
        spawnY: 960
      }
    ],
    npcs: [],
    monsters: [
      { monsterId: 'hallway_patrol', name: 'สายตรวจหน้าห้อง (Hallway Patrol)', level: 5, damageType: 'Strike', count: 4 },
      { monsterId: 'chalk_slinger', name: 'มือปาหลังห้อง (Chalk Slinger)', level: 7, damageType: 'Strike', count: 3 }
    ],
    props: [
      // Corridor Lockers & Barriers
      { texture: 'prop_iso_desk_pile', x: 480, y: 380, isObstacle: true },
      { texture: 'prop_iso_desk_pile', x: 1120, y: 380, isObstacle: true },
      { texture: 'prop_school_desk', x: 350, y: 780, isObstacle: true },
      { texture: 'prop_school_desk', x: 1250, y: 780, isObstacle: true },
      { texture: 'trash_bin', x: 600, y: 880, isObstacle: true },
      { texture: 'trash_bin', x: 1000, y: 880, isObstacle: true }
    ]
  },

  zone_6: {
    id: 'zone_6',
    zoneNumber: 6,
    name: '6. ห้องเรียนปี 3 ห้อง D',
    subtitle: 'Class 3-D Battleground // สมรภูมิเด็กเกเรห้องบ๊วย',
    levelRange: 'Lv. 6 - 8',
    isSafeZone: false,
    allowDuel: true,
    floorType: 'wood_parquet',
    themeColor: 0x4a3b32,
    ambientTint: 0xffd199,
    bannerColor: '#ff7733',
    mapWidth: 1400,
    mapHeight: 1100,
    walkableBounds: { x: 160, y: 240, width: 1080, height: 760 },
    portals: [
      {
        targetZone: 'zone_5',
        label: '► โถงทางเดินอาคารเรียน',
        direction: 'RIGHT',
        x: 1440,
        y: 600,
        spawnX: 260,
        spawnY: 600
      }
    ],
    npcs: [],
    monsters: [
      { monsterId: 'class_bully', name: 'ขาใหญ่ประจำห้อง (Class Bully)', level: 7, damageType: 'Strike', count: 5 },
      { monsterId: 'spray_rebel', name: 'เด็กแสบสายป่วน (Spray Rebel)', level: 8, damageType: 'Pierce', count: 4 }
    ],
    props: [
      // Chalkboard & Teacher's Desk
      { texture: 'prop_teacher_podium', x: 800, y: 260, isObstacle: true, interactive: true, interactMessage: '📋 กระดานดำพ่นสีทับ: "ห้องนี้เขตหวงห้าม ใครเข้ามามีเคลียร์!"' },
      { texture: 'prop_computer_desk', x: 450, y: 260, isObstacle: true },
      { texture: 'prop_computer_desk', x: 1150, y: 260, isObstacle: true },
      // Fortified Overturned Wooden Desks (Bunkers)
      { texture: 'prop_iso_desk_pile', x: 550, y: 480, isObstacle: true },
      { texture: 'prop_iso_desk_pile', x: 1050, y: 480, isObstacle: true },
      { texture: 'prop_iso_desk_pile', x: 800, y: 720, isObstacle: true },
      { texture: 'trash_bin', x: 300, y: 450, isObstacle: true }
    ]
  },

  zone_7: {
    id: 'zone_7',
    zoneNumber: 7,
    name: '7. ห้องน้ำชายหลังตึก [MINI-BOSS]',
    subtitle: 'The Restroom Turf // ถิ่นดักไถตังค์ & แหล่งกบดาน',
    levelRange: 'Lv. 8 - 10',
    isSafeZone: false,
    allowDuel: true,
    floorType: 'wet_tiles',
    themeColor: 0x1d3557,
    ambientTint: 0xa8dadc,
    bannerColor: '#e63946',
    mapWidth: 1200,
    mapHeight: 1000,
    walkableBounds: { x: 160, y: 240, width: 880, height: 660 },
    portals: [
      {
        targetZone: 'zone_5',
        label: '◄ โถงทางเดินอาคารเรียน',
        direction: 'LEFT',
        x: 160,
        y: 600,
        spawnX: 1340,
        spawnY: 600
      }
    ],
    npcs: [],
    monsters: [
      { monsterId: 'restroom_grunt', name: 'ลูกกระจ๊อกเฝ้าห้องน้ำ (Restroom Grunt)', level: 8, damageType: 'Strike', count: 4 },
      { monsterId: 'boss_goro', name: '★ โกโร่ จ่าฝูงห้องน้ำ (Goro the Turf Warlord [MINI-BOSS])', level: 10, damageType: 'Strike', count: 1, x: 800, y: 520, isMiniBoss: true }
    ],
    props: [
      { texture: 'prop_graffiti_wall', x: 450, y: 240, isObstacle: true },
      { texture: 'prop_graffiti_wall', x: 1150, y: 240, isObstacle: true },
      { texture: 'prop_iso_oil_barrels', x: 360, y: 750, isObstacle: true },
      { texture: 'trash_bin', x: 1240, y: 750, isObstacle: true },
      { texture: 'vending_machine', x: 1300, y: 400, isObstacle: true, interactive: true, interactAction: 'HEAL' }
    ]
  },

  zone_8: {
    id: 'zone_8',
    zoneNumber: 8,
    name: '8. บันไดหนีไฟ & ห้องเก็บของ',
    subtitle: 'Stairwell & Storage // ด่านปราการดักทางขึ้นดาดฟ้า',
    levelRange: 'Lv. 10 - 12',
    isSafeZone: false,
    allowDuel: true,
    floorType: 'dirty_concrete',
    themeColor: 0x33261f,
    ambientTint: 0xd4a373,
    bannerColor: '#f77f00',
    mapWidth: 1300,
    mapHeight: 1100,
    walkableBounds: { x: 160, y: 240, width: 980, height: 760 },
    portals: [
      {
        targetZone: 'zone_5',
        label: '▼ โถงทางเดินชั้น 2 (Lv.5-7)',
        direction: 'DOWN',
        x: 800,
        y: 1040,
        spawnX: 800,
        spawnY: 260
      },
      {
        targetZone: 'zone_10',
        label: '▲ ดาดฟ้าตึกเรียนหลัก (Lv.12-15)',
        direction: 'UP',
        x: 800,
        y: 160,
        spawnX: 800,
        spawnY: 880
      }
    ],
    npcs: [],
    monsters: [
      { monsterId: 'stair_guard', name: 'องครักษ์พิทักษ์ดาดฟ้า (Stairwell Guardian)', level: 11, damageType: 'Strike', count: 4 },
      { monsterId: 'trap_saboteur', name: 'มือวางกับดัก (Trap Saboteur)', level: 12, damageType: 'Pierce', count: 3 }
    ],
    props: [
      { texture: 'prop_rooftop_stair_hut_pixel', x: 800, y: 240, scale: 1.1, isObstacle: true, interactive: true, interactMessage: '🚪 ประตูบันไดหนีไฟเชื่อมสู่ดาดฟ้าตึกเรียนหลัก!' },
      { texture: 'prop_iso_desk_pile', x: 420, y: 450, isObstacle: true },
      { texture: 'prop_iso_desk_pile', x: 1180, y: 450, isObstacle: true },
      { texture: 'prop_iso_oil_barrels', x: 500, y: 750, isObstacle: true },
      { texture: 'prop_iso_oil_barrels', x: 1100, y: 750, isObstacle: true },
      { texture: 'barrier', x: 600, y: 550, isObstacle: true },
      { texture: 'barrier', x: 1000, y: 550, isObstacle: true }
    ]
  },

  zone_9: {
    id: 'zone_9',
    zoneNumber: 9,
    name: '9. โรงยิมร้าง & ตึกชมรมกีฬา [SUB-DUNGEON]',
    subtitle: 'Abandoned Gym // แดนประลองชมรม & มินิบอสมวยปล้ำ',
    levelRange: 'Lv. 10 - 14',
    isSafeZone: false,
    allowDuel: true,
    floorType: 'wood_parquet',
    themeColor: 0x2b1d3a,
    ambientTint: 0x9d4edd,
    bannerColor: '#c77dff',
    mapWidth: 1800,
    mapHeight: 1300,
    walkableBounds: { x: 120, y: 240, width: 1560, height: 960 },
    portals: [
      {
        targetZone: 'zone_1',
        label: '▲ หน้าประตูโรงเรียน (Safe)',
        direction: 'UP',
        x: 800,
        y: 160,
        spawnX: 800,
        spawnY: 940
      }
    ],
    npcs: [],
    monsters: [
      { monsterId: 'kendo_captain', name: 'อดีตกัปตันชมรมเคนโด้ (Ex-Kendo Captain)', level: 12, damageType: 'Slash', count: 4 },
      { monsterId: 'baseball_slugger', name: 'อดีตกัปตันชมรมเบสบอล (Ex-Baseball Slugger)', level: 13, damageType: 'Strike', count: 3 },
      { monsterId: 'titan_wrestler', name: '★ ไททันชมรมมวยปล้ำ (Wrestling Titan [MINI-BOSS])', level: 14, damageType: 'Strike', count: 1, x: 800, y: 550, isMiniBoss: true }
    ],
    props: [
      // Makeshift Boxing Ring Barricades
      { texture: 'barrier', x: 620, y: 460, isObstacle: true },
      { texture: 'barrier', x: 980, y: 460, isObstacle: true },
      { texture: 'barrier', x: 620, y: 680, isObstacle: true },
      { texture: 'barrier', x: 980, y: 680, isObstacle: true },
      { texture: 'prop_iso_desk_pile', x: 350, y: 350, isObstacle: true },
      { texture: 'prop_iso_desk_pile', x: 1250, y: 350, isObstacle: true },
      { texture: 'prop_iso_oil_barrels', x: 400, y: 850, isObstacle: true },
      { texture: 'prop_iso_oil_barrels', x: 1200, y: 850, isObstacle: true }
    ]
  },

  zone_10: {
    id: 'zone_10',
    zoneNumber: 10,
    name: '10. ดาดฟ้าตึกเรียนหลัก [DUEL ARENA & BOSS HUB]',
    subtitle: 'Suzuran Rooftop Arena // ลานประลองท้าดวล & ผู้นำสถาบัน',
    levelRange: 'Lv. 12 - 15',
    isSafeZone: true,
    allowDuel: true,
    floorType: 'concrete',
    themeColor: 0x3d2c2e,
    ambientTint: 0xff9e64, // Sunset orange sky tint
    bannerColor: '#ff2a6d',
    mapWidth: 1600,
    mapHeight: 1200,
    walkableBounds: { x: 140, y: 240, width: 1320, height: 860 },
    portals: [
      {
        targetZone: 'zone_8',
        label: '▼ บันไดหนีไฟ (Lv.10-12)',
        direction: 'DOWN',
        x: 800,
        y: 1040,
        spawnX: 800,
        spawnY: 260
      }
    ],
    npcs: [
      { npcType: 'MISS_POPPY', x: 600, y: 560 },
      { npcType: 'ELIZABETH', x: 800, y: 440 },
      { npcType: 'YAMATO', x: 1000, y: 560 }
    ],
    monsters: [
      // Serizawa Rooftop King & Vanguard (Duelable Boss)
      { monsterId: 'boss_serizawa', name: '👑 เซริซาวะ ทามาโอะ (The Rooftop King [BOSS])', level: 15, damageType: 'Strike', count: 1, x: 800, y: 620, isMiniBoss: true }
    ],
    props: [
      // Fences & Walls
      { texture: 'prop_iso_chainlink_fence', x: 420, y: 260, isObstacle: true },
      { texture: 'prop_iso_chainlink_fence', x: 560, y: 260, isObstacle: true },
      { texture: 'prop_iso_concrete_wall', x: 1040, y: 260, flipX: true, isObstacle: true },
      { texture: 'prop_iso_concrete_wall', x: 1180, y: 260, flipX: true, isObstacle: true },
      { texture: 'prop_rooftop_stair_hut_pixel', x: 800, y: 250, scale: 1.2, isObstacle: true, interactive: true, interactMessage: '🚪 ประตูบันไดหนีไฟเชื่อมลงสู่อาคารเรียน!' },
      { texture: 'prop_rooftop_water_tank', x: 1260, y: 320, scale: 1.2, isObstacle: true, interactive: true, interactMessage: '💧 แท็งก์น้ำเก่า พ่นสี "SUZURAN - CROWS AT THE APEX"' },
      { texture: 'prop_iso_desk_pile', x: 380, y: 460, isObstacle: true },
      { texture: 'prop_iso_oil_barrels', x: 1220, y: 480, isObstacle: true },
      { texture: 'prop_iso_oil_barrels', x: 380, y: 780, isObstacle: true },
      { texture: 'prop_iso_desk_pile', x: 1220, y: 780, isObstacle: true }
    ]
  }
};

