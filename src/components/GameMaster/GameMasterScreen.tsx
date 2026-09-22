import { useEffect, useState } from 'react';
import {
  UserPlus,
  ExternalLink,
  Trash2,
  Heart,
  Zap,
  Coins,
  Download,
  Upload,
  Users,
  FileText,
} from 'lucide-react';
import type { Character } from '../../models/character';
import { db, importFromJson } from '../../db/database';
import { createNewCharacter } from '../../data/new-character';
import { calculateDerivedStats } from '../../mechanics/derived';
import { calculateRank } from '../../mechanics/advancement';
import { NotesPanel } from './NotesPanel';

interface Props {
  activeCharacterId: string | null;
  onSetActive: (id: string) => void;
  onRefresh: () => void;
}

type Mode = 'party' | 'notes';

/**
 * Фильтр заметок в режиме «Заметки»:
 *   undefined — все заметки,
 *   null      — только общие (без привязки к персонажу),
 *   string    — заметки указанного персонажа.
 */
type NotesFilter = string | null | undefined;

export function GameMasterScreen({
  activeCharacterId,
  onSetActive,
  onRefresh,
}: Props) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: 'ok' | 'error';
    text: string;
  } | null>(null);
  const [isBatchImporting, setIsBatchImporting] = useState(false);
  const [mode, setMode] = useState<Mode>('party');
  const [notesFilter, setNotesFilter] = useState<NotesFilter>(undefined);

  async function loadAll() {
    try {
      const all = await db.characters.toArray();
      all.sort((a, b) => a.profile.name.localeCompare(b.profile.name));
      setCharacters(all);
    } catch (err) {
      console.error('Ошибка загрузки персонажей:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function updateCharacter(
    id: string,
    updater: (c: Character) => Character
  ) {
    const current = characters.find((c) => c.id === id);
    if (!current) return;
    const updated = updater(current);
    await db.characters.put(updated);
    setCharacters((list) => list.map((c) => (c.id === id ? updated : c)));
    onRefresh();
  }

  function changeWounds(id: string, delta: number) {
    updateCharacter(id, (c) => ({
      ...c,
      wounds: Math.max(0, Math.min(3, c.wounds + delta)),
    }));
  }

  function changeFatigue(id: string, delta: number) {
    updateCharacter(id, (c) => ({
      ...c,
      fatigue: Math.max(0, Math.min(2, c.fatigue + delta)),
    }));
  }

  function changeBennies(id: string, delta: number) {
    updateCharacter(id, (c) => ({
      ...c,
      bennies: Math.max(0, c.bennies + delta),
    }));
  }

  async function handleCreate() {
    const name = prompt('Имя нового персонажа:', 'Новый герой');
    if (!name || !name.trim()) return;
    const newChar = createNewCharacter(name.trim());
    await db.characters.put(newChar);
    await loadAll();
    onRefresh();
    setMessage({ type: 'ok', text: `Персонаж «${newChar.profile.name}» создан.` });
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleDelete(id: string, name: string) {
    if (
      !confirm(
        `Удалить персонажа «${name}»?\n\nЭто действие нельзя отменить.`
      )
    )
      return;
    await db.characters.delete(id);
    await loadAll();
    onRefresh();
    setMessage({ type: 'ok', text: `Персонаж «${name}» удалён.` });
    setTimeout(() => setMessage(null), 3000);
  }

  function handleExportParty() {
    if (characters.length === 0) {
      setMessage({ type: 'error', text: 'Нет персонажей для экспорта.' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    const bundle = {
      format: 'nri-character-sheet-party',
      version: 1,
      exportedAt: new Date().toISOString(),
      characters: characters.map((c) => ({ character: c, fieldMap: null })),
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `party_${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({
      type: 'ok',
      text: `Экспортировано персонажей: ${characters.length}.`,
    });
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleImportParty(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsBatchImporting(true);
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const text = reader.result as string;
        const parsed = JSON.parse(text);
        let toImport: Character[] = [];

        if (parsed?.format === 'nri-character-sheet-party') {
          for (const item of parsed.characters) {
            if (item?.character) toImport.push(item.character);
          }
        } else if (parsed?.format === 'nri-character-sheet') {
          const { character } = importFromJson(text);
          toImport = [character];
        } else {
          throw new Error('Файл не является экспортом персонажа или партии.');
        }

        if (toImport.length === 0) throw new Error('В файле нет персонажей.');

        if (
          !confirm(
            `Импортировать ${toImport.length} персонаж(ей)?\n\n` +
              `Они будут добавлены к текущей партии. ` +
              `Дубликаты по id будут перезаписаны.`
          )
        ) {
          setIsBatchImporting(false);
          if (e.target) e.target.value = '';
          return;
        }

        for (const c of toImport) await db.characters.put(c);
        await loadAll();
        onRefresh();
        setMessage({
          type: 'ok',
          text: `Импортировано персонажей: ${toImport.length}.`,
        });
        setTimeout(() => setMessage(null), 3000);
      } catch (err) {
        console.error(err);
        const msg = err instanceof Error ? err.message : 'Ошибка импорта.';
        setMessage({ type: 'error', text: msg });
      } finally {
        setIsBatchImporting(false);
        if (e.target) e.target.value = '';
      }
    };

    reader.readAsText(file);
  }

  /**
   * Значение селекта фильтра заметок.
   */
  const notesSelectValue: string =
    notesFilter === undefined
      ? '__all__'
      : notesFilter === null
        ? '__shared__'
        : notesFilter;

  function handleNotesFilterChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    if (v === '__all__') setNotesFilter(undefined);
    else if (v === '__shared__') setNotesFilter(null);
    else setNotesFilter(v);
  }

  function openCharacterNotes(id: string) {
    setNotesFilter(id);
    setMode('notes');
  }

  if (isLoading) {
    return <div style={{ padding: '24px' }}>Загрузка партии…</div>;
  }

  return (
    <div style={{ padding: '8px' }}>
      {/* --- Переключатель Партия / Заметки --- */}
      <div
        className="panel"
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          padding: '8px',
        }}
      >
        <button
          onClick={() => setMode('party')}
          className={`btn ${mode === 'party' ? 'btn-primary' : ''}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Users size={14} />
          <span>Партия</span>
        </button>
        <button
          onClick={() => setMode('notes')}
          className={`btn ${mode === 'notes' ? 'btn-primary' : ''}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <FileText size={14} />
          <span>Заметки ведущего</span>
        </button>
      </div>

      {/* --- Содержимое --- */}
      {mode === 'notes' ? (
        <>
          <div
            className="panel"
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: '12px',
              padding: '12px',
            }}
          >
            <label
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}
            >
              Показать:
            </label>
            <select
              value={notesSelectValue}
              onChange={handleNotesFilterChange}
              className="select"
              style={{ width: 'auto', minWidth: '220px' }}
            >
              <option value="__all__">Все заметки</option>
              <option value="__shared__">Общие заметки</option>
              {characters.length > 0 && (
                <optgroup label="По персонажу">
                  {characters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.profile.name || '(без имени)'}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <div
              className="tiny"
              style={{ marginLeft: 'auto', fontSize: '12px' }}
            >
              Новые заметки создаются с текущим фильтром.
            </div>
          </div>

          <NotesPanel characterId={notesFilter} />
        </>
      ) : (
        <>
          {/* Тулбар партии */}
          <div
            className="panel"
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              alignItems: 'center',
              marginBottom: '20px',
              padding: '12px',
            }}
          >
            <button
              onClick={handleCreate}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <UserPlus size={16} />
              <span>Создать персонажа</span>
            </button>

            <button
              onClick={handleExportParty}
              className="btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={16} />
              <span>Экспорт партии</span>
            </button>

            <label
              className="btn"
              style={{
                cursor: isBatchImporting ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Upload size={16} />
              <span>{isBatchImporting ? 'Импорт…' : 'Импорт партии'}</span>
              <input
                type="file"
                accept="application/json"
                onChange={handleImportParty}
                style={{ display: 'none' }}
                disabled={isBatchImporting}
              />
            </label>

            <div className="tiny" style={{ marginLeft: 'auto', fontSize: '13px' }}>
              Персонажей: {characters.length}
            </div>
          </div>

          {message && (
            <div
              className="fade-in-down"
              style={{
                marginBottom: '16px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                backgroundColor:
                  message.type === 'ok'
                    ? 'var(--success-soft)'
                    : 'var(--danger-soft)',
                color:
                  message.type === 'ok'
                    ? 'var(--success-text)'
                    : 'var(--danger-text)',
              }}
            >
              {message.text}
            </div>
          )}

          {characters.length === 0 ? (
            <div className="panel" style={{ padding: '32px', textAlign: 'center' }}>
              <p className="muted">В партии пока нет ни одного персонажа.</p>
              <p className="tiny">
                Нажмите «Создать персонажа» или загрузите партию из файла.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '16px',
              }}
            >
              {characters.map((c) => (
                <CharacterCard
                  key={c.id}
                  character={c}
                  isActive={c.id === activeCharacterId}
                  onOpen={() => onSetActive(c.id)}
                  onOpenNotes={() => openCharacterNotes(c.id)}
                  onDelete={() => handleDelete(c.id, c.profile.name)}
                  onWoundsChange={(d) => changeWounds(c.id, d)}
                  onFatigueChange={(d) => changeFatigue(c.id, d)}
                  onBenniesChange={(d) => changeBennies(c.id, d)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// Карточка персонажа
// ============================================================

function CharacterCard({
  character,
  isActive,
  onOpen,
  onOpenNotes,
  onDelete,
  onWoundsChange,
  onFatigueChange,
  onBenniesChange,
}: {
  character: Character;
  isActive: boolean;
  onOpen: () => void;
  onOpenNotes: () => void;
  onDelete: () => void;
  onWoundsChange: (delta: number) => void;
  onFatigueChange: (delta: number) => void;
  onBenniesChange: (delta: number) => void;
}) {
  const derived = calculateDerivedStats(character);
  const rank = calculateRank(character.profile.xp);
  const totalPenalty = character.wounds + character.fatigue;

  return (
    <div
      className="panel fade-in-down"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        border: isActive ? '2px solid var(--accent)' : '1px solid var(--border)',
      }}
    >
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 'bold',
              flex: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {character.profile.name || '(без имени)'}
          </h3>
          {isActive && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 'bold',
                padding: '2px 6px',
                backgroundColor: 'var(--accent)',
                color: 'var(--text-inverse)',
                borderRadius: '4px',
                textTransform: 'uppercase',
              }}
            >
              Активный
            </span>
          )}
        </div>
        <div className="tiny" style={{ marginTop: '2px' }}>
          {character.profile.concept || '—'} · {rank} · {character.profile.xp} XP
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
        }}
      >
        <MiniStat label="Защита" value={derived.parry} />
        <MiniStat label="Стойкость" value={String(derived.toughness)} />
        <MiniStat label="Шаг" value={derived.pace} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
        }}
      >
        <Tracker
          icon={<Heart size={12} />}
          label="Раны"
          value={character.wounds}
          max={3}
          color="var(--danger)"
          onChange={onWoundsChange}
        />
        <Tracker
          icon={<Zap size={12} />}
          label="Устал."
          value={character.fatigue}
          max={2}
          color="var(--warning)"
          onChange={onFatigueChange}
        />
        <Tracker
          icon={<Coins size={12} />}
          label="Фишки"
          value={character.bennies}
          color="var(--success)"
          onChange={onBenniesChange}
        />
      </div>

      {totalPenalty > 0 && (
        <div
          style={{
            fontSize: '12px',
            color: 'var(--danger)',
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '4px 8px',
            backgroundColor: 'var(--danger-soft)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          Общий штраф к броскам: −{totalPenalty}
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={onOpen}
          className="btn btn-primary"
          style={{
            flex: 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '13px',
          }}
        >
          <ExternalLink size={14} />
          <span>Открыть лист</span>
        </button>
        <button
          onClick={onOpenNotes}
          className="btn"
          title="Заметки по персонажу"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 10px',
          }}
        >
          <FileText size={14} />
        </button>
        <button
          onClick={onDelete}
          className="btn btn-danger"
          title="Удалить персонажа"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 10px',
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '6px 4px',
        backgroundColor: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      <div
        className="tiny"
        style={{ fontSize: '10px', textTransform: 'uppercase' }}
      >
        {label}
      </div>
      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{value}</div>
    </div>
  );
}

function Tracker({
  icon,
  label,
  value,
  max,
  color,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  max?: number;
  color: string;
  onChange: (delta: number) => void;
}) {
  const canDec = value > 0;
  const canInc = max === undefined || value < max;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '4px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      <div
        className="tiny"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          fontSize: '10px',
          color,
        }}
      >
        {icon}
        <span>{label}</span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginTop: '2px',
        }}
      >
        <button
          onClick={() => onChange(-1)}
          disabled={!canDec}
          className="btn"
          style={{
            padding: '1px 6px',
            fontSize: '12px',
            lineHeight: 1,
            minWidth: '20px',
          }}
        >
          −
        </button>
        <span
          style={{
            fontWeight: 'bold',
            fontSize: '14px',
            minWidth: '12px',
            textAlign: 'center',
          }}
        >
          {value}
        </span>
        <button
          onClick={() => onChange(+1)}
          disabled={!canInc}
          className="btn"
          style={{
            padding: '1px 6px',
            fontSize: '12px',
            lineHeight: 1,
            minWidth: '20px',
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}