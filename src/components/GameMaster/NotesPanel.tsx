import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Pin,
  PinOff,
  Search,
  FileText,
  Save,
  Check,
} from 'lucide-react';
import type { Note } from '../../types/notes';
import { useNotes } from '../../hooks/useNotes';
import {
  createNote,
  deleteNote,
  togglePin,
  updateNote,
} from '../../db/notesDb';

/**
 * Панель заметок ведущего.
 * Слева — список заметок с поиском, справа — редактор.
 * Изменения сохраняются вручную (кнопка «Сохранить», Ctrl+S, Enter в заголовке)
 * или автоматически при переключении на другую заметку.
 */
export function NotesPanel() {
  const { notes, reload } = useNotes();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [localContent, setLocalContent] = useState('');
  const [localTitle, setLocalTitle] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const selected = useMemo(
    () => notes.find((n) => n.id === selectedId) ?? null,
    [notes, selectedId]
  );

  // При выборе заметки — загружаем её в локальный state.
  useEffect(() => {
    if (selected) {
      setLocalTitle(selected.title);
      setLocalContent(selected.content);
      setIsDirty(false);
      setSavedAt(null);
    } else {
      setLocalTitle('');
      setLocalContent('');
      setIsDirty(false);
      setSavedAt(null);
    }
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ctrl+S — сохранить текущую заметку.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        if (isDirty && selectedId) {
          e.preventDefault();
          handleSave();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, selectedId, localTitle, localContent]); // eslint-disable-line react-hooks/exhaustive-deps

  // Фильтрация по поиску.
  const filtered = useMemo(() => {
    if (!search.trim()) return notes;
    const q = search.toLowerCase();
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
    );
  }, [notes, search]);

  async function handleSave() {
    if (!selectedId || !isDirty) return;
    await updateNote(selectedId, {
      title: localTitle,
      content: localContent,
    });
    await reload();
    setIsDirty(false);
    setSavedAt(new Date().toLocaleTimeString('ru-RU'));
    // Скрыть сообщение через 3 секунды
    setTimeout(() => setSavedAt(null), 3000);
  }

  async function handleSelectNote(id: string) {
    if (id === selectedId) return;
    // Автосохранение текущей заметки перед переключением.
    if (isDirty && selectedId) {
      await updateNote(selectedId, {
        title: localTitle,
        content: localContent,
      });
      await reload();
    }
    setSelectedId(id);
  }

  async function handleCreate() {
    // Перед созданием новой — сохраним текущую.
    if (isDirty && selectedId) {
      await updateNote(selectedId, {
        title: localTitle,
        content: localContent,
      });
    }
    const note = await createNote('Новая заметка', '');
    await reload();
    setSelectedId(note.id);
  }

  async function handleDelete(note: Note) {
    if (!confirm(`Удалить заметку «${note.title}»?`)) return;
    await deleteNote(note.id);
    if (selectedId === note.id) {
      setSelectedId(null);
      setIsDirty(false);
    }
    await reload();
  }

  async function handleTogglePin(note: Note) {
    // Сохраним текущие изменения, если это выбранная заметка.
    if (isDirty && selectedId === note.id) {
      await updateNote(note.id, {
        title: localTitle,
        content: localContent,
      });
    }
    await togglePin(note.id, !note.isPinned);
    await reload();
  }

  function handleTitleChange(value: string) {
    setLocalTitle(value);
    setIsDirty(true);
  }

  function handleContentChange(value: string) {
    setLocalContent(value);
    setIsDirty(true);
  }

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  }

  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
      {/* ================= Список заметок ================= */}
      <aside
        className="panel"
        style={{
          width: '320px',
          flexShrink: 0,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '12px',
        }}
      >
        <button
          onClick={handleCreate}
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '10px',
            justifyContent: 'center',
          }}
        >
          <Plus size={14} />
          <span>Новая заметка</span>
        </button>

        <div style={{ position: 'relative', marginBottom: '10px' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск…"
            className="input"
            style={{ paddingLeft: '32px' }}
          />
        </div>

        <div
          style={{
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {filtered.length === 0 && (
            <p className="muted" style={{ fontSize: '13px' }}>
              {notes.length === 0 ? 'Заметок пока нет.' : 'Ничего не найдено.'}
            </p>
          )}
          {filtered.map((note) => (
            <button
              key={note.id}
              onClick={() => handleSelectNote(note.id)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 10px',
                backgroundColor:
                  selectedId === note.id
                    ? 'var(--accent-soft)'
                    : 'var(--bg-primary)',
                color:
                  selectedId === note.id
                    ? 'var(--accent-text)'
                    : 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '2px',
                }}
              >
                {note.isPinned && <Pin size={12} />}
                <span
                  style={{
                    fontWeight: 'bold',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                >
                  {note.title || 'Без названия'}
                </span>
                {isDirty && selectedId === note.id && (
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--warning)',
                      fontWeight: 'bold',
                    }}
                    title="Есть несохранённые изменения"
                  >
                    ●
                  </span>
                )}
              </div>
              <div
                className="tiny"
                style={{
                  fontSize: '11px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {note.content.slice(0, 60) || '—'}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* ================= Редактор ================= */}
      <div
        className="panel"
        style={{
          flex: 1,
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {selected ? (
          <>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '12px',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <input
                type="text"
                value={localTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                placeholder="Заголовок заметки"
                style={{
                  flex: 1,
                  minWidth: '200px',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  padding: '6px 8px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                onClick={handleSave}
                disabled={!isDirty}
                className={`btn ${isDirty ? 'btn-success' : ''}`}
                title="Сохранить (Ctrl+S)"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: isDirty ? 1 : 0.5,
                  cursor: isDirty ? 'pointer' : 'not-allowed',
                }}
              >
                <Save size={14} />
                <span>Сохранить</span>
              </button>
              <button
                onClick={() => handleTogglePin(selected)}
                className="btn"
                title={selected.isPinned ? 'Открепить' : 'Закрепить'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '8px 10px',
                }}
              >
                {selected.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
              </button>
              <button
                onClick={() => handleDelete(selected)}
                className="btn btn-danger"
                title="Удалить"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '8px 10px',
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Индикатор состояния сохранения */}
            <div
              style={{
                marginBottom: '8px',
                minHeight: '20px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isDirty && !savedAt && (
                <span style={{ color: 'var(--warning-text)' }}>
                  ● Есть несохранённые изменения
                </span>
              )}
              {savedAt && (
                <span
                  style={{
                    color: 'var(--success-text)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Check size={14} /> Сохранено в {savedAt}
                </span>
              )}
              {!isDirty && !savedAt && (
                <span className="tiny" style={{ fontSize: '11px' }}>
                  Ctrl+S — сохранить · Enter в заголовке — сохранить
                </span>
              )}
            </div>

            <textarea
              value={localContent}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Текст заметки…"
              style={{
                flex: 1,
                minHeight: '50vh',
                padding: '12px',
                fontSize: '14px',
                lineHeight: 1.6,
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
              }}
            />

            <div className="tiny" style={{ marginTop: '8px', fontSize: '11px' }}>
              Создано: {new Date(selected.createdAt).toLocaleString('ru-RU')} ·
              Изменено: {new Date(selected.updatedAt).toLocaleString('ru-RU')}
            </div>
          </>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              color: 'var(--text-tertiary)',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <FileText size={48} />
            <div>Выберите заметку слева или создайте новую.</div>
          </div>
        )}
      </div>
    </div>
  );
}