/**
 * Тип монстра по роли в бою.
 */
export type MonsterRole =
  | 'статист'      // обычный противник
  | 'приспешник'   // более живучий
  | 'правая_рука'  // босс-помощник
  | 'дикая_карта'  // босс, главный злодей
  | 'существо'     // животные, монстры
  | 'животное';

/**
 * Ранг монстра (соответствует рангам персонажей).
 */
export type MonsterRank = 'Новичок' | 'Закалённый' | 'Ветеран' | 'Герой' | 'Легенда';

/**
 * Категория монстра.
 */
export type MonsterCategory =
  | 'Животные'
  | 'Чудовища'
  | 'Нежить'
  | 'Демоны'
  | 'Люди'
  | 'Культы'
  | 'Уникальные существа';

/**
 * Атрибуты монстра.
 */
export interface MonsterAttributes {
  agility: string;   // "d6"
  smarts: string;
  spirit: string;
  strength: string;
  vigor: string;
}

/**
 * Навык монстра.
 */
export interface MonsterSkill {
  name: string;
  die: string;       // "d8"
}

/**
 * Особенность монстра (броня, атака, слабость и т.д.).
 */
export interface MonsterAbility {
  name: string;
  description: string;
}

/**
 * Полное описание монстра.
 */
export interface Monster {
  /** Уникальный идентификатор. */
  id: string;
  /** Название (на русском). */
  name: string;
  /** Английское название (для ссылок). */
  nameEn?: string;
  /** Источник: книга, из которой взят монстр. */
  source: string;
  /** Категория. */
  category: MonsterCategory;
  /** Роль в бою. */
  role: MonsterRole;
  /** Ранг монстра. */
  rank: MonsterRank;
  /** Краткое описание. */
  description: string;
  /** Атрибуты. */
  attributes: MonsterAttributes;
  /** Навыки. */
  skills: MonsterSkill[];
  /** Шаг (клеток). */
  pace: number;
  /** Значение бега, если отличается от стандартного. */
  runDie?: string;
  /** Защита (Parry). */
  parry: number;
  /** Стойкость (Toughness), например "6+2". */
  toughness: string;
  /** Харизма (если важна). */
  charisma?: number;
  /** Черты. */
  edges?: string[];
  /** Изъяны. */
  hindrances?: string[];
  /** Снаряжение. */
  gear?: string[];
  /** Особенности (броня, атаки, слабости). */
  abilities: MonsterAbility[];
  /** Теги для поиска (например, "лес", "ночь", "яд"). */
  tags?: string[];
}