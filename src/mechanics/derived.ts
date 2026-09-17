import type {
  Character,
  DerivedStats,
  AttributeName,
  Edge,
  Hindrance,
} from '../models/character';
import { dieToNumber } from './dice';
import { EDGES, type EdgeEffects } from '../data/edges';
import { HINDRANCES } from '../data/hindrances';

/**
 * Возвращает эффекты черты персонажа.
 *
 * Приоритет:
 *   1) собственное поле `edge.effects` (заполнено при добавлении —
 *      важно для кастомных черт, которых нет в каталоге EDGES);
 *   2) каталог EDGES по `id` (фолбэк для старых сохранений);
 *   3) пустой объект.
 *
 * Такая схема даёт прозрачную миграцию: старые персонажи в IndexedDB
 * не имеют поля `effects`, но при расчёте производных они получают
 * эффекты из каталога. Новые — уже хранят effects явно.
 */
function getEdgeEffects(edge: Edge): EdgeEffects {
  if (edge.effects) return edge.effects;
  const fromCatalog = EDGES.find((e) => e.id === edge.id);
  return fromCatalog?.effects ?? {};
}

function getHindranceEffects(hindrance: Hindrance): EdgeEffects {
  if (hindrance.effects) return hindrance.effects;
  const fromCatalog = HINDRANCES.find((h) => h.id === hindrance.id);
  return fromCatalog?.effects ?? {};
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
    const effects = getEdgeEffects(edge);
    if (effects.attributeBonus?.[attribute]) {
      value += effects.attributeBonus[attribute]!;
    }
  }

  for (const hindrance of character.hindrances) {
    const effects = getHindranceEffects(hindrance);
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
    const effects = getEdgeEffects(edge);
    if (effects.skillBonus?.[skillName]) {
      value += effects.skillBonus[skillName]!;
    }
  }

  for (const hindrance of character.hindrances) {
    const effects = getHindranceEffects(hindrance);
    if (effects.skillBonus?.[skillName]) {
      value += effects.skillBonus[skillName]!;
    }
  }

  return value;
}

/**
 * Рассчитывает производные параметры персонажа.
 *
 * Учитывает эффекты всех черт и изъянов:
 *  - сначала берётся собственное поле `effects` (для кастомных);
 *  - если его нет — эффекты подставляются из каталога по `id`
 *    (прозрачная миграция старых сохранений).
 */
export function calculateDerivedStats(character: Character): DerivedStats {
  // --- Parry ---
  const fightingDie = getEffectiveSkill(character, 'Драка');
  let parry = 2 + Math.floor(fightingDie / 2);

  for (const edge of character.edges) {
    const effects = getEdgeEffects(edge);
    if (effects.parryBonus) parry += effects.parryBonus;
  }
  for (const hindrance of character.hindrances) {
    const effects = getHindranceEffects(hindrance);
    if (effects.parryBonus) parry += effects.parryBonus;
  }

  // --- Toughness ---
  const vigorValue = getEffectiveAttribute(character, 'vigor');
  let toughness = 2 + Math.floor(vigorValue / 2);

  for (const edge of character.edges) {
    const effects = getEdgeEffects(edge);
    if (effects.toughnessBonus) toughness += effects.toughnessBonus;
  }
  for (const hindrance of character.hindrances) {
    const effects = getHindranceEffects(hindrance);
    if (effects.toughnessBonus) toughness += effects.toughnessBonus;
  }

  // --- Charisma ---
  let charisma = 0;

  for (const edge of character.edges) {
    const effects = getEdgeEffects(edge);
    if (effects.charismaBonus) charisma += effects.charismaBonus;
  }
  for (const hindrance of character.hindrances) {
    const effects = getHindranceEffects(hindrance);
    if (effects.charismaBonus) charisma += effects.charismaBonus;
  }

  // --- Pace ---
  let pace = 6;

  for (const edge of character.edges) {
    const effects = getEdgeEffects(edge);
    if (effects.paceBonus) pace += effects.paceBonus;
  }
  for (const hindrance of character.hindrances) {
    const effects = getHindranceEffects(hindrance);
    if (effects.paceBonus) pace += effects.paceBonus;
  }

  // Ранения уменьшают Pace (минимум 1)
  pace = Math.max(1, pace - character.wounds);

  return { parry, toughness, charisma, pace };
}