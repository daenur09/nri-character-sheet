import type { Character } from '../models/character';
import { dieToNumber } from './dice';
import { calculateRank } from './advancement';
import {
  type Requirements,
  type RequirementCheck,
  RANK_WEIGHT,
  type Rank,
} from '../types/requirements';

const ATTRIBUTE_LABELS: Record<string, string> = {
  agility: 'Ловкость',
  smarts: 'Смекалка',
  spirit: 'Характер',
  strength: 'Сила',
  vigor: 'Выносливость',
};

/**
 * Проверяет, соответствует ли персонаж требованиям элемента.
 */
export function checkRequirements(
  character: Character,
  requirements?: Requirements
): RequirementCheck {
  if (!requirements) return { ok: true, reasons: [] };

  const reasons: string[] = [];

  // --- Ранг ---
  if (requirements.minRank) {
    const currentRank = calculateRank(character.profile.xp) as Rank;
    const currentWeight = RANK_WEIGHT[currentRank] ?? 0;
    const requiredWeight = RANK_WEIGHT[requirements.minRank] ?? 0;
    if (currentWeight < requiredWeight) {
      reasons.push(`Требуется ранг ${requirements.minRank}`);
    }
  }

  // --- Атрибуты ---
  if (requirements.attributes) {
    for (const [attrName, minDie] of Object.entries(requirements.attributes)) {
      if (!minDie) continue;
      const currentDie = character.attributes[attrName as keyof typeof character.attributes];
      if (!currentDie) continue;
      const currentValue = dieToNumber(currentDie);
      const requiredValue = dieToNumber(minDie);
      if (currentValue < requiredValue) {
        const label = ATTRIBUTE_LABELS[attrName] ?? attrName;
        reasons.push(`${label} ${minDie}+ (у вас ${currentDie})`);
      }
    }
  }

  // --- Навыки ---
  if (requirements.skills) {
    for (const [skillName, minDie] of Object.entries(requirements.skills)) {
      const skill = character.skills.find((s) => s.name === skillName);
      if (!skill) {
        reasons.push(`Навык «${skillName}» ${minDie}+`);
        continue;
      }
      const currentValue = dieToNumber(skill.die);
      const requiredValue = dieToNumber(minDie);
      if (currentValue < requiredValue) {
        reasons.push(`${skillName} ${minDie}+ (у вас ${skill.die})`);
      }
    }
  }

  // --- Обязательные черты ---
  if (requirements.edges && requirements.edges.length > 0) {
    for (const edgeId of requirements.edges) {
      if (!character.edges.some((e) => e.id === edgeId)) {
        reasons.push(`Требуется черта: ${edgeId}`);
      }
    }
  }

  // --- Обязательные изъяны ---
  if (requirements.hindrances && requirements.hindrances.length > 0) {
    for (const hindranceId of requirements.hindrances) {
      if (!character.hindrances.some((h) => h.id === hindranceId)) {
        reasons.push(`Требуется изъян: ${hindranceId}`);
      }
    }
  }

  // --- Запрещённые изъяны ---
  if (requirements.forbiddenHindrances && requirements.forbiddenHindrances.length > 0) {
    for (const hindranceId of requirements.forbiddenHindrances) {
      if (character.hindrances.some((h) => h.id === hindranceId)) {
        reasons.push(`Нельзя иметь изъян: ${hindranceId}`);
      }
    }
  }

  return {
    ok: reasons.length === 0,
    reasons,
  };
}

/**
 * Форматирует требования в читаемую строку.
 * Например: «Новичок, Драка d8+, Ловкость d6+».
 */
export function formatRequirements(requirements?: Requirements): string {
  if (!requirements) return '';

  const parts: string[] = [];

  if (requirements.minRank && requirements.minRank !== 'Новичок') {
    parts.push(requirements.minRank);
  }

  if (requirements.attributes) {
    for (const [attrName, die] of Object.entries(requirements.attributes)) {
      if (!die) continue;
      const label = ATTRIBUTE_LABELS[attrName] ?? attrName;
      parts.push(`${label} ${die}+`);
    }
  }

  if (requirements.skills) {
    for (const [skillName, die] of Object.entries(requirements.skills)) {
      parts.push(`${skillName} ${die}+`);
    }
  }

  if (requirements.edges) {
    for (const edgeId of requirements.edges) {
      parts.push(`черта: ${edgeId}`);
    }
  }

  if (requirements.hindrances) {
    for (const hindranceId of requirements.hindrances) {
      parts.push(`изъян: ${hindranceId}`);
    }
  }

  if (requirements.forbiddenHindrances) {
    for (const hindranceId of requirements.forbiddenHindrances) {
      parts.push(`без изъяна: ${hindranceId}`);
    }
  }

  return parts.join(', ');
}