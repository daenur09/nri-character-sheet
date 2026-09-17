import { useState, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import type { Character, Hindrance } from '../models/character';
import { HINDRANCES, type Hindrance as CatalogHindrance } from '../data/hindrances';
import { useCustomContent } from '../hooks/useCustomContent';
import { addHindrance, removeHindrance } from '../mechanics/advancement';
import { checkRequirements, formatRequirements } from '../mechanics/requirements';
import { SourceBadge } from './SourceBadge';

interface Props {
  character: Character;
  onChange: (updated: Character) => void;
}

function customToCatalog(c: {
  id: string;
  name: string;
  description: string;
  severity: CatalogHindrance['severity'];
  requirements?: CatalogHindrance['requirements'];
  effects: CatalogHindrance['effects'];
}): CatalogHindrance {
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

export function HindrancesPanel({ character, onChange }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [pending, setPending] = useState<CatalogHindrance | null>(null);

  const { customHindrances } = useCustomContent();

  const allHindrances = useMemo<CatalogHindrance[]>(() => {
    return [
      ...HINDRANCES,
      ...(customHindrances ?? []).map(customToCatalog),
    ];
  }, [customHindrances]);

  const owned = new Set(character.hindrances.map((h) => h.id));
  const available = allHindrances.filter((h) => !owned.has(h.id));
  const official = available.filter((h) => h.sourceId !== 'custom');
  const customOnly = available.filter((h) => h.sourceId === 'custom');

  function handleAdd() {
    if (!selectedId) return;
    const h = allHindrances.find((x) => x.id === selectedId);
    if (!h) return;
    setPending(h);
  }

  function confirmAdd() {
    if (!pending) return;
    const updated = addHindrance(
      character,
      pending.id,
      pending.name,
      pending.severity,
      pending.sourceId,
      pending.description
    );
    if (updated) {
      onChange(updated);
      setPending(null);
      setSelectedId('');
      setIsAdding(false);
    }
  }

  function cancelAdd() { setPending(null); }

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
            {isAdding ? (
              <><X size={14} /><span>Отмена</span></>
            ) : (
              <><Plus size={14} /><span>Добавить</span></>
            )}
          </button>
        </div>

        {isAdding && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'stretch' }}>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="select"
              style={{ flex: 1 }}
            >
              <option value="">— выберите изъян —</option>
              {official.length > 0 && (
                <optgroup label="Официальные">
                  {official.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.severity === 'major' ? 'крупный' : 'мелкий'})
                    </option>
                  ))}
                </optgroup>
              )}
              {customOnly.length > 0 && (
                <optgroup label="Пользовательские">
                  {customOnly.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.severity === 'major' ? 'крупный' : 'мелкий'})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <button
              onClick={handleAdd}
              disabled={!selectedId}
              className="btn btn-success"
              style={{ whiteSpace: 'nowrap' }}
            >
              Добавить
            </button>
          </div>
        )}

        {character.hindrances.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>У персонажа нет изъянов.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {character.hindrances.map((h) => (
              <div
                key={h.id}
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
                    <span>{h.name}</span>
                    <span className="tiny" style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 'bold' }}>
                      {h.severity === 'major' ? 'КРУПНЫЙ' : 'МЕЛКИЙ'}
                    </span>
                    <SourceBadge sourceId={h.sourceId} small />
                  </div>
                  {h.description && <div className="tiny">{h.description}</div>}
                </div>
                <button
                  onClick={() => handleRemove(h)}
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
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {pending && (
        <ConfirmHindranceDialog
          hindrance={pending}
          character={character}
          onConfirm={confirmAdd}
          onCancel={cancelAdd}
        />
      )}
    </>
  );
}

function ConfirmHindranceDialog({
  hindrance, character, onConfirm, onCancel,
}: {
  hindrance: CatalogHindrance;
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
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="dialog"
        style={{
          backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)',
          borderRadius: 'var(--radius-lg)', padding: '24px',
          width: '90%', maxWidth: '480px', boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Добавить изъян?</h3>
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <strong>{hindrance.name}</strong>
          <span className="tiny" style={{ textTransform: 'uppercase', fontSize: '10px', fontWeight: 'bold' }}>
            {hindrance.severity === 'major' ? 'КРУПНЫЙ' : 'МЕЛКИЙ'}
          </span>
          <SourceBadge sourceId={hindrance.sourceId} small />
        </div>
        {hindrance.description && (
          <p className="tiny" style={{ marginBottom: '12px' }}>{hindrance.description}</p>
        )}
        {reqText && (
          <div
            className="tiny"
            style={{
              padding: '8px 12px', backgroundColor: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-sm)', marginBottom: '12px',
            }}
          >
            <strong>Требования:</strong> {reqText}
          </div>
        )}
        {!check.ok && (
          <div
            style={{
              padding: '10px 14px', backgroundColor: 'var(--warning-soft)',
              color: 'var(--warning-text)', borderRadius: 'var(--radius-md)',
              fontSize: '13px', marginBottom: '16px',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>⚠️ Требования не выполнены:</div>
            {check.reasons.map((r, i) => <div key={i}>• {r}</div>)}
            <div style={{ marginTop: '10px', fontSize: '12px', fontStyle: 'italic' }}>
              Вы действуете как ведущий и можете добавить изъян,
              несмотря на несоблюдение требований.
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} className="btn">Отмена</button>
          <button onClick={onConfirm} className="btn btn-success">Добавить</button>
        </div>
      </div>
    </div>
  );
}