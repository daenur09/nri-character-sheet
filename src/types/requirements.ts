import type { AttributeName } from '../models/character';
import type { DieType } from '../mechanics/dice';

/**
 * Уровни рангов в порядке возрастания.
 */
export type Rank =
  | 'Новичок'
  | 'Закалённый'
  | 'Ветеран'
  | 'Герой'
  | 'Легенда';

/** Числовые веса рангов для сравнения. */
export const RANK_WEIGHT: Record<Rank, number> = {
  'Новичок': 0,
  'Закалённый': 1,
  'Ветеран': 2,
  'Герой': 3,
  'Легенда': 4,
};

/**
 * Структурированные требования к элементу контента
 * (черте, изъяну, силе, таланту).
 */
export interface Requirements {
  /** Минимальный ранг персонажа. */
  minRank?: Rank;
  /** Требуемые атрибуты (атрибут → минимальный кубик). */
  attributes?: Partial<Record<AttributeName, DieType>>;
  /** Требуемые навыки (название → минимальный кубик). */
  skills?: Record<string, DieType>;
  /** Обязательные черты (по id). */
  edges?: string[];
  /** Обязательные изъяны (по id). */
  hindrances?: string[];
  /** Запрещённые изъяны (если есть хоть один — нельзя). */
  forbiddenHindrances?: string[];
  /** Свободный текст для справки (например, «персонаж должен быть человеком»). */
  note?: string;
}

/**
 * Результат проверки требований.
 */
export interface RequirementCheck {
  /** Выполнены ли все требования. */
  ok: boolean;
  /** Список причин, почему требования не выполнены. */
  reasons: string[];
}