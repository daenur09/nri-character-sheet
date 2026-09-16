import type { Character, Skill, AttributeName, Advancement } from '../models/character';
import type { DieType } from './dice';
import { dieToNumber } from './dice';

/**
 * Возможные ранги персонажа.
 */
export type Rank = 'Новичок' | 'Закалённый' | 'Ветеран' | 'Герой' | 'Легенда';

/**
 * Стоимость одного «пункта» повышения.
 * В SWADE повышения считаются в «полушагах»:
 *   - 1 повышение = можно взять ОДНО из пяти действий.
 */
export const XP_PER_ADVANCEMENT = 5;

/**
 * Пороги рангов по опыту.
 * 0–19: Новичок, 20–39: Закалённый, 40–59: Ветеран,
 * 60–79: Герой, 80+: Легенда.
 */
export function calculateRank(xp: number): Rank {
  if (xp < 20) return 'Новичок';
  if (xp < 40) return 'Закалённый';
  if (xp < 60) return 'Ветеран';
  if (xp < 80) return 'Герой';
  return 'Легенда';
}

/**
 * Сколько повышений доступно при данном опыте.
 * Каждые 5 XP дают одно повышение. При 20 XP — 4 повышения.
 */
export function calculateAvailableAdvancements(xp: number): number {
  return Math.floor(xp / XP_PER_ADVANCEMENT);
}

/**
 * Сколько повышений уже потрачено персонажем.
 */
export function calculateSpentAdvancements(character: Character): number {
  return character.advancements.length;
}

/**
 * Сколько повышений ещё осталось.
 */
export function calculateRemainingAdvancements(character: Character): number {
  return calculateAvailableAdvancements(character.profile.xp) - calculateSpentAdvancements(character);
}

/**
 * Следующий тип кубика. d4 → d6 → d8 → d10 → d12 → null (максимум).
 * Возвращает null, если текущий кубик уже d12 или больше.
 */
export function nextDieType(current: DieType): DieType | null {
  const currentValue = dieToNumber(current);
  if (currentValue >= 12) return null;
  return `d${currentValue + 2}` as DieType;
}

/**
 * Стоимость повышения навыка на одну ступень.
 * Правила SWADE:
 *   - Если новое значение навыка ≤ значению атрибута — 1 «полуповышение».
 *   - Если новое значение навыка > значения атрибута — 2 «полуповышения».
 *
 * Так как у нас одно повышение = одна функция, то при повышении навыка
 * выше атрибута мы просто возвращаем булево значение, чтобы UI показал,
 * что навык «перешагнул» за атрибут.
 *
 * Здесь мы возвращаем true, если повышение идёт «выше атрибута».
 */
export function isSkillAboveAttribute(
  skill: Skill,
  character: Character
): boolean {
  const skillValue = dieToNumber(skill.die);
  const attrValue = dieToNumber(character.attributes[skill.attribute]);
  return skillValue >= attrValue;
}

/**
 * Проверяет, можно ли поднять конкретный навык.
 * Нельзя, если навык уже d12.
 */
export function canRaiseSkill(skill: Skill): boolean {
  return dieToNumber(skill.die) < 12;
}

/**
 * Проверяет, можно ли поднять конкретный атрибут.
 * Нельзя, если атрибут уже d12, или если он уже поднимался в этом ранге.
 */
export function canRaiseAttribute(
  character: Character,
  attribute: AttributeName
): boolean {
  // Проверка на максимум
  if (dieToNumber(character.attributes[attribute]) >= 12) return false;
  // Проверка на «один раз за ранг»
  if (character.attributesRaisedThisRank.includes(attribute)) return false;
  return true;
}

/**
 * Повышение атрибута на одну ступень.
 * Возвращает нового персонажа (не изменяет исходного).
 * Возвращает null, если повышение невозможно.
 */
export function raiseAttribute(
  character: Character,
  attribute: AttributeName
): Character | null {
  if (!canRaiseAttribute(character, attribute)) return null;

  const newDie = nextDieType(character.attributes[attribute]);
  if (!newDie) return null;

  const advancement: Advancement = {
    type: 'attribute',
    description: `Атрибут ${attribute} повышен до ${newDie}`,
    rankAtTime: calculateRank(character.profile.xp),
    target: attribute,
  };

  // Если ранг изменился с последнего повышения — сбрасываем список поднятых атрибутов
  const currentRank = calculateRank(character.profile.xp);
  const lastAdvancement = character.advancements[character.advancements.length - 1];
  const attributesRaisedThisRank =
    lastAdvancement && lastAdvancement.rankAtTime === currentRank
      ? [...character.attributesRaisedThisRank, attribute]
      : [attribute];

  return {
    ...character,
    attributes: {
      ...character.attributes,
      [attribute]: newDie,
    },
    advancements: [...character.advancements, advancement],
    attributesRaisedThisRank,
  };
}

/**
 * Повышение одного навыка (когда навык < атрибута).
 * Возвращает нового персонажа или null.
 */
