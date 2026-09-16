import type { AttributeName } from '../models/character';
import type { EdgeEffects } from '../data/edges';
import type { HindranceSeverity } from '../data/hindrances';
import type { Requirements } from './requirements';

/**
 * Общие поля для всех кастомных элементов.
 */
export interface CustomContentBase {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Кастомная черта (Edge).
 */
export interface CustomEdge extends CustomContentBase {
  type: 'edge';
  requirements?: Requirements;
  effects: EdgeEffects;
}

/**
 * Кастомный изъян (Hindrance).
 */
export interface CustomHindrance extends CustomContentBase {
  type: 'hindrance';
  severity: HindranceSeverity;
  requirements?: Requirements;
  effects: EdgeEffects;
}

/**
 * Кастомный навык (Skill).
 */
export interface CustomSkill extends CustomContentBase {
  type: 'skill';
  attribute: AttributeName;
  isCore: boolean;
  hasSpecialization?: boolean;
}

/**
 * Кастомная сила (Power).
 */
export interface CustomPower extends CustomContentBase {
  type: 'power';
  rank: 'Новичок' | 'Закалённый' | 'Ветеран' | 'Герой' | 'Легенда';
  cost: string;
  range: string;
  duration: string;
  aspects?: string;
}
import type {
  MonsterCategory,
  MonsterRole,
  MonsterRank,
  MonsterAttributes,
  MonsterSkill,
  MonsterAbility,
} from './bestiary';

/**
 * Кастомный монстр / НПС / Дикая карта.
 */
export interface CustomMonster extends CustomContentBase {
  type: 'monster';
  category: MonsterCategory;
  role: MonsterRole;
  rank: MonsterRank;
  attributes: MonsterAttributes;
  skills: MonsterSkill[];
  pace: number;
  parry: number;
  toughness: string;
  charisma?: number;
  edges?: string[];
  hindrances?: string[];
  gear?: string[];
  abilities: MonsterAbility[];
  tags?: string[];
  /** Является ли Дикой картой. */
  isWildCard: boolean;
}

/**
 * Тип для всех кастомных элементов.
 */
export type CustomContent =
  | CustomEdge
  | CustomHindrance
  | CustomSkill
  | CustomPower
  | CustomMonster;