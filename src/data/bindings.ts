import type { Character, AttributeName } from '../models/character';
import type { FieldType } from '../types/fieldmap';

/**
 * Описание одной привязки: путь к свойству персонажа и метка для отображения.
 */
export interface BindingOption {
  /** Технический путь к свойству персонажа. */
  path: string;
  /** Человекочитаемое название (например, «Ловкость»). */
  label: string;
  /** Категория для группировки в выпадающем списке. */
  category: string;
  /** Какие типы полей могут использовать эту привязку. */
  compatibleTypes: FieldType[];
}

const ATTRIBUTE_LABELS: Record<AttributeName, string> = {
  agility: 'Ловкость',
  smarts: 'Смекалка',
  spirit: 'Характер',
  strength: 'Сила',
  vigor: 'Выносливость',
};

/**
 * Возвращает полный список привязок, доступных для данного персонажа.
 * Если персонаж не передан — возвращаются только универсальные привязки
 * (без навыков).
 */
export function buildBindingOptions(
  character?: Character | null
): BindingOption[] {
  const options: BindingOption[] = [
    // --- Профиль ---
    { path: 'profile.name', label: 'Имя', category: 'Профиль', compatibleTypes: ['text'] },
    { path: 'profile.rank', label: 'Звание', category: 'Профиль', compatibleTypes: ['text'] },
    { path: 'profile.concept', label: 'Концепция', category: 'Профиль', compatibleTypes: ['text'] },
    { path: 'profile.appearance', label: 'Внешность', category: 'Профиль', compatibleTypes: ['text'] },
    { path: 'profile.motto', label: 'Девиз', category: 'Профиль', compatibleTypes: ['text'] },
    { path: 'profile.xp', label: 'Опыт (XP)', category: 'Профиль', compatibleTypes: ['number'] },

    // --- Атрибуты ---
    ...(Object.keys(ATTRIBUTE_LABELS) as AttributeName[]).map((attr) => ({
      path: `attributes.${attr}`,
      label: ATTRIBUTE_LABELS[attr],
      category: 'Атрибуты',
      compatibleTypes: ['die'] as FieldType[],
    })),

    // --- Трекинг ---
    { path: 'wounds', label: 'Ранения', category: 'Трекинг', compatibleTypes: ['number'] },
    { path: 'fatigue', label: 'Усталость', category: 'Трекинг', compatibleTypes: ['number'] },
    { path: 'bennies', label: 'Фишки', category: 'Трекинг', compatibleTypes: ['number'] },
  ];

  // --- Навыки (динамически, из персонажа) ---
  if (character) {
    for (const skill of character.skills) {
      options.push({
        path: `skills.${skill.name}`,
        label: `Навык: ${skill.name}`,
        category: 'Навыки',
        compatibleTypes: ['die'],
      });
    }
  }

  return options;
}

/**
 * Пытается угадать привязку по имени поля.
 * Возвращает технический путь или null, если угадать не удалось.
 */
export function guessBinding(
  fieldName: string,
  character?: Character | null
): string | null {
  const name = fieldName.toLowerCase().trim();
  if (!name) return null;

  // --- Профиль ---
  if (/^(имя|name)$/i.test(name)) return 'profile.name';
  if (/^(звание|rank|номер)/i.test(name)) return 'profile.rank';
  if (/^(концепц|concept)/i.test(name)) return 'profile.concept';
  if (/^(внешност|appearance)/i.test(name)) return 'profile.appearance';
  if (/^(девиз|motto)/i.test(name)) return 'profile.motto';
  if (/^(опыт|xp|оп\b)/i.test(name)) return 'profile.xp';

  // --- Атрибуты ---
  if (/ловкост/i.test(name)) return 'attributes.agility';
  if (/смекалк/i.test(name)) return 'attributes.smarts';
  if (/характер|дух\b|spirit/i.test(name)) return 'attributes.spirit';
  if (/^сила\b|\bсила\b|strength/i.test(name)) return 'attributes.strength';
  if (/выносливост|vigor/i.test(name)) return 'attributes.vigor';

  // --- Трекинг ---
  if (/ранени|wounds/i.test(name)) return 'wounds';
  if (/усталост|fatigue/i.test(name)) return 'fatigue';
  if (/фишки|bennies|фишк/i.test(name)) return 'bennies';

  // --- Навыки (ищем совпадение с именем навыка персонажа) ---
  if (character) {
    for (const skill of character.skills) {
      if (name.includes(skill.name.toLowerCase())) {
        return `skills.${skill.name}`;
      }
    }
  }

  return null;
}