import { db } from './database';
import type {
  CustomEdge,
  CustomHindrance,
  CustomSkill,
  CustomPower,
  CustomMonster,
} from '../types/custom-content';

/**
 * Генерирует уникальный идентификатор для кастомного контента.
 */
function generateCustomId(prefix: string): string {
  return (
    `custom-${prefix}-` +
    Math.random().toString(36).substring(2, 10) +
    Date.now().toString(36)
  );
}

// ============================================================
// Черты (Custom Edges)
// ============================================================

export async function addCustomEdge(
  edge: Omit<CustomEdge, 'id' | 'createdAt' | 'updatedAt' | 'type'>
): Promise<CustomEdge> {
  const now = new Date().toISOString();
  const newEdge: CustomEdge = {
    ...edge,
    id: generateCustomId('edge'),
    type: 'edge',
    createdAt: now,
    updatedAt: now,
  };
  await db.customEdges.add(newEdge);
  return newEdge;
}

export async function updateCustomEdge(
  id: string,
  updates: Partial<Omit<CustomEdge, 'id' | 'createdAt' | 'type'>>
): Promise<void> {
  await db.customEdges.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteCustomEdge(id: string): Promise<void> {
  await db.customEdges.delete(id);
}

// ============================================================
// Изъяны (Custom Hindrances)
// ============================================================

export async function addCustomHindrance(
  hindrance: Omit<CustomHindrance, 'id' | 'createdAt' | 'updatedAt' | 'type'>
): Promise<CustomHindrance> {
  const now = new Date().toISOString();
  const newHindrance: CustomHindrance = {
    ...hindrance,
    id: generateCustomId('hindrance'),
    type: 'hindrance',
    createdAt: now,
    updatedAt: now,
  };
  await db.customHindrances.add(newHindrance);
  return newHindrance;
}

export async function updateCustomHindrance(
  id: string,
  updates: Partial<Omit<CustomHindrance, 'id' | 'createdAt' | 'type'>>
): Promise<void> {
  await db.customHindrances.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteCustomHindrance(id: string): Promise<void> {
  await db.customHindrances.delete(id);
}

// ============================================================
// Навыки (Custom Skills)
// ============================================================

export async function addCustomSkill(
  skill: Omit<CustomSkill, 'id' | 'createdAt' | 'updatedAt' | 'type'>
): Promise<CustomSkill> {
  const now = new Date().toISOString();
  const newSkill: CustomSkill = {
    ...skill,
    id: generateCustomId('skill'),
    type: 'skill',
    createdAt: now,
    updatedAt: now,
  };
  await db.customSkills.add(newSkill);
  return newSkill;
}

export async function updateCustomSkill(
  id: string,
  updates: Partial<Omit<CustomSkill, 'id' | 'createdAt' | 'type'>>
): Promise<void> {
  await db.customSkills.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteCustomSkill(id: string): Promise<void> {
  await db.customSkills.delete(id);
}

// ============================================================
// Силы (Custom Powers)
// ============================================================

export async function addCustomPower(
  power: Omit<CustomPower, 'id' | 'createdAt' | 'updatedAt' | 'type'>
): Promise<CustomPower> {
  const now = new Date().toISOString();
  const newPower: CustomPower = {
    ...power,
    id: generateCustomId('power'),
    type: 'power',
    createdAt: now,
    updatedAt: now,
  };
  await db.customPowers.add(newPower);
  return newPower;
}

export async function updateCustomPower(
  id: string,
  updates: Partial<Omit<CustomPower, 'id' | 'createdAt' | 'type'>>
): Promise<void> {
  await db.customPowers.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteCustomPower(id: string): Promise<void> {
  await db.customPowers.delete(id);
}

// ============================================================
// Монстры (Custom Monsters)
// ============================================================

export async function addCustomMonster(
  monster: Omit<CustomMonster, 'id' | 'createdAt' | 'updatedAt' | 'type'>
): Promise<CustomMonster> {
  const now = new Date().toISOString();
  const newMonster: CustomMonster = {
    ...monster,
    id: generateCustomId('monster'),
    type: 'monster',
    createdAt: now,
    updatedAt: now,
  };
  await db.customMonsters.add(newMonster);
  return newMonster;
}

export async function updateCustomMonster(
  id: string,
  updates: Partial<Omit<CustomMonster, 'id' | 'createdAt' | 'type'>>
): Promise<void> {
  await db.customMonsters.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteCustomMonster(id: string): Promise<void> {
  await db.customMonsters.delete(id);
}

// ============================================================
// Экспорт/импорт всего кастомного контента
// ============================================================

export interface CustomContentBundle {
  format: 'nri-custom-content';
  version: 1;
  exportedAt: string;
  edges: CustomEdge[];
  hindrances: CustomHindrance[];
  skills: CustomSkill[];
  powers: CustomPower[];
  monsters?: CustomMonster[];
}

export async function exportCustomContent(): Promise<string> {
  const [edges, hindrances, skills, powers, monsters] = await Promise.all([
    db.customEdges.toArray(),
    db.customHindrances.toArray(),
    db.customSkills.toArray(),
    db.customPowers.toArray(),
    db.customMonsters.toArray(),
  ]);

  const bundle: CustomContentBundle = {
    format: 'nri-custom-content',
    version: 1,
    exportedAt: new Date().toISOString(),
    edges,
    hindrances,
    skills,
    powers,
    monsters,
  };

  return JSON.stringify(bundle, null, 2);
}

export async function importCustomContent(jsonString: string): Promise<{
  edges: number;
  hindrances: number;
  skills: number;
  powers: number;
  monsters: number;
}> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Файл не является корректным JSON.');
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('format' in parsed) ||
    (parsed as CustomContentBundle).format !== 'nri-custom-content'
  ) {
    throw new Error(
      'Этот файл не является экспортом кастомного контента.'
    );
  }

  const bundle = parsed as CustomContentBundle;

  if (Array.isArray(bundle.edges)) {
    await db.customEdges.bulkPut(bundle.edges);
  }
  if (Array.isArray(bundle.hindrances)) {
    await db.customHindrances.bulkPut(bundle.hindrances);
  }
  if (Array.isArray(bundle.skills)) {
    await db.customSkills.bulkPut(bundle.skills);
  }
  if (Array.isArray(bundle.powers)) {
    await db.customPowers.bulkPut(bundle.powers);
  }
  if (Array.isArray(bundle.monsters)) {
    await db.customMonsters.bulkPut(bundle.monsters);
  }

  return {
    edges: bundle.edges?.length ?? 0,
    hindrances: bundle.hindrances?.length ?? 0,
    skills: bundle.skills?.length ?? 0,
    powers: bundle.powers?.length ?? 0,
    monsters: bundle.monsters?.length ?? 0,
  };
}