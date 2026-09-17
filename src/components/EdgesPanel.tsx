import { useState, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import type { Character, Edge } from '../models/character';
import { EDGES, type Edge as CatalogEdge } from '../data/edges';
import { useCustomContent } from '../hooks/useCustomContent';
import { removeEdge } from '../mechanics/advancement';
import { checkRequirements, formatRequirements } from '../mechanics/requirements';
import { SourceBadge } from './SourceBadge';

interface Props {
  character: Character;
  onChange: (updated: Character) => void;
}

/** Преобразует кастомную черту в формат официального каталога. */
function customToCatalog(c: {
  id: string;
  name: string;
  description: string;
  requirements?: CatalogEdge['requirements'];
  effects: CatalogEdge['effects'];
}): CatalogEdge {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    requirements: c.requirements,
    effects: c.effects,
    sourceId: 'custom',
  };
}

export function EdgesPanel({ character, onChange }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState('');
  const [pendingEdge, setPendingEdge] = useState<CatalogEdge | null>(null);

  const { customEdges } = useCustomContent();

  // Объединённый список: официальные + кастомные
  const allEdges = useMemo<CatalogEdge[]>(() => {
    return [
      ...EDGES,
      ...(customEdges ?? []).map(customToCatalog),
    ];
  }, [customEdges]);

  const owned = new Set(character.edges.map((e) => e.id));
  const available = allEdges.filter((e) => !owned.has(e.id));

  const officialEdges = available.filter((e) => e.sourceId !== 'custom');
  const customOnly = available.filter((e) => e.sourceId === 'custom');

  function handleAdd() {
    if (!selectedEdgeId) return;
    const edge = allEdges.find((e) => e.id === selectedEdgeId);
    if (!edge) return;
    setPendingEdge(edge);
  }

  function confirmAdd() {
    if (!pendingEdge) return;
    const updated: Character = {
      ...character,
      edges: [
        ...character.edges,
        {
          id: pendingEdge.id,
          name: pendingEdge.name,
          description: pendingEdge.description,
          sourceId: pendingEdge.sourceId,
        },
      ],
    };
    onChange(updated);
    setPendingEdge(null);
    setSelectedEdgeId('');
    setIsAdding(false);
  }

  function cancelAdd() {
    setPendingEdge(null);
  }

  function handleRemove(edge: Edge) {
    if (!confirm(`Удалить черту «${edge.name}»?`)) return;
    onChange(removeEdge(character, edge.id));
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
          <h3 style={{ margin: 0, fontSize: '16px' }}>Черты (Edges)</h3>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className={`btn ${isAdding ? '' : 'btn-primary'}`}
            style={{ fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
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
              value={selectedEdgeId}
              onChange={(e) => setSelectedEdgeId(e.target.value)}
              className="select"
              style={{ flex: 1 }}
            >
              <option value="">— выберите черту —</option>
              {officialEdges.length > 0 && (
                <optgroup label="Официальные">
                  {officialEdges.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </optgroup>
              )}
              {customOnly.length > 0 && (
                <optgroup label="Пользовательские">
                  {customOnly.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
            <button
              onClick={handleAdd}
              disabled={!selectedEdgeId}
              className="btn btn-success"
              style={{ whiteSpace: 'nowrap' }}
            >
              Добавить
            </button>
          </div>
        )}

        {character.edges.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>У персонажа нет черт.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {character.edges.map((edge) => (
              <div
                key={edge.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-tertiary)',
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
                    <span>{edge.name}</span>
                    <SourceBadge sourceId={edge.sourceId} small />
                  </div>
                  {edge.description && (
                    <div className="tiny">{edge.description}</div>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(edge)}
                  title="Удалить черту"
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

      {pendingEdge && (
        <ConfirmEdgeDialog
          edge={pendingEdge}
          character={character}
          onConfirm={confirmAdd}
          onCancel={cancelAdd}
        />
      )}
    </>
  );
}

function ConfirmEdgeDialog({
  edge,
  character,
  onConfirm,
  onCancel,
}: {
  edge: CatalogEdge;
  character: Character;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const check = checkRequirements(character, edge.requirements);
  const reqText = formatRequirements(edge.requirements);

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
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
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
        <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Добавить черту?</h3>

        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <strong>{edge.name}</strong>
          <SourceBadge sourceId={edge.sourceId} small />
        </div>

        {edge.description && (
          <p className="tiny" style={{ marginBottom: '12px' }}>{edge.description}</p>
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
            <div style={{ marginTop: '10px', fontSize: '12px', fontStyle: 'italic' }}>
              Вы действуете как ведущий и можете добавить черту,
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