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
 * Создаёт новую пустую заметку и сохраняет её в БД.
 */
export async function createNote(
  title = 'Новая заметка',
  content = ''
): Promise<Note> {
  const now = new Date().toISOString();
  const note: Note = {
    id: generateNoteId(),
    title,
    content,
    createdAt: now,
    updatedAt: now,
    isPinned: false,
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
 * Возвращает все заметки, отсортированные:
 * сначала закреплённые, потом — по времени последнего изменения.
 */
export async function listNotes(): Promise<Note[]> {
  const all = await db.notes.toArray();
  return all.sort((a, b) => {
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