export function raiseSingleSkill(
  character: Character,
  skillName: string
): Character | null {
  const skillIndex = character.skills.findIndex((s) => s.name === skillName);
  if (skillIndex === -1) return null;

  const skill = character.skills[skillIndex];
  if (!canRaiseSkill(skill)) return null;

  const newDie = nextDieType(skill.die);
  if (!newDie) return null;

  const advancement: Advancement = {
    type: 'skill_below_attr',
    description: `Навык ${skill.name} повышен до ${newDie}`,
    rankAtTime: calculateRank(character.profile.xp),
    target: skill.name,
  };

  const newSkills = [...character.skills];
  newSkills[skillIndex] = { ...skill, die: newDie };

  return {
    ...character,
    skills: newSkills,
    advancements: [...character.advancements, advancement],
  };
}

/**
 * Повышение двух навыков (оба должны быть < своих атрибутов).
 * Возвращает нового персонажа или null.
 */
export function raiseTwoSkills(
  character: Character,
  skillName1: string,
  skillName2: string
): Character | null {
  if (skillName1 === skillName2) return null;

  const skillIndex1 = character.skills.findIndex((s) => s.name === skillName1);
  const skillIndex2 = character.skills.findIndex((s) => s.name === skillName2);
  if (skillIndex1 === -1 || skillIndex2 === -1) return null;

  const skill1 = character.skills[skillIndex1];
  const skill2 = character.skills[skillIndex2];

  if (!canRaiseSkill(skill1) || !canRaiseSkill(skill2)) return null;

  // Оба должны быть НИЖЕ своих атрибутов
  if (isSkillAboveAttribute(skill1, character)) return null;
  if (isSkillAboveAttribute(skill2, character)) return null;

  const newDie1 = nextDieType(skill1.die);
  const newDie2 = nextDieType(skill2.die);
  if (!newDie1 || !newDie2) return null;

  const advancement: Advancement = {
    type: 'skill_below_attr',
    description: `Навыки ${skill1.name} и ${skill2.name} повышены`,
    rankAtTime: calculateRank(character.profile.xp),
    target: skill1.name,
    target2: skill2.name,
  };

  const newSkills = [...character.skills];
  newSkills[skillIndex1] = { ...skill1, die: newDie1 };
  newSkills[skillIndex2] = { ...skill2, die: newDie2 };

  return {
    ...character,
    skills: newSkills,
    advancements: [...character.advancements, advancement],
  };
}

/**
 * Добавление нового навыка со значением d4.
 * Возвращает нового персонажа или null, если навык с таким именем уже есть.
 */
export function addNewSkill(
  character: Character,
  skillName: string,
  attribute: AttributeName
): Character | null {
  // Проверяем, что такого навыка ещё нет
  if (character.skills.some((s) => s.name === skillName)) return null;

  const newSkill: Skill = {
    name: skillName,
    attribute,
    die: 'd4',
    modifier: 0,
    isCore: false,
  };

  const advancement: Advancement = {
    type: 'new_skill',
    description: `Изучен новый навык: ${skillName} (d4)`,
    rankAtTime: calculateRank(character.profile.xp),
    target: skillName,
  };

  return {
    ...character,
    skills: [...character.skills, newSkill],
    advancements: [...character.advancements, advancement],
  };
}

/**
 * Добавление черты (Edge).
 * Возвращает нового персонажа или null, если такая черта уже есть.
 */
export function addEdge(
  character: Character,
  edgeId: string,
  edgeName: string,
  sourceId?: string,
  description?: string
): Character | null {
  if (character.edges.some((e) => e.id === edgeId)) return null;

  const newEdge = {
    id: edgeId,
    name: edgeName,
    description: description ?? '',
    sourceId,
  };

  const advancement: Advancement = {
    type: 'edge',
    description: `Получена черта: ${edgeName}`,
    rankAtTime: calculateRank(character.profile.xp),
    target: edgeId,
  };

  return {
    ...character,
    edges: [...character.edges, newEdge],
    advancements: [...character.advancements, advancement],
  };
}

/**
 * Удаляет черту у персонажа. Возвращает нового персонажа.
 * Запись в истории повышений НЕ удаляется — считается, что повышение
 * уже было потрачено, а черта ушла (потеряна, отобрана и т.п.).
 */
export function removeEdge(character: Character, edgeId: string): Character {
  return {
    ...character,
    edges: character.edges.filter((e) => e.id !== edgeId),
  };
}

/**
 * Добавляет изъян персонажу. Не расходует повышение — используется для
 * ручного редактирования листа (например, ведущий выдаёт изъян).
 * Возвращает нового персонажа или null, если такой изъян уже есть.
 */
export function addHindrance(
  character: Character,
  hindranceId: string,
  hindranceName: string,
  severity: 'minor' | 'major',
  sourceId?: string,
  description?: string
): Character | null {
  if (character.hindrances.some((h) => h.id === hindranceId)) return null;

  const newHindrance = {
    id: hindranceId,
    name: hindranceName,
    description: description ?? '',
    severity,
    sourceId,
  };

  return {
    ...character,
    hindrances: [...character.hindrances, newHindrance],
  };
}

/**
 * Удаляет изъян у персонажа.
 */
export function removeHindrance(character: Character, hindranceId: string): Character {
  return {
    ...character,
    hindrances: character.hindrances.filter((h) => h.id !== hindranceId),
  };
}