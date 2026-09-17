import { useEffect, useMemo, useState } from 'react';
import {
  Play,
  RotateCcw,
  Plus,
  X,
  Check,
  User,
  Users,
  Skull,
  Shuffle,
} from 'lucide-react';
import type {
  InitiativeParticipant,
  SessionState,
  ParticipantType,
} from '../../types/initiative';
import {
  computeDrawConfig,
  emptySession,
  freshDeck,
  generateParticipantId,
  sortByInitiative,
  startNewRound,
} from '../../mechanics/initiative';

const STORAGE_KEY = 'nri-initiative-session';

/**
 * Хук загрузки/сохранения боевой сессии в localStorage.
 */
function useSession() {
  const [session, setSession] = useState<SessionState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as SessionState;
    } catch {
      /* ignore */
    }
    return emptySession();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      /* ignore */
    }
  }, [session]);

  return [session, setSession] as const;
}

export function InitiativeTracker() {
  const [session, setSession] = useSession();
  const [isAdding, setIsAdding] = useState(false);

  const sorted = useMemo(
    () => sortByInitiative(session.participants),
    [session.participants]
  );

  function handleNewRound() {
    setSession((s) => startNewRound(s));
  }

  function handleReset() {
    if (!confirm('Сбросить бой? Все участники и карты будут удалены.')) return;
    setSession(emptySession());
  }

  function handleToggleActed(id: string) {
    setSession((s) => ({
      ...s,
      participants: s.participants.map((p) =>
        p.id === id ? { ...p, hasActed: !p.hasActed } : p
      ),
    }));
  }

  function handleRemove(id: string) {
    if (!confirm('Удалить участника из боя?')) return;
    setSession((s) => ({
      ...s,
      participants: s.participants.filter((p) => p.id !== id),
    }));
  }

  function handleAdd(p: InitiativeParticipant) {
    setSession((s) => ({
      ...s,
      participants: [...s.participants, p],
    }));
    setIsAdding(false);
  }

  function handleReshuffleDeck() {
    if (!confirm('Перемешать колоду заново?')) return;
    setSession((s) => ({ ...s, deck: freshDeck(), discard: [] }));
  }

  return (
    <div style={{ padding: '8px' }}>
      {/* --- Верхняя панель: раунд и действия --- */}
      <div
        className="panel"
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: '16px',
          padding: '12px',
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
          Раунд: {session.round}
        </div>
        <div className="tiny" style={{ fontSize: '13px' }}>
          Колода: {session.deck.length} · Сброс: {session.discard.length}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <button
            onClick={handleNewRound}
            className="btn btn-primary"
            disabled={session.participants.length === 0}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Play size={14} />
            <span>Новый раунд</span>
          </button>
          <button
            onClick={handleReshuffleDeck}
            className="btn"
            title="Перемешать колоду заново"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Shuffle size={14} />
          </button>
          <button
            onClick={handleReset}
            className="btn btn-danger"
            title="Сбросить бой"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* --- Кнопка «Добавить участника» --- */}
      <div style={{ marginBottom: '12px' }}>
        <button
          onClick={() => setIsAdding(true)}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={14} />
          <span>Добавить участника</span>
        </button>
      </div>

      {/* --- Список участников --- */}
      {session.participants.length === 0 ? (
        <div className="panel" style={{ padding: '32px', textAlign: 'center' }}>
          <p className="muted">Список бойцов пуст.</p>
          <p className="tiny">
            Нажмите «Добавить участника», чтобы добавить персонажа, NPC или группу статистов.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {sorted.map((p, idx) => (
            <ParticipantRow
              key={p.id}
              index={idx + 1}
              participant={p}
              onToggleActed={() => handleToggleActed(p.id)}
              onRemove={() => handleRemove(p.id)}
            />
          ))}
        </div>
      )}

      {/* --- Модалка добавления --- */}
      {isAdding && (
        <AddParticipantDialog
          onAdd={handleAdd}
          onClose={() => setIsAdding(false)}
        />
      )}
    </div>
  );
}

// ============================================================
// Строка участника
// ============================================================

