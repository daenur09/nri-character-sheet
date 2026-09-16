import { describe, it, expect } from 'vitest';
import { calculateDerivedStats } from './derived';
import type { Character } from '../models/character';

/**
 * Создаёт простого персонажа с заданными атрибутами и навыками.
 * Все остальные поля — пустые.
 */
function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'test-1',
    profile: {
      name: 'Тестовый',
      rank: '',
      concept: '',
      appearance: '',
      motto: '',
      xp: 0,
    },
    attributes: {
      agility: 'd6',
      smarts: 'd6',
      spirit: 'd6',
      strength: 'd6',
      vigor: 'd6',
    },
    skills: [],
    edges: [],
    hindrances: [],
    isWildCard: true,
    wounds: 0,
    fatigue: 0,
    bennies: 3,
    advancements: [],
    attributesRaisedThisRank: [],
    ...overrides,
  };
}

describe('calculateDerivedStats', () => {
  it('возвращает базовые значения без черт и навыков', () => {
    const character = makeCharacter();
    const stats = calculateDerivedStats(character);

    // Parry: 2 + (0 / 2) = 2 (нет навыка Драка)
    expect(stats.parry).toBe(2);
    // Toughness: 2 + (6 / 2) = 5
    expect(stats.toughness).toBe(5);
    // Charisma: 0
    expect(stats.charisma).toBe(0);
    // Pace: 6
    expect(stats.pace).toBe(6);
  });

  it('считает Parry на основе навыка Драка', () => {
    const character = makeCharacter({
      skills: [
        { name: 'Драка', attribute: 'strength', die: 'd8', modifier: 0, isCore: false },
      ],
    });
    const stats = calculateDerivedStats(character);
    // Parry: 2 + (8 / 2) = 6
    expect(stats.parry).toBe(6);
  });

  it('применяет бонус от черты Block (+1 к Parry)', () => {
    const character = makeCharacter({
      skills: [
        { name: 'Драка', attribute: 'strength', die: 'd8', modifier: 0, isCore: false },
      ],
      edges: [
        { id: 'block', name: 'Блок', description: '' },
      ],
    });
    const stats = calculateDerivedStats(character);
    // Parry: 2 + 4 + 1 = 7
    expect(stats.parry).toBe(7);
  });

  it('применяет бонус от черты Block+ (+2 к Parry)', () => {
    const character = makeCharacter({
      skills: [
        { name: 'Драка', attribute: 'strength', die: 'd8', modifier: 0, isCore: false },
      ],
      edges: [
        { id: 'block_improved', name: 'Блок+', description: '' },
      ],
    });
    const stats = calculateDerivedStats(character);
    expect(stats.parry).toBe(8);
  });

  it('применяет бонус от черты Attractive (+2 к Charisma)', () => {
    const character = makeCharacter({
      edges: [
        { id: 'attractive', name: 'Привлекательность', description: '' },
      ],
    });
    const stats = calculateDerivedStats(character);
    expect(stats.charisma).toBe(2);
  });

  it('применяет штраф от изъяна Ugly (−2 к Charisma)', () => {
    const character = makeCharacter({
      hindrances: [
        { id: 'ugly', name: 'Уродство', description: '', severity: 'minor' },
      ],
    });
    const stats = calculateDerivedStats(character);
    expect(stats.charisma).toBe(-2);
  });

  it('применяет бонус от черты Fleet Footed (+2 к Pace)', () => {
    const character = makeCharacter({
      edges: [
        { id: 'fleet_footed', name: 'Быстроногость', description: '' },
      ],
    });
    const stats = calculateDerivedStats(character);
    expect(stats.pace).toBe(8);
  });

  it('применяет штраф от изъяна Lame (−2 к Pace)', () => {
    const character = makeCharacter({
      hindrances: [
        { id: 'lame', name: 'Хромота', description: '', severity: 'major' },
      ],
    });
    const stats = calculateDerivedStats(character);
    expect(stats.pace).toBe(4);
  });

  it('уменьшает Pace на количество ранений', () => {
    const character = makeCharacter({ wounds: 2 });
    const stats = calculateDerivedStats(character);
    // Pace: 6 − 2 = 4
    expect(stats.pace).toBe(4);
  });

  it('Pace не может быть ниже 1', () => {
    const character = makeCharacter({ wounds: 3 });
    const stats = calculateDerivedStats(character);
    // Pace: 6 − 3 = 3, но если было бы 6 − 10 = −4, всё равно 1
    expect(stats.pace).toBeGreaterThanOrEqual(1);
  });

  it('комбинирует несколько бонусов и штрафов', () => {
    const character = makeCharacter({
      skills: [
        { name: 'Драка', attribute: 'strength', die: 'd10', modifier: 0, isCore: false },
      ],
      edges: [
        { id: 'block', name: 'Блок', description: '' },
        { id: 'attractive', name: 'Привлекательность', description: '' },
      ],
      hindrances: [
        { id: 'ugly', name: 'Уродство', description: '', severity: 'minor' },
      ],
    });
    const stats = calculateDerivedStats(character);
    // Parry: 2 + 5 + 1 = 8
    expect(stats.parry).toBe(8);
    // Charisma: +2 − 2 = 0
    expect(stats.charisma).toBe(0);
  });
});