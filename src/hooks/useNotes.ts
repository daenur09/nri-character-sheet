import { useEffect, useState, useCallback } from 'react';
import type { Note } from '../types/notes';
import { listNotes } from '../db/notesDb';

/**
 * Хук загрузки заметок.
 *
 * @param characterId
 *   - undefined → все заметки (общие + привязанные к персонажам),
 *   - null      → только общие (без привязки),
 *   - string    → только заметки указанного персонажа.
 */
export function useNotes(characterId?: string | null) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const data = await listNotes(
        characterId !== undefined ? { characterId } : undefined
      );
      setNotes(data);
    } catch (err) {
      console.error('Ошибка загрузки заметок:', err);
    } finally {
      setIsLoading(false);
    }
  }, [characterId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { notes, isLoading, reload };
}