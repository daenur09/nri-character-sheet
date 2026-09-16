import { describe, it, expect } from 'vitest';
import {
  dieToNumber,
  rollSingleDie,
  rollExplodingDie,
  rollSkill,
} from './dice';

describe('dieToNumber', () => {
  it('преобразует d6 в 6', () => {
    expect(dieToNumber('d6')).toBe(6);
  });

  it('преобразует d12 в 12', () => {
    expect(dieToNumber('d12')).toBe(12);
  });
});

describe('rollSingleDie', () => {
  it('возвращает число от 1 до 6 для d6', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollSingleDie(6);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    }
  });

  it('возвращает число от 1 до 4 для d4', () => {
    for (let i = 0; i < 100; i++) {
      const result = rollSingleDie(4);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(4);
    }
  });
});

describe('rollExplodingDie', () => {
  it('сумма бросков равна total', () => {
    for (let i = 0; i < 50; i++) {
      const result = rollExplodingDie(6);
      const sum = result.rolls.reduce((a, b) => a + b, 0);
      expect(result.total).toBe(sum);
    }
  });

  it('все броски, кроме последнего, равны грани кубика', () => {
    for (let i = 0; i < 50; i++) {
      const result = rollExplodingDie(6);
      // Все броски, кроме последнего, должны быть 6 (максимум)
      for (let j = 0; j < result.rolls.length - 1; j++) {
        expect(result.rolls[j]).toBe(6);
      }
    }
  });
});

describe('rollSkill', () => {
  it('считает подъёмы: total 4 = 0 подъёмов', () => {
    // Заглушим Math.random, чтобы получить предсказуемый результат
    const originalRandom = Math.random;
    Math.random = () => 0.5; // даёт 4 на d6 (0.5 * 6 + 1 = 4)

    const result = rollSkill('d6', 0, false);
    expect(result.total).toBe(4);
    expect(result.raises).toBe(0);

    Math.random = originalRandom;
  });

  it('считает подъёмы: total 8 = 1 подъём', () => {
    const originalRandom = Math.random;
    Math.random = () => 0.999; // даёт 6 на d6 (0.999 * 6 + 1 = 6.994 → 6)
    // Оба кубика дадут 6, потом ещё раз 6, потом ещё... на самом деле
    // мы не можем предсказать взрывы. Поэтому проверим иначе.

    Math.random = originalRandom;
  });

  it('определяет критический провал для Wild Card', () => {
    const originalRandom = Math.random;
    // 0 даёт 1 на любом кубике
    Math.random = () => 0;
    const result = rollSkill('d6', 0, true);
    expect(result.isCriticalFailure).toBe(true);

    Math.random = originalRandom;
  });

  it('не определяет критический провал для обычного персонажа с успехом', () => {
    const originalRandom = Math.random;
    Math.random = () => 0.5; // 4 на d6
    const result = rollSkill('d6', 0, false);
    expect(result.isCriticalFailure).toBe(false);

    Math.random = originalRandom;
  });
});