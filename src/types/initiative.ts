/**
 * Масть карты. «joker» — особые карты-джокеры (2 в колоде SWADE).
 */
export type CardSuit = 'spades' | 'hearts' | 'diamonds' | 'clubs' | 'joker';

/**
 * Описание одной карты.
 */
export interface Card {
  /** Ранг: 2–14 (A=14), 0 — для джокера. */
  rank: number;
  suit: CardSuit;
  /** Отображаемая строка: «A♠», «10♥», «Joker ★». */
  display: string;
  /** Ключ сортировки: чем больше, тем раньше ходит. */
  sortKey: number;
}

/**
 * Тип участника боя.
 *  - character — персонаж игрока (Wild Card).
 *  - npc — одиночный NPC или монстр.
 *  - group — группа статистов (использует одну карту).
 */
export type ParticipantType = 'character' | 'npc' | 'group';

/**
 * Участник боя.
 */
export interface InitiativeParticipant {
  id: string;
  name: string;
  type: ParticipantType;
  /** Сколько карт тянет с учётом черт и изъянов. */
  cardDrawCount: number;
  /** true — выбирает лучшую карту, false — худшую (Slow). */
  chooseBest: boolean;
  /** Текущая выбранная карта в этом раунде. */
  currentCard: Card | null;
  /** Все вытянутые карты (для показа истории). */
  drawnCards: Card[];
  /** Уже походил в этом раунде. */
  hasActed: boolean;
  /** Количество статистов (только для type === 'group'). */
  groupCount?: number;
  /** Есть ли черта Quick. */
  hasQuick: boolean;
  /** Есть ли черта Level Headed+. */
  hasLevelHeadedImproved: boolean;
  /** Есть ли изъян Slow. */
  hasSlow: boolean;
}

/**
 * Состояние боевой сессии.
 * Сохраняется в localStorage, чтобы не сбрасывалось при F5.
 */
export interface SessionState {
  /** Номер текущего раунда. */
  round: number;
  /** Оставшиеся карты в колоде. */
  deck: Card[];
  /** Сброшенные карты. */
  discard: Card[];
  /** Участники боя. */
  participants: InitiativeParticipant[];
}