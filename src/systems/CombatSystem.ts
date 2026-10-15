import { CharacterStats, DamageResult, DamageType, StatusEffect, StatusEffectType } from '../types/game';

export class CombatSystem {
  public static calculateDamage(
    attackerStats: CharacterStats,
    baseSkillDamage: number,
    damageType: DamageType,
    targetDefense: number,
    isAuraActive: boolean = false
  ): DamageResult {
    // 1. Calculate raw attack power
    const rawPower = attackerStats.physicalAttack + baseSkillDamage;
    const auraBonus = isAuraActive ? (attackerStats.auraPower * 0.45) : 0;
    const totalAttack = rawPower + auraBonus;

    // 2. Armor penetration and defense calculation
    let effectiveDefense = targetDefense;
    if (damageType === 'PIERCE') {
      effectiveDefense = Math.max(0, targetDefense * 0.60); // 40% Armor Penetration
    }

    const mitigation = 100 / (100 + effectiveDefense);
    let finalDamage = totalAttack * mitigation;

    // 3. Random variation ±10%
    const variation = 0.90 + Math.random() * 0.20;
    finalDamage *= variation;

    // 4. Critical Strike Check
    let isCrit = false;
    let critChance = attackerStats.critChance;
    if (damageType === 'PIERCE') {
      critChance += 0.15; // Higher crit chance for Pierce
    }

    if (Math.random() < critChance) {
      isCrit = true;
      finalDamage *= attackerStats.critMultiplier;
    }

    // 5. Status effect chance
    let statusApplied: StatusEffectType | undefined;
    const roll = Math.random();
    if (damageType === 'SLASH' && roll < 0.35) {
      statusApplied = 'BLEED';
    } else if (damageType === 'PIERCE' && roll < 0.25) {
      statusApplied = 'BURN';
    } else if (damageType === 'STRIKE' && roll < 0.30) {
      statusApplied = 'FRACTURE';
    }

    return {
      damage: Math.max(1, Math.round(finalDamage)),
      isCrit,
      damageType,
      statusApplied
    };
  }

  public static getDamageColor(damageType: DamageType, isCrit: boolean): string {
    if (isCrit) return '#ff0033'; // Deep critical red
    switch (damageType) {
      case 'SLASH': return '#ff7700'; // Fierce orange
      case 'PIERCE': return '#05d9e8'; // Electric sapphire cyan
      case 'STRIKE': return '#ffea00'; // Golden strike yellow
      default: return '#ffffff';
    }
  }

  public static getDamageTypeName(damageType: DamageType): string {
    switch (damageType) {
      case 'SLASH': return 'ฟัน (Slash)';
      case 'PIERCE': return 'แทง (Pierce)';
      case 'STRIKE': return 'ทุบ (Strike)';
    }
  }
}

