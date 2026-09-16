import type { Character, DerivedStats, AttributeName } from '../models/character';
import { dieToNumber } from './dice';
import { EDGES, type EdgeEffects } from '../data/edges';
import { HINDRANCES } from '../data/hindrances';

/**
 * Находит эффекты черты по её id в каталоге.
 * Если черты нет в каталоге (кастомная) — возвращает пустой объект.
 */
function getEdgeEffects(edgeId: string): EdgeEffects {
  const edge = EDGES.find((e) => e.id === edgeId);
  return edge?.effects ?? {};
}

/**
 * Находит эффекты изъяна по его id в каталоге.
 */
function getHindranceEffects(hindranceId: string): EdgeEffects {
  const hindrance = HINDRANCES.find((h) => h.id === hindranceId);
  return hindrance?.effects ?? {};
}

/**
 * Находит навык по имени.
 */
function findSkill(character: Character, skillName: string) {
  return character.skills.find((s) => s.name === skillName);
}

/**
 * Считает значение атрибута персонажа с учётом эффектов черт и изъянов.
 */
function getEffectiveAttribute(
  character: Character,
  attribute: AttributeName
): number {
  let value = dieToNumber(character.attributes[attribute]);

  for (const edge of character.edges) {
    const effects = getEdgeEffects(edge.id);
    if (effects.attributeBonus?.[attribute]) {
      value += effects.attributeBonus[attribute]!;
    }
  }

  for (const hindrance of character.hindrances) {
    const effects = getHindranceEffects(hindrance.id);
    if (effects.attributeBonus?.[attribute]) {
      value += effects.attributeBonus[attribute]!;
    }
  }

  return Math.max(4, value);
}

/**
 * Считает эффективное значение навыка с учётом эффектов черт и изъянов.
 */
function getEffectiveSkill(character: Character, skillName: string): number {
  const skill = findSkill(character, skillName);
  if (!skill) return 0;

  let value = dieToNumber(skill.die) + skill.modifier;

  for (const edge of character.edges) {
    const effects = getEdgeEffects(edge.id);
    if (effects.skillBonus?.[skillName]) {
      value += effects.skillBonus[skillName]!;
    }
  }

  for (const hindrance of character.hindrances) {
    const effects = getHindranceEffects(hindrance.id);
    if (effects.skillBonus?.[skillName]) {
      value += effects.skillBonus[skillName]!;
    }
  }

  return value;
}

/**
 * Рассчитывает производные параметры персонажа.
 * Учитывает эффекты всех черт и изъянов, взятые из каталогов.
 */
export function calculateDerivedStats(character: Character): DerivedStats {
  // --- Parry ---
  const fightingDie = getEffectiveSkill(character, 'Драка');
  let parry = 2 + Math.floor(fightingDie / 2);

  for (const edge of character.edges) {
    const effects = getEdgeEffects(edge.id);
    if (effects.parryBonus) parry += effects.parryBonus;
  }

  // --- Toughness ---
  const vigorValue = getEffectiveAttribute(character, 'vigor');
  let toughness = 2 + Math.floor(vigorValue / 2);

  for (const edge of character.edges) {
    const effects = getEdgeEffects(edge.id);
    if (effects.toughnessBonus) toughness += effects.toughnessBonus;
  }
  for (const hindrance of character.hindrances) {
    const effects = getHindranceEffects(hindrance.id);
    if (effects.toughnessBonus) toughness += effects.toughnessBonus;
  }

  // --- Charisma ---
  let charisma = 0;

  for (const edge of character.edges) {
    const effects = getEdgeEffects(edge.id);
    if (effects.charismaBonus) charisma += effects.charismaBonus;
  }
  for (const hindrance of character.hindrances) {
    const effects = getHindranceEffects(hindrance.id);
    if (effects.charismaBonus) charisma += effects.charismaBonus;
  }

  // --- Pace ---
  let pace = 6;

  for (const edge of character.edges) {
    const effects = getEdgeEffects(edge.id);
    if (effects.paceBonus) pace += effects.paceBonus;
  }
  for (const hindrance of character.hindrances) {
    const effects = getHindranceEffects(hindrance.id);
    if (effects.paceBonus) pace += effects.paceBonus;
  }

  // Ранения уменьшают Pace (минимум 1)
  pace = Math.max(1, pace - character.wounds);

  return { parry, toughness, charisma, pace };
}