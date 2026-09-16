import { describe, it, expect } from 'vitest';
import {
  calculateRank,
  calculateAvailableAdvancements,
  calculateRemainingAdvancements,
  nextDieType,
  canRaiseAttribute,
  raiseAttribute,
  raiseSingleSkill,
  raiseTwoSkills,
  addNewSkill,
  addEdge,
} from './advancement';
import type { Character } from '../models/character';

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'test-1',
    profile: {
      name: 'Тестовый',
      rank: '',
      concept: '',
      appearance: '',
      motto: '',
      xp: 20, // 4 повышения
    },
    attributes: {
      agility: 'd6',
      smarts: 'd6',
      spirit: 'd6',
      strength: 'd6',
      vigor: 'd6',
    },
    skills: [
      { name: 'Драка', attribute: 'strength', die: 'd6', modifier: 0, isCore: false },
      { name: 'Стрельба', attribute: 'agility', die: 'd6', modifier: 0, isCore: false },
    ],
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

describe('calculateRank', () => {
  it('0 XP — Новичок', () => {
    expect(calculateRank(0)).toBe('Новичок');
  });

  it('20 XP — Закалённый', () => {
    expect(calculateRank(20)).toBe('Закалённый');
  });

  it('40 XP — Ветеран', () => {
    expect(calculateRank(40)).toBe('Ветеран');
  });

  it('60 XP — Герой', () => {
    expect(calculateRank(60)).toBe('Герой');
  });

  it('80 XP — Легенда', () => {
    expect(calculateRank(80)).toBe('Легенда');
  });
});

describe('calculateAvailableAdvancements', () => {
  it('0 XP — 0 повышений', () => {
    expect(calculateAvailableAdvancements(0)).toBe(0);
  });

  it('20 XP — 4 повышения', () => {
    expect(calculateAvailableAdvancements(20)).toBe(4);
  });

  it('22 XP — 4 повышения (округление вниз)', () => {
    expect(calculateAvailableAdvancements(22)).toBe(4);
  });
});

describe('calculateRemainingAdvancements', () => {
  it('учитывает потраченные повышения', () => {
    const character = makeCharacter({
      advancements: [
        { type: 'attribute', description: '', rankAtTime: 'Закалённый' },
        { type: 'edge', description: '', rankAtTime: 'Закалённый' },
      ],
    });
    // 20 XP = 4 повышения, потрачено 2 → осталось 2
    expect(calculateRemainingAdvancements(character)).toBe(2);
  });
});

describe('nextDieType', () => {
  it('d4 → d6', () => {
    expect(nextDieType('d4')).toBe('d6');
  });
  it('d10 → d12', () => {
    expect(nextDieType('d10')).toBe('d12');
  });
  it('d12 → null (максимум)', () => {
    expect(nextDieType('d12')).toBeNull();
  });
});

describe('raiseAttribute', () => {
  it('повышает атрибут на одну ступень', () => {
    const character = makeCharacter();
    const newChar = raiseAttribute(character, 'agility');
    expect(newChar).not.toBeNull();
    expect(newChar!.attributes.agility).toBe('d8');
    expect(newChar!.advancements).toHaveLength(1);
  });

  it('не повышает один и тот же атрибут дважды за ранг', () => {
    const character = makeCharacter();
    const newChar1 = raiseAttribute(character, 'agility');
    expect(newChar1).not.toBeNull();
    const newChar2 = raiseAttribute(newChar1!, 'agility');
    expect(newChar2).toBeNull();
  });

  it('не повышает атрибут выше d12', () => {
    const character = makeCharacter({
      attributes: {
        agility: 'd12',
        smarts: 'd6',
        spirit: 'd6',
        strength: 'd6',
        vigor: 'd6',
      },
    });
    const newChar = raiseAttribute(character, 'agility');
    expect(newChar).toBeNull();
  });
});

describe('raiseSingleSkill', () => {
  it('повышает навык ниже атрибута', () => {
    const character = makeCharacter({
      skills: [
        { name: 'Драка', attribute: 'strength', die: 'd4', modifier: 0, isCore: false },
      ],
    });
    const newChar = raiseSingleSkill(character, 'Драка');
    expect(newChar).not.toBeNull();
    expect(newChar!.skills[0].die).toBe('d6');
  });

  it('не повышает несуществующий навык', () => {
    const character = makeCharacter();
    const newChar = raiseSingleSkill(character, 'Несуществующий');
    expect(newChar).toBeNull();
  });
});

describe('raiseTwoSkills', () => {
  it('повышает два навыка, оба ниже атрибутов', () => {
    const character = makeCharacter({
      skills: [
        { name: 'Драка', attribute: 'strength', die: 'd4', modifier: 0, isCore: false },
        { name: 'Стрельба', attribute: 'agility', die: 'd4', modifier: 0, isCore: false },
      ],
    });
    const newChar = raiseTwoSkills(character, 'Драка', 'Стрельба');
    expect(newChar).not.toBeNull();
    expect(newChar!.skills[0].die).toBe('d6');
    expect(newChar!.skills[1].die).toBe('d6');
  });

  it('не повышает два навыка, если один из них ≥ атрибута', () => {
    const character = makeCharacter({
      skills: [
        { name: 'Драка', attribute: 'strength', die: 'd6', modifier: 0, isCore: false }, // = атрибуту d6
        { name: 'Стрельба', attribute: 'agility', die: 'd4', modifier: 0, isCore: false },
      ],
    });
    const newChar = raiseTwoSkills(character, 'Драка', 'Стрельба');
    expect(newChar).toBeNull();
  });

  it('не повышает один и тот же навык дважды', () => {
    const character = makeCharacter();
    const newChar = raiseTwoSkills(character, 'Драка', 'Драка');
    expect(newChar).toBeNull();
  });
});

describe('addNewSkill', () => {
  it('добавляет новый навык d4', () => {
    const character = makeCharacter();
    const newChar = addNewSkill(character, 'Внимание', 'smarts');
    expect(newChar).not.toBeNull();
    expect(newChar!.skills).toHaveLength(3);
    const newSkill = newChar!.skills.find((s) => s.name === 'Внимание');
    expect(newSkill?.die).toBe('d4');
  });

  it('не добавляет навык с существующим именем', () => {
    const character = makeCharacter();
    const newChar = addNewSkill(character, 'Драка', 'strength');
    expect(newChar).toBeNull();
  });
});

describe('addEdge', () => {
  it('добавляет новую черту', () => {
    const character = makeCharacter();
    const newChar = addEdge(character, 'block', 'Блок');
    expect(newChar).not.toBeNull();
    expect(newChar!.edges).toHaveLength(1);
    expect(newChar!.edges[0].id).toBe('block');
  });

  it('не добавляет черту дважды', () => {
    const character = makeCharacter({
      edges: [{ id: 'block', name: 'Блок', description: '' }],
    });
    const newChar = addEdge(character, 'block', 'Блок');
    expect(newChar).toBeNull();
  });
});