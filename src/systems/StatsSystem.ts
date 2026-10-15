import { CharacterStats, FactionId, PlayerClassId } from '../types/game';
import { CLASSES, FACTIONS } from '../data/gameData';

export class StatsSystem {
  public static createInitialStats(factionId: FactionId, classId: PlayerClassId): CharacterStats {
    const classData = CLASSES[classId];
    const starter = classData.starterStats;

    const stats: CharacterStats = {
      str: starter.str,
      agi: starter.agi,
      int: starter.int,
      dex: starter.dex,
      vit: starter.vit,
      luk: starter.luk,

      level: 1,
      exp: 0,
      maxExp: 100,
      statPoints: 5,

      hp: 200,
      maxHp: 200,
      stamina: 100,
      maxStamina: 100,
      aura: 100,
      maxAura: 100,

      physicalAttack: 30,
      auraPower: 25,
      defense: 15,
      critChance: 0.05,
      critMultiplier: 1.5,
      moveSpeed: 190
    };

    StatsSystem.recalculateDerivedStats(stats, factionId);
    stats.hp = stats.maxHp;
    stats.stamina = stats.maxStamina;
    stats.aura = stats.maxAura;
    return stats;
  }

  public static recalculateDerivedStats(stats: CharacterStats, factionId: FactionId) {
    let hpMultiplier = 1.0;
    let critBonus = 0;
    let speedBonus = 0;

    // Faction Passives
    if (factionId === 'GEARHEADS') {
      hpMultiplier += 0.15; // Blood of Iron
    } else if (factionId === 'ELITES') {
      critBonus += 0.12; // Deadly Point
    } else if (factionId === 'SYNDICATE') {
      speedBonus += 0.15; // Pack Mentality
    }

    stats.maxHp = Math.round((150 + stats.vit * 18 + stats.str * 4) * hpMultiplier);
    stats.maxStamina = Math.round(100 + stats.agi * 5 + stats.vit * 3);
    stats.maxAura = Math.round(100 + stats.int * 12 + stats.dex * 3);

    stats.physicalAttack = Math.round(20 + stats.str * 4.5 + stats.dex * 1.5);
    stats.auraPower = Math.round(20 + stats.int * 5.5 + stats.str * 1.0);
    stats.defense = Math.round(stats.vit * 2.2 + stats.str * 0.8);

    stats.critChance = Math.min(0.75, 0.05 + (stats.luk * 0.008) + (stats.dex * 0.004) + critBonus);
    stats.critMultiplier = 1.5 + (stats.luk * 0.015);
    stats.moveSpeed = Math.round((180 + stats.agi * 2.8) * (1.0 + speedBonus));

    // Clamp current values
    stats.hp = Math.min(stats.hp, stats.maxHp);
    stats.stamina = Math.min(stats.stamina, stats.maxStamina);
    stats.aura = Math.min(stats.aura, stats.maxAura);
  }

  public static addExp(stats: CharacterStats, amount: number, factionId: FactionId): boolean {
    if (stats.level >= 100) return false;

    stats.exp += amount;
    let leveledUp = false;

    while (stats.exp >= stats.maxExp && stats.level < 100) {
      stats.exp -= stats.maxExp;
      stats.level += 1;
      stats.statPoints += 4;
      stats.maxExp = Math.round(100 * Math.pow(stats.level, 1.35));
      leveledUp = true;
    }

    if (leveledUp) {
      StatsSystem.recalculateDerivedStats(stats, factionId);
      // Fully restore upon level up!
      stats.hp = stats.maxHp;
      stats.stamina = stats.maxStamina;
      stats.aura = stats.maxAura;
    }

    return leveledUp;
  }

  public static allocatePoint(stats: CharacterStats, statName: keyof Pick<CharacterStats, 'str' | 'agi' | 'int' | 'dex' | 'vit' | 'luk'>, factionId: FactionId): boolean {
    if (stats.statPoints <= 0) return false;
    stats[statName] += 1;
    stats.statPoints -= 1;
    StatsSystem.recalculateDerivedStats(stats, factionId);
    return true;
  }
}

