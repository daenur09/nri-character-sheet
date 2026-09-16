/**
 * Типы граней кубиков, используемых в Savage Worlds.
 */
export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12';

/**
 * Преобразует строку типа кубика ('d6') в число граней (6).
 */
export function dieToNumber(die: DieType): number {
  return parseInt(die.substring(1), 10);
}

/**
 * Бросает один кубик с указанным числом граней.
 * Возвращает случайное число от 1 до sides.
 */
export function rollSingleDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Бросает кубик со взрывом (Aces).
 * Если выпало максимальное значение, бросаем ещё раз и прибавляем.
 * Повторяем, пока не выпадет не максимум.
 * Возвращает массив всех бросков и сумму.
 */
export function rollExplodingDie(sides: number): { rolls: number[]; total: number } {
  const rolls: number[] = [];
  let total = 0;
  let current = rollSingleDie(sides);

  rolls.push(current);
  total += current;

  while (current === sides) {
    current = rollSingleDie(sides);
    rolls.push(current);
    total += current;
  }

  return { rolls, total };
}

/**
 * Результат броска навыка.
 */
export interface SkillRollResult {
  /** Результат броска кубика навыка. */
  skillRoll: { rolls: number[]; total: number };
  /** Результат дикого кубика d6. */
  wildRoll: { rolls: number[]; total: number } | null;
  /** Итоговый результат (лучший + модификатор). */
  total: number;
  /** Количество подъёмов. */
  raises: number;
  /** Критический провал. */
  isCriticalFailure: boolean;
  /** Пороговое число. */
  targetNumber: number;
  /** Был ли взрыв (Ace) хотя бы на одном кубике. */
  hasAce: boolean;
}

/**
 * Бросок навыка по правилам Savage Worlds.
 *
 * @param skillDie - тип кубика навыка (например, 'd8')
 * @param modifier - модификатор к броску (может быть отрицательным)
 * @param isWildCard - является ли персонаж Wild Card (тогда бросается Wild Die)
 * @param targetNumber - пороговое число (по умолчанию 4)
 */
export function rollSkill(
  skillDie: DieType,
  modifier: number = 0,
  isWildCard: boolean = true,
  targetNumber: number = 4
): SkillRollResult {
  const skillSides = dieToNumber(skillDie);

  // Бросаем кубик навыка
  const skillRoll = rollExplodingDie(skillSides);

  // Бросаем дикий кубик (d6), если персонаж — Wild Card
  const wildRoll = isWildCard ? rollExplodingDie(6) : null;

  // Проверяем, был ли взрыв хотя бы на одном кубике.
  // Если в rolls больше одного элемента — значит, был Ace.
  const hasAce =
    skillRoll.rolls.length > 1 ||
    (wildRoll !== null && wildRoll.rolls.length > 1);

  // Определяем «сырой» результат — лучший из кубика навыка и дикого кубика
  const rawTotal = wildRoll
    ? Math.max(skillRoll.total, wildRoll.total)
    : skillRoll.total;

  // Применяем модификатор
  const total = rawTotal + modifier;

  // Считаем подъёмы
  const raises = Math.max(0, Math.floor((total - targetNumber) / 4));

  // Критический провал: обе единицы (только для Wild Cards)
  const isCriticalFailure = isWildCard
    ? skillRoll.rolls.length === 1 &&
      skillRoll.rolls[0] === 1 &&
      wildRoll !== null &&
      wildRoll.rolls.length === 1 &&
      wildRoll.rolls[0] === 1
    : skillRoll.rolls.length === 1 && skillRoll.rolls[0] === 1;

  return {
    skillRoll,
    wildRoll,
    total,
    raises,
    isCriticalFailure,
    targetNumber,
    hasAce,
  };
}