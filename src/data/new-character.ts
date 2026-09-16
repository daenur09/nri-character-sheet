import type { Character } from '../models/character';

/**
 * Создаёт «пустого» персонажа со стандартными значениями.
 * Используется для кнопки «Создать персонажа» на экране ведущего.
 */
export function createNewCharacter(name: string = 'Новый персонаж'): Character {
  return {
    id: Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
    profile: {
      name,
      rank: '',
      concept: '',
      appearance: '',
      motto: '',
      xp: 0,
    },
    attributes: {
      agility: 'd4',
      smarts: 'd4',
      spirit: 'd4',
      strength: 'd4',
      vigor: 'd4',
    },
    skills: [
      { name: 'Атлетика', attribute: 'strength', die: 'd4', modifier: 0, isCore: true },
      { name: 'Внимание', attribute: 'smarts', die: 'd4', modifier: 0, isCore: true },
      { name: 'Общие знания', attribute: 'smarts', die: 'd4', modifier: 0, isCore: true },
      { name: 'Убеждение', attribute: 'spirit', die: 'd4', modifier: 0, isCore: true },
      { name: 'Маскировка', attribute: 'agility', die: 'd4', modifier: 0, isCore: true },
    ],
    edges: [],
    hindrances: [],
    isWildCard: true,
    wounds: 0,
    fatigue: 0,
    bennies: 3,
    advancements: [],
    attributesRaisedThisRank: [],
  };
}