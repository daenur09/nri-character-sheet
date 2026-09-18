import type { DieType } from '../mechanics/dice';
import type { EdgeEffects } from '../data/edges';
import type { InventoryItem } from '../types/gear';

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
  /**
   * Механические эффекты черты.
   *
   * Для новых сохранений — заполняется явно из каталога EDGES
   * или из CustomEdge. Для старых сохранений может отсутствовать:
   * в этом случае `mechanics/derived.ts` возьмёт эффекты
   * из каталога EDGES по `id` (прозрачная миграция).
   */
  effects?: EdgeEffects;
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
  /** См. комментарий в `Edge.effects`. */
  effects?: EdgeEffects;
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
 * Одна сила, выбранная персонажем.
 *
 * Данные денормализованы из исходного `CustomPower` — это сделано
 * сознательно: если ведущий позже удалит силу из каталога, у персонажа
 * всё равно останется рабочая копия. Поле `powerId` хранится для справки.
 *
 * `castingSkill` — имя навыка персонажа, которым активируется сила
 * (например, «Магия», «Вера», «Псионика»). Если такого навыка у персонажа
 * нет — бросок идёт как неподготовленный (d4 −2).
 */
export interface PowerInstance {
  /** Уникальный id экземпляра (не совпадает с id каталога). */
  id: string;
  /** Ссылка на исходный CustomPower.id. */
  powerId?: string;
  /** Название силы. */
  name: string;
  /** Описание. */
  description: string;
  /** Ранг силы. */
  rank: string;
  /** Стоимость в ОД. */
  cost: string;
  /** Дистанция. */
  range: string;
  /** Длительность. */
  duration: string;
  /** Аспекты (опционально). */
  aspects?: string;
  /** Имя кастующего навыка (по названию навыка персонажа). */
  castingSkill: string;
  /** Источник контента: 'custom'. */
  sourceId?: string;
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
  /** Инвентарь персонажа */
  inventory?: InventoryItem[];
  /** Деньги в лунах */
  money?: number;
  /** Силы персонажа (создаются из кастомного контента). */
  powers?: PowerInstance[];
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