function ParticipantRow({
  index,
  participant: p,
  onToggleActed,
  onRemove,
}: {
  index: number;
  participant: InitiativeParticipant;
  onToggleActed: () => void;
  onRemove: () => void;
}) {
  const isJoker = p.currentCard?.suit === 'joker';

  return (
    <div
      className="panel"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 14px',
        opacity: p.hasActed ? 0.55 : 1,
        borderLeft: isJoker ? '4px solid var(--accent)' : '4px solid transparent',
      }}
    >
      <div
        className="tiny"
        style={{
          fontSize: '11px',
          fontWeight: 'bold',
          minWidth: '20px',
          color: 'var(--text-secondary)',
        }}
      >
        #{index}
      </div>

      {/* Карта */}
      <div
        style={{
          minWidth: '60px',
          padding: '6px 10px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)',
          backgroundColor: isJoker ? 'var(--accent)' : 'var(--bg-tertiary)',
          color: isJoker ? 'var(--text-inverse)' : 'var(--text-primary)',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '16px',
        }}
        title={p.drawnCards.map((c) => c.display).join(', ')}
      >
        {p.currentCard?.display ?? '—'}
      </div>

      {/* Имя и метаданные */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
          }}
        >
          <ParticipantIcon type={p.type} />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {p.name}
          </span>
          {p.type === 'group' && p.groupCount !== undefined && (
            <span className="tiny" style={{ fontSize: '11px' }}>
              ×{p.groupCount}
            </span>
          )}
          {p.hasQuick && <Tag text="Quick" />}
          {p.hasLevelHeadedImproved && <Tag text="LH+" />}
          {p.hasSlow && <Tag text="Slow" danger />}
        </div>
        {p.drawnCards.length > 1 && (
          <div className="tiny" style={{ fontSize: '11px', marginTop: '2px' }}>
            Вытянул: {p.drawnCards.map((c) => c.display).join(', ')}
          </div>
        )}
      </div>

      {/* Кнопки */}
      <button
        onClick={onToggleActed}
        className="btn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '12px',
          backgroundColor: p.hasActed ? 'var(--success-soft)' : undefined,
          color: p.hasActed ? 'var(--success-text)' : undefined,
        }}
      >
        {p.hasActed ? <Check size={14} /> : null}
        <span>{p.hasActed ? 'Походил' : 'Ход'}</span>
      </button>

      <button
        onClick={onRemove}
        title="Удалить из боя"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--danger)',
          cursor: 'pointer',
          padding: '0 4px',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

function ParticipantIcon({ type }: { type: ParticipantType }) {
  if (type === 'character') return <User size={14} />;
  if (type === 'npc') return <Skull size={14} />;
  return <Users size={14} />;
}

function Tag({ text, danger }: { text: string; danger?: boolean }) {
  return (
    <span
      className="tiny"
      style={{
        fontSize: '10px',
        padding: '1px 6px',
        borderRadius: '10px',
        backgroundColor: danger ? 'var(--danger-soft)' : 'var(--accent-soft)',
        color: danger ? 'var(--danger-text)' : 'var(--accent-text)',
        fontWeight: 'bold',
        textTransform: 'uppercase',
      }}
    >
      {text}
    </span>
  );
}

// ============================================================
// Модалка добавления участника
// ============================================================

function AddParticipantDialog({
  onAdd,
  onClose,
}: {
  onAdd: (p: InitiativeParticipant) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ParticipantType>('npc');
  const [groupCount, setGroupCount] = useState(3);
  const [hasQuick, setHasQuick] = useState(false);
  const [hasLevelHeadedImproved, setHasLevelHeadedImproved] = useState(false);
  const [hasSlow, setHasSlow] = useState(false);

  function handleSubmit() {
    if (!name.trim()) {
      alert('Введите имя участника');
      return;
    }
    const { cardDrawCount, chooseBest } = computeDrawConfig(
      hasQuick,
      hasLevelHeadedImproved,
      hasSlow
    );
    const participant: InitiativeParticipant = {
      id: generateParticipantId(),
      name: name.trim(),
      type,
      cardDrawCount,
      chooseBest,
      currentCard: null,
      drawnCards: [],
      hasActed: false,
      groupCount: type === 'group' ? groupCount : undefined,
      hasQuick,
      hasLevelHeadedImproved,
      hasSlow,
    };
    onAdd(participant);
  }

  return (
    <div
      className="backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="dialog"
        style={{
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          width: '90%',
          maxWidth: '480px',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>
          Новый участник
        </h3>

        <label style={labelStyle}>Имя *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например, Торвальд"
          className="input"
        />

        <label style={labelStyle}>Тип</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ParticipantType)}
          className="select"
        >
          <option value="character">Персонаж игрока (Wild Card)</option>
          <option value="npc">NPC / монстр (Wild Card)</option>
          <option value="group">Группа статистов</option>
        </select>

        {type === 'group' && (
          <>
            <label style={labelStyle}>Количество статистов</label>
            <input
              type="number"
              min={1}
              value={groupCount}
              onChange={(e) => setGroupCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="input"
              style={{ textAlign: 'center' }}
            />
          </>
        )}

        <label style={labelStyle}>Черты и изъяны</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Checkbox checked={hasQuick} onChange={setHasQuick} label="Quick (2 карты, лучшая)" />
          <Checkbox
            checked={hasLevelHeadedImproved}
            onChange={setHasLevelHeadedImproved}
            label="Level Headed+ (3 карты, лучшая)"
          />
          <Checkbox checked={hasSlow} onChange={setHasSlow} label="Slow (+1 карта, худшая)" danger />
        </div>

        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
          }}
        >
          <button onClick={onClose} className="btn">
            Отмена
          </button>
          <button onClick={handleSubmit} className="btn btn-success">
            Добавить
          </button>
        </div>
      </div>
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
  danger,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        fontSize: '13px',
        color: danger ? 'var(--danger-text)' : 'var(--text-primary)',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginTop: '12px',
  marginBottom: '4px',
  fontSize: '13px',
  fontWeight: 'bold',
  color: 'var(--text-primary)',
};