export type FactionId = 'GEARHEADS' | 'ELITES' | 'SYNDICATE';

export interface FactionData {
  id: FactionId;
  name: string;
  subName: string;
  themeColor: number;
  hexColor: string;
  accentColor: string;
  leader: string;
  leaderTitle: string;
  homeBase: string;
  passiveName: string;
  passives: string[];
  description: string;
}

export type PlayerClassId =
  | 'VANGUARD'
  | 'BRAWLER'
  | 'STRIKER'
  | 'SHARPSHOOTER'
  | 'SUPPLIER'
  | 'INSTIGATOR'
  | 'SABOTEUR';

export interface ClassData {
  id: PlayerClassId;
  name: string;
  thaiName: string;
  role: string;
  primaryDamageType: DamageType;
  subclasses: string[];
  description: string;
  baseWeapon: string;
  starterStats: {
    str: number;
    agi: number;
    int: number;
    dex: number;
    vit: number;
    luk: number;
  };
}

export type DamageType = 'SLASH' | 'PIERCE' | 'STRIKE';

export type StatusEffectType = 'BLEED' | 'BURN' | 'STUN' | 'FRACTURE' | 'AURA_BOOST';

export interface StatusEffect {
  type: StatusEffectType;
  duration: number; // in seconds
  elapsed: number;
  potency: number;
  tickInterval?: number;
  lastTick?: number;
}

export interface CharacterStats {
  str: number;
  agi: number;
  int: number;
  dex: number;
  vit: number;
  luk: number;

  level: number;
  exp: number;
  maxExp: number;
  statPoints: number;

  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  aura: number;
  maxAura: number;

  physicalAttack: number;
  auraPower: number;
  defense: number;
  critChance: number;
  critMultiplier: number;
  moveSpeed: number;
}

export interface SkillConfig {
  id: string;
  name: string;
  keySlot: 'LCLICK' | 'RCLICK' | 'Q' | '1' | '2' | '3' | '4' | 'E' | 'SPACE';
  cooldown: number; // in ms
  lastUsedTime: number;
  auraCost: number;
  staminaCost: number;
  damageType: DamageType;
  baseDamage: number;
  description: string;
  iconChar: string;
}

export interface DamageResult {
  damage: number;
  isCrit: boolean;
  damageType: DamageType;
  statusApplied?: StatusEffectType;
}

export interface ChatMessage {
  id: string;
  sender: string;
  channel: 'ALL' | 'FACTION' | 'GANG' | 'SYSTEM';
  text: string;
  timestamp: string;
  faction?: FactionId;
}

