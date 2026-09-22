import Dexie, { type Table } from 'dexie';
import type { Character } from '../models/character';
import type { FieldMap } from '../types/fieldmap';
import type {
  CustomEdge,
  CustomHindrance,
  CustomSkill,
  CustomPower,
  CustomMonster,
} from '../types/custom-content';
import type { Note } from '../types/notes';

export class CharacterDatabase extends Dexie {
  characters!: Table<Character, string>;
  fieldMaps!: Table<FieldMap, string>;
  customEdges!: Table<CustomEdge, string>;
  customHindrances!: Table<CustomHindrance, string>;
  customSkills!: Table<CustomSkill, string>;
  customPowers!: Table<CustomPower, string>;
  customMonsters!: Table<CustomMonster, string>;
  notes!: Table<Note, string>;

  constructor() {
    super('CharacterDatabase');

    this.version(1).stores({
      characters: 'id, name',
    });

    this.version(2).stores({
      characters: 'id, name',
      fieldMaps: 'id, name',
    });

    this.version(3).stores({
      characters: 'id, name',
      fieldMaps: 'id, name',
      customEdges: 'id, name, createdAt',
      customHindrances: 'id, name, createdAt',
      customSkills: 'id, name, createdAt',
      customPowers: 'id, name, createdAt',
    });

    this.version(4).stores({
      characters: 'id, name',
      fieldMaps: 'id, name',
      customEdges: 'id, name, createdAt',
      customHindrances: 'id, name, createdAt',
      customSkills: 'id, name, createdAt',
      customPowers: 'id, name, createdAt',
      customMonsters: 'id, name, createdAt',
    });

    // Версия 5 — добавляем заметки ведущего.
    this.version(5).stores({
      characters: 'id, name',
      fieldMaps: 'id, name',
      customEdges: 'id, name, createdAt',
      customHindrances: 'id, name, createdAt',
      customSkills: 'id, name, createdAt',
      customPowers: 'id, name, createdAt',
      customMonsters: 'id, name, createdAt',
      notes: 'id, title, updatedAt, isPinned',
    });

    // Версия 6 — привязка заметок к персонажу (индекс characterId).
    // Старые заметки без поля characterId попадают в «общие».
    this.version(6).stores({
      characters: 'id, name',
      fieldMaps: 'id, name',
      customEdges: 'id, name, createdAt',
      customHindrances: 'id, name, createdAt',
      customSkills: 'id, name, createdAt',
      customPowers: 'id, name, createdAt',
      customMonsters: 'id, name, createdAt',
      notes: 'id, title, updatedAt, isPinned, characterId',
    });
  }
}

export const db = new CharacterDatabase();

// ============================================================
// Экспорт и импорт персонажа
// ============================================================

export interface ExportBundle {
  format: 'nri-character-sheet';
  version: 1;
  exportedAt: string;
  character: Character;
  fieldMap: FieldMap | null;
}

export function exportToJson(
  character: Character,
  fieldMap: FieldMap | null
): string {
  const bundle: ExportBundle = {
    format: 'nri-character-sheet',
    version: 1,
    exportedAt: new Date().toISOString(),
    character,
    fieldMap,
  };
  return JSON.stringify(bundle, null, 2);
}

export function importFromJson(jsonString: string): {
  character: Character;
  fieldMap: FieldMap | null;
} {
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
    (parsed as ExportBundle).format !== 'nri-character-sheet'
  ) {
    throw new Error(
      'Этот файл не является экспортом персонажа из этого приложения.'
    );
  }

  const bundle = parsed as ExportBundle;

  if (!bundle.character || typeof bundle.character !== 'object') {
    throw new Error('В файле отсутствует корректный персонаж.');
  }

  const c = bundle.character;
  if (!c.profile || !c.attributes || !Array.isArray(c.skills)) {
    throw new Error('Данные персонажа повреждены или неполны.');
  }

  if (!Array.isArray(c.advancements)) c.advancements = [];
  if (!Array.isArray(c.attributesRaisedThisRank))
    c.attributesRaisedThisRank = [];

  return {
    character: bundle.character,
    fieldMap: bundle.fieldMap ?? null,
  };
}