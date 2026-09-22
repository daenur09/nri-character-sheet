/**
 * Заметка ведущего. Сохраняется локально в IndexedDB.
 */
export interface Note {
  id: string;
  title: string;
  content: string;
  /** ISO-строка создания. */
  createdAt: string;
  /** ISO-строка последнего изменения. */
  updatedAt: string;
  /** Закреплённые заметки отображаются сверху. */
  isPinned: boolean;
  /** Теги для быстрой фильтрации. */
  tags?: string[];
  /**
   * Если задано — заметка привязана к конкретному персонажу.
   * Отсутствие поля означает «общая заметка ведущего».
   */
  characterId?: string;
}