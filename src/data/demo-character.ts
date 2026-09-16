import type { Character } from '../models/character';

/**
 * Демонстрационный персонаж — Шангор-североземец.
 * Используется, если в базе данных ещё нет ни одного персонажа.
 */
export const DEMO_CHARACTER: Character = {
  id: 'demo-1',
  profile: {
    name: 'Шангор',
    rank: 'Закалённый',
    concept: 'Североземский варвар',
    appearance: 'Огромный воин с рыжей бородой',
    motto: 'Сильный побеждает слабого.',
    xp: 25,
  },
  attributes: {
    agility: 'd8',
    smarts: 'd6',
    spirit: 'd6',
    strength: 'd10',
    vigor: 'd8',
  },
  skills: [
    { name: 'Драка', attribute: 'strength', die: 'd10', modifier: 0, isCore: false },
    { name: 'Стрельба', attribute: 'agility', die: 'd6', modifier: 0, isCore: false },
    { name: 'Внимание', attribute: 'smarts', die: 'd6', modifier: 0, isCore: true },
    { name: 'Атлетика', attribute: 'strength', die: 'd8', modifier: 0, isCore: true },
  ],
  edges: [
    { id: 'block', name: 'Блок', description: 'Защита +1.' },
    { id: 'nerves_of_steel', name: 'Стальные нервы', description: 'Игнорирует 1 штраф от ранений.' },
  ],
  hindrances: [],
  isWildCard: true,
  wounds: 0,
  fatigue: 0,
  bennies: 3,
  advancements: [],
  attributesRaisedThisRank: [],
};