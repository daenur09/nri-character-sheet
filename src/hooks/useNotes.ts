import { useEffect, useState, useCallback } from 'react';
import type { Note } from '../types/notes';
import { listNotes } from '../db/notesDb';

/**
 * Хук загрузки списка заметок. Ручной reload() для синхронизации
 * после добавления/удаления.
 */
export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const data = await listNotes();
      setNotes(data);
    } catch (err) {
      console.error('Ошибка загрузки заметок:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { notes, isLoading, reload };
}