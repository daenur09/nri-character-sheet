import type { DieType } from '../mechanics/dice';

export type AttributeName =
  | 'agility'
  | 'smarts'
  | 'spirit'
  | 'strength'
  | 'vigor';

/**
 * Описание одного навыка персонажа.
 */
export interface Skill {
  /** Название навыка. */
  name: string;
  /** К какому атрибуту привязан. */
  attribute: AttributeName;
  /** Тип кубика. */
  die: DieType;
  /** Модификатор к броскам. */
  modifier: number;
  /** Является ли базовым (Core Skill). */
  isCore: boolean;
  /** Источник контента: 'core', 'barbarians', 'custom'. */
  sourceId?: string;
}

/**
 * Описание черты (Edge).
 */
export interface Edge {
  id: string;
  name: string;
  description: string;
  /** Источник контента. */
  sourceId?: string;
}

/**
 * Описание изъяна (Hindrance).
 */
export interface Hindrance {
  id: string;
  name: string;
  description: string;
  severity: 'minor' | 'major';
  /** Источник контента. */
  sourceId?: string;
}

/**
 * Описание одного повышения (Advancement).
 */
export interface Advancement {
  type: 'attribute' | 'skill_above_attr' | 'skill_below_attr' | 'new_skill' | 'edge';
  description: string;
  rankAtTime: string;
  target?: string;
  target2?: string;
}

/**
 * Модель персонажа.
 */
export interface Character {
  id: string;
  profile: {
    name: string;
    rank: string;
    concept: string;
    appearance: string;
    motto: string;
    xp: number;
  };
  attributes: Record<AttributeName, DieType>;
  skills: Skill[];
  edges: Edge[];
  hindrances: Hindrance[];
  isWildCard: boolean;
  wounds: number;
  fatigue: number;
  bennies: number;
  advancements: Advancement[];
  attributesRaisedThisRank: AttributeName[];
}

/**
 * Производные параметры.
 */
export interface DerivedStats {
  parry: number;
  toughness: number;
  charisma: number;
  pace: number;
}