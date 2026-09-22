import { db } from './database';
import type { Note } from '../types/notes';

/**
 * Генерирует уникальный id для заметки.
 */
function generateNoteId(): string {
  return (
    'note-' +
    Math.random().toString(36).substring(2, 10) +
    Date.now().toString(36)
  );
}

/**
 * Создаёт новую заметку и сохраняет её в БД.
 *
 * @param title       Заголовок.
 * @param content     Содержимое.
 * @param characterId Если задано — заметка привязывается к персонажу.
 *                    Если не передано / пустая строка — заметка «общая».
 */
export async function createNote(
  title = 'Новая заметка',
  content = '',
  characterId?: string
): Promise<Note> {
  const now = new Date().toISOString();
  const note: Note = {
    id: generateNoteId(),
    title,
    content,
    createdAt: now,
    updatedAt: now,
    isPinned: false,
    ...(characterId ? { characterId } : {}),
  };
  await db.notes.add(note);
  return note;
}

/**
 * Обновляет заметку. Если updatedAt не передан — ставит текущее время.
 */
export async function updateNote(
  id: string,
  updates: Partial<Omit<Note, 'id' | 'createdAt'>>
): Promise<void> {
  const patch: Partial<Note> = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await db.notes.update(id, patch);
}

/**
 * Удаляет заметку.
 */
export async function deleteNote(id: string): Promise<void> {
  await db.notes.delete(id);
}

/**
 * Список заметок с опциональной фильтрацией.
 *
 *  - Аргумент не передан (или без поля characterId):
 *      возвращаются ВСЕ заметки — общие и персональные.
 *  - options.characterId === null:
 *      только общие заметки (без привязки к персонажу).
 *  - options.characterId === '<id>':
 *      только заметки указанного персонажа.
 *
 *  Результат всегда отсортирован: сначала закреплённые,
 *  затем — по времени последнего изменения (свежие вверху).
 */
export async function listNotes(options?: {
  characterId?: string | null;
}): Promise<Note[]> {
  const all = await db.notes.toArray();
  let filtered = all;

  if (options && 'characterId' in options) {
    const target = options.characterId;
    if (target === null) {
      filtered = all.filter((n) => !n.characterId);
    } else if (typeof target === 'string') {
      filtered = all.filter((n) => n.characterId === target);
    }
    // target === undefined — без фильтра.
  }

  return filtered.sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

/**
 * Переключает статус «закреплено».
 */
export async function togglePin(id: string, isPinned: boolean): Promise<void> {
  await db.notes.update(id, {
    isPinned,
    updatedAt: new Date().toISOString(),
  });
}