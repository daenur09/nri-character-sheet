import { useMemo, useState } from 'react';
import type { Character, Hindrance } from '../models/character';
import { HINDRANCES } from '../data/hindrances';
import type { CustomHindrance } from '../types/custom-content';
import { useCustomContent } from '../hooks/useCustomContent';
import { addHindrance, removeHindrance } from '../mechanics/advancement';
import { checkRequirements, formatRequirements } from '../mechanics/requirements';
import { SourceBadge } from './SourceBadge';

/**
 * Преобразует кастомный изъян в форму, совместимую с HINDRANCES.
 */
function customToHindrance(c: CustomHindrance): typeof HINDRANCES[number] {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    severity: c.severity,
    effects: c.effects,
    requirements: c.requirements,
    sourceId: 'custom',
  };
}

interface Props {
  character: Character;
  onChange: (updated: Character) => void;
}

/**
 * Панель изъянов (Hindrances) персонажа.
 * Включает как стандартные изъяны из HINDRANCES, так и пользовательские.
 */
export function HindrancesPanel({ character, onChange }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedHindranceId, setSelectedHindranceId] = useState('');
  const [pendingHindrance, setPendingHindrance] = useState<
    typeof HINDRANCES[number] | null
  >(null);

  const { customHindrances } = useCustomContent();

  // Объединяем стандартные и кастомные изъяны.
  const allHindrances = useMemo(() => {
    const customAsHindrances = (customHindrances ?? []).map(customToHindrance);
    return [...HINDRANCES, ...customAsHindrances];
  }, [customHindrances]);

  const owned = new Set(character.hindrances.map((h) => h.id));
  const availableHindrances = allHindrances.filter((h) => !owned.has(h.id));

  function handleAdd() {
    if (!selectedHindranceId) return;
    const hindrance = allHindrances.find((h) => h.id === selectedHindranceId);
    if (!hindrance) return;
    setPendingHindrance(hindrance);
  }

  function confirmAdd() {
    if (!pendingHindrance) return;

    // addHindrance создаёт стандартный объект без поля effects.
    const updated = addHindrance(
      character,
      pendingHindrance.id,
      pendingHindrance.name,
      pendingHindrance.severity,
      pendingHindrance.sourceId,
      pendingHindrance.description
    );

    if (updated) {
      // ⚡ Дописываем эффекты по id — критично для кастомных изъянов
      // и для сохранения явных effects в новом персонаже.
      const hindrances = updated.hindrances.map((h) =>
        h.id === pendingHindrance.id
          ? { ...h, effects: pendingHindrance.effects }
          : h
      );

      onChange({ ...updated, hindrances });
      setPendingHindrance(null);
      setSelectedHindranceId('');
      setIsAdding(false);
    }
  }

  function cancelAdd() {
    setPendingHindrance(null);
  }

  function handleRemove(hindrance: Hindrance) {
    if (!confirm(`Удалить изъян «${hindrance.name}»?`)) return;
    onChange(removeHindrance(character, hindrance.id));
  }

  return (
    <>
      <div className="panel" style={{ marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px' }}>Изъяны (Hindrances)</h3>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className={`btn ${isAdding ? '' : 'btn-primary'}`}
            style={{
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: isAdding ? undefined : 'var(--warning)',
              borderColor: isAdding ? undefined : 'var(--warning)',
              color: isAdding ? undefined : 'var(--text-inverse)',
            }}
          >
            {isAdding ? 'Отмена' : '+ Добавить'}
          </button>
        </div>

        {isAdding && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '12px',
              alignItems: 'stretch',
            }}
          >
            <select
              value={selectedHindranceId}
              onChange={(e) => setSelectedHindranceId(e.target.value)}
              className="select"
              style={{ flex: 1 }}
            >
              <option value="">— выберите изъян —</option>
              {availableHindrances.map((h) => {
                const isCustom = h.sourceId === 'custom';
                return (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.severity === 'major' ? 'крупный' : 'мелкий'})
                    {isCustom ? ' [CUSTOM]' : ''}
                  </option>
                );
              })}
            </select>
            <button
              onClick={handleAdd}
              disabled={!selectedHindranceId}
              className="btn btn-success"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              Добавить
            </button>
          </div>
        )}

        {character.hindrances.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            У персонажа нет изъянов.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {character.hindrances.map((hindrance) => (
              <div
                key={hindrance.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--warning-soft)',
                  color: 'var(--text-primary)',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 'bold',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span>{hindrance.name}</span>
                    <span
                      className="tiny"
                      style={{
                        textTransform: 'uppercase',
                        fontSize: '10px',
                        fontWeight: 'bold',
                      }}
                    >
                      {hindrance.severity === 'major' ? 'крупный' : 'мелкий'}
                    </span>
                    <SourceBadge sourceId={hindrance.sourceId} small />
                  </div>
                  {hindrance.description && (
                    <div className="tiny">{hindrance.description}</div>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(hindrance)}
                  title="Удалить изъян"
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
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingHindrance && (
        <ConfirmHindranceDialog
          hindrance={pendingHindrance}
          character={character}
          onConfirm={confirmAdd}
          onCancel={cancelAdd}
        />
      )}
    </>
  );
}

/**
 * Диалог подтверждения добавления изъяна.
 */
function ConfirmHindranceDialog({
  hindrance,
  character,
  onConfirm,
  onCancel,
}: {
  hindrance: typeof HINDRANCES[number];
  character: Character;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const check = checkRequirements(character, hindrance.requirements);
  const reqText = formatRequirements(hindrance.requirements);

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
        zIndex: 1100,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
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
        <h3 style={{ marginTop: 0, marginBottom: '12px' }}>
          Добавить изъян?
        </h3>

        <div
          style={{
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <strong>{hindrance.name}</strong>
          <span
            className="tiny"
            style={{
              textTransform: 'uppercase',
              fontSize: '10px',
              fontWeight: 'bold',
            }}
          >
            {hindrance.severity === 'major' ? 'крупный' : 'мелкий'}
          </span>
          <SourceBadge sourceId={hindrance.sourceId} small />
        </div>

        {hindrance.description && (
          <p className="tiny" style={{ marginBottom: '12px' }}>
            {hindrance.description}
          </p>
        )}

        {reqText && (
          <div
            className="tiny"
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '12px',
            }}
          >
            <strong>Требования:</strong> {reqText}
          </div>
        )}

        {!check.ok && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--warning-soft)',
              color: 'var(--warning-text)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>
              ⚠️ Требования не выполнены:
            </div>
            {check.reasons.map((r, i) => (
              <div key={i}>• {r}</div>
            ))}
            <div
              style={{
                marginTop: '10px',
                fontSize: '12px',
                fontStyle: 'italic',
              }}
            >
              Вы действуете как ведущий и можете добавить изъян,
              несмотря на несоблюдение требований.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} className="btn">
            Отмена
          </button>
          <button onClick={onConfirm} className="btn btn-success">
            Добавить
          </button>
        </div>
      </div>
    </div>
  );
}