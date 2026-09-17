import type {
  Card,
  CardSuit,
  InitiativeParticipant,
  SessionState,
} from '../types/initiative';

/**
 * Вес мастей для разрешения ничьих.
 * Порядок SWADE: ♠ > ♥ > ♦ > ♣.
 */
const SUIT_WEIGHTS: Record<CardSuit, number> = {
  joker: 0,
  spades: 4,
  hearts: 3,
  diamonds: 2,
  clubs: 1,
};

const SUIT_SYMBOLS: Record<CardSuit, string> = {
  joker: '★',
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

const RANK_LABELS: Record<number, string> = {
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
};

/**
 * Создаёт карту и сразу вычисляет её sortKey.
 */
function makeCard(rank: number, suit: CardSuit): Card {
  if (suit === 'joker') {
    return {
      rank: 0,
      suit: 'joker',
      display: 'Joker ★',
      sortKey: 10000,
    };
  }
  const rankLabel = RANK_LABELS[rank] ?? String(rank);
  const suitSymbol = SUIT_SYMBOLS[suit];
  return {
    rank,
    suit,
    display: `${rankLabel}${suitSymbol}`,
    sortKey: rank * 10 + SUIT_WEIGHTS[suit],
  };
}

/**
 * Создаёт полную колоду из 54 карт (52 обычные + 2 джокера).
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  const suits: CardSuit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
  for (const suit of suits) {
    for (let rank = 2; rank <= 14; rank++) {
      deck.push(makeCard(rank, suit));
    }
  }
  deck.push(makeCard(0, 'joker'));
  deck.push(makeCard(0, 'joker'));
  return deck;
}

/**
 * Перемешивает массив (алгоритм Фишера-Йетса).
 */
export function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Возвращает перемешанную свежую колоду.
 */
export function freshDeck(): Card[] {
  return shuffle(createDeck());
}

/**
 * Вычисляет, сколько карт тянет участник.
 *
 * Логика:
 *   базово — 1 карта, лучшая;
 *   Level Headed+ → 3 карты, лучшая;
 *   Quick (или Level Headed) → 2 карты, лучшая;
 *   Slow → +1 карта, худшая.
 */
export function computeDrawConfig(
  hasQuick: boolean,
  hasLevelHeadedImproved: boolean,
  hasSlow: boolean
): { cardDrawCount: number; chooseBest: boolean } {
  let count = 1;
  if (hasLevelHeadedImproved) count = 3;
  else if (hasQuick) count = 2;

  let chooseBest = true;
  if (hasSlow) {
    count += 1;
    chooseBest = false;
  }

  return { cardDrawCount: count, chooseBest };
}

/**
 * Вытягивает одну карту. Если колода пуста — перетасовывает сброс.
 * Возвращает новую колоду и сброс (иммутабельно).
 */
function drawOne(
  deck: Card[],
  discard: Card[]
): { card: Card; deck: Card[]; discard: Card[] } {
  let d = [...deck];
  let disc = [...discard];

  if (d.length === 0) {
    d = shuffle(disc);
    disc = [];
  }

  const card = d.pop()!;
  return { card, deck: d, discard: disc };
}

/**
 * Начинает новый раунд: раздаёт карты всем участникам.
 */
export function startNewRound(state: SessionState): SessionState {
  let deck = state.deck.length > 0 ? [...state.deck] : freshDeck();
  let discard = [...state.discard];

  // Убедимся, что карт хватает на всех.
  const totalNeeded = state.participants.reduce(
    (sum, p) => sum + p.cardDrawCount,
    0
  );
  if (deck.length < totalNeeded) {
    deck = shuffle([...deck, ...discard]);
    discard = [];
  }

  const participants: InitiativeParticipant[] = [];

  for (const p of state.participants) {
    const drawnCards: Card[] = [];
    for (let i = 0; i < p.cardDrawCount; i++) {
      const r = drawOne(deck, discard);
      drawnCards.push(r.card);
      deck = r.deck;
      discard = r.discard;
    }

    // Сортировка: первая карта — самая «старшая».
    const sorted = [...drawnCards].sort((a, b) => b.sortKey - a.sortKey);
    const chosen = p.chooseBest ? sorted[0] : sorted[sorted.length - 1];

    // Остальные вытянутые — в сброс.
    const rest = drawnCards.filter((c) => c !== chosen);
    discard = [...discard, ...rest];

    participants.push({
      ...p,
      currentCard: chosen,
      drawnCards,
      hasActed: false,
    });
  }

  return {
    round: state.round + 1,
    deck,
    discard,
    participants,
  };
}

/**
 * Сортирует участников по убыванию инициативы.
 */
export function sortByInitiative(
  participants: InitiativeParticipant[]
): InitiativeParticipant[] {
  return [...participants].sort((a, b) => {
    const ka = a.currentCard?.sortKey ?? -1;
    const kb = b.currentCard?.sortKey ?? -1;
    return kb - ka;
  });
}

/**
 * Пустое состояние сессии.
 */
export function emptySession(): SessionState {
  return {
    round: 0,
    deck: freshDeck(),
    discard: [],
    participants: [],
  };
}

/**
 * Генерирует уникальный id для участника.
 */
export function generateParticipantId(): string {
  return `p-${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
}