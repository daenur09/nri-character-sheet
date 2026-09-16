import type { Character, AttributeName } from '../models/character';
import type { DieType } from '../mechanics/dice';

/**
 * Читает значение из персонажа по пути вида "profile.name" или "attributes.agility".
 * Возвращает undefined, если путь не найден.
 */
export function getValueByPath(character: Character, path: string): unknown {
  if (!path) return undefined;
  const parts = path.split('.');

  // attributes.agility
  if (parts[0] === 'attributes' && parts.length === 2) {
    return character.attributes[parts[1] as AttributeName];
  }

  // profile.name
  if (parts[0] === 'profile' && parts.length === 2) {
    return (character.profile as unknown as Record<string, unknown>)[parts[1]];
  }

  // skills.Драка (или skills.Знание.История)
  if (parts[0] === 'skills' && parts.length >= 2) {
    const name = parts.slice(1).join('.');
    const skill = character.skills.find((s) => s.name === name);
    return skill?.die;
  }

  // wounds, fatigue, bennies
  if (parts.length === 1) {
    if (parts[0] === 'wounds') return character.wounds;
    if (parts[0] === 'fatigue') return character.fatigue;
    if (parts[0] === 'bennies') return character.bennies;
  }

  return undefined;
}

/**
 * Устанавливает значение в персонаже по пути. Возвращает нового персонажа.
 * Если путь не распознан — возвращает исходного персонажа.
 */
export function setValueByPath(
  character: Character,
  path: string,
  value: unknown
): Character {
  if (!path) return character;
  const parts = path.split('.');

  if (parts[0] === 'attributes' && parts.length === 2) {
    return {
      ...character,
      attributes: {
        ...character.attributes,
        [parts[1]]: value as DieType,
      },
    };
  }

  if (parts[0] === 'profile' && parts.length === 2) {
    return {
      ...character,
      profile: {
        ...character.profile,
        [parts[1]]: value,
      },
    };
  }

  if (parts[0] === 'skills' && parts.length >= 2) {
    const name = parts.slice(1).join('.');
    return {
      ...character,
      skills: character.skills.map((s) =>
        s.name === name ? { ...s, die: value as DieType } : s
      ),
    };
  }

  if (parts.length === 1) {
    if (parts[0] === 'wounds') {
      return {
        ...character,
        wounds: Math.max(0, Math.min(3, Number(value) || 0)),
      };
    }
    if (parts[0] === 'fatigue') {
      return {
        ...character,
        fatigue: Math.max(0, Math.min(2, Number(value) || 0)),
      };
    }
    if (parts[0] === 'bennies') {
      return {
        ...character,
        bennies: Math.max(0, Number(value) || 0),
      };
    }
  }

  return character;
}

/**
 * Проверяет, является ли путь валидным (существует ли такое поле у персонажа).
 */
export function isValidPath(character: Character, path: string): boolean {
  return getValueByPath(character, path) !== undefined;
}