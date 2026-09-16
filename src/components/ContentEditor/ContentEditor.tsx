import { useState } from 'react';
import { Plus, Pencil, Trash2, Sparkles, Star, BookMarked, Zap, Bug } from 'lucide-react';
import type { CustomEdge, CustomMonster } from '../../types/custom-content';
import { useCustomContent } from '../../hooks/useCustomContent';
import { deleteCustomEdge, deleteCustomMonster } from '../../db/customContent';
import { EdgeForm } from './EdgeForm';
import { MonsterForm } from './MonsterForm';
import { SourceBadge } from '../SourceBadge';

type ContentType = 'edge' | 'hindrance' | 'skill' | 'power' | 'monster';

export function ContentEditor() {
  const [activeType, setActiveType] = useState<ContentType>('edge');
  const [isCreating, setIsCreating] = useState(false);
  const [editingEdge, setEditingEdge] = useState<CustomEdge | null>(null);
  const [editingMonster, setEditingMonster] = useState<CustomMonster | null>(null);

  const {
    customEdges,
    customHindrances,
    customSkills,
    customPowers,
    customMonsters,
    reload,
  } = useCustomContent();

  // Защита от undefined (на случай, если хук вернул не всё).
  const edges = customEdges ?? [];
  const hindrances = customHindrances ?? [];
  const skills = customSkills ?? [];
  const powers = customPowers ?? [];
  const monsters = customMonsters ?? [];

  function resetState() {
    setIsCreating(false);
    setEditingEdge(null);
    setEditingMonster(null);
  }

  async function handleDeleteEdge(edge: CustomEdge) {
    if (!confirm(`Удалить черту «${edge.name}»?`)) return;
    await deleteCustomEdge(edge.id);
    await reload();
  }

  async function handleDeleteMonster(monster: CustomMonster) {
    if (!confirm(`Удалить монстра «${monster.name}»?`)) return;
    await deleteCustomMonster(monster.id);
    await reload();
  }

  return (
    <div style={{ padding: '8px' }}>
      {/* --- Переключатель типов контента --- */}
      <div
        className="panel"
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '16px',
          padding: '12px',
        }}
      >
        <TypeButton
          active={activeType === 'edge'}
          onClick={() => { setActiveType('edge'); resetState(); }}
          icon={<Star size={16} />}
          label="Черты"
          count={edges.length}
        />
        <TypeButton
          active={activeType === 'hindrance'}
          onClick={() => { setActiveType('hindrance'); resetState(); }}
          icon={<BookMarked size={16} />}
          label="Изъяны"
          count={hindrances.length}
        />
        <TypeButton
          active={activeType === 'skill'}
          onClick={() => { setActiveType('skill'); resetState(); }}
          icon={<Sparkles size={16} />}
          label="Навыки"
          count={skills.length}
        />
        <TypeButton
          active={activeType === 'power'}
          onClick={() => { setActiveType('power'); resetState(); }}
          icon={<Zap size={16} />}
          label="Силы"
          count={powers.length}
        />
        <TypeButton
          active={activeType === 'monster'}
          onClick={() => { setActiveType('monster'); resetState(); }}
          icon={<Bug size={16} />}
          label="Монстры"
          count={monsters.length}
        />

        <div style={{ marginLeft: 'auto' }}>
          {!isCreating && !editingEdge && !editingMonster && activeType === 'edge' && (
            <button
              onClick={() => setIsCreating(true)}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} />
              <span>Новая черта</span>
            </button>
          )}
          {!isCreating && !editingEdge && !editingMonster && activeType === 'monster' && (
            <button
              onClick={() => setIsCreating(true)}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} />
              <span>Новый монстр</span>
            </button>
          )}
          {!isCreating && !editingEdge && !editingMonster && (activeType === 'hindrance' || activeType === 'skill' || activeType === 'power') && (
            <div className="tiny" style={{ alignSelf: 'center' }}>
              Формы для этого типа — в следующем шаге
            </div>
          )}
        </div>
      </div>

      {/* --- Черты --- */}
      {activeType === 'edge' && (
        <>
          {(isCreating || editingEdge) && (
            <EdgeForm
              editing={editingEdge}
              onSaved={async () => { resetState(); await reload(); }}
              onCancel={resetState}
            />
          )}

          {!isCreating && !editingEdge && (
            <div>
              {edges.length === 0 ? (
                <div className="panel" style={{ padding: '32px', textAlign: 'center' }}>
                  <p className="muted">Пока не создано ни одной кастомной черты.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {edges.map((edge) => (
                    <div
                      key={edge.id}
                      className="panel"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <strong>{edge.name}</strong>
                          <SourceBadge sourceId="custom" small />
                        </div>
                        {edge.description && (
                          <div className="tiny" style={{ marginBottom: '4px' }}>
                            {edge.description}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => setEditingEdge(edge)} className="btn" style={{ padding: '6px 10px' }}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteEdge(edge)} className="btn btn-danger" style={{ padding: '6px 10px' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* --- Монстры --- */}
      {activeType === 'monster' && (
        <>
          {(isCreating || editingMonster) && (
            <MonsterForm
              editing={editingMonster}
              onSaved={async () => { resetState(); await reload(); }}
              onCancel={resetState}
            />
          )}

          {!isCreating && !editingMonster && (
            <div>
              {monsters.length === 0 ? (
                <div className="panel" style={{ padding: '32px', textAlign: 'center' }}>
                  <p className="muted">Пока не создано ни одного монстра.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {monsters.map((m) => (
                    <div
                      key={m.id}
                      className="panel"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <strong>{m.name}</strong>
                          <SourceBadge sourceId="custom" small />
                          {m.isWildCard && (
                            <span className="tiny" style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '10px' }}>
                              ДИКАЯ КАРТА
                            </span>
                          )}
                        </div>
                        <div className="tiny" style={{ marginBottom: '4px' }}>
                          {m.category} · {m.role} · {m.rank}
                        </div>
                        {m.description && (
                          <div className="tiny">{m.description}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => setEditingMonster(m)} className="btn" style={{ padding: '6px 10px' }}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteMonster(m)} className="btn btn-danger" style={{ padding: '6px 10px' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* --- Заглушки --- */}
      {(activeType === 'hindrance' || activeType === 'skill' || activeType === 'power') && (
        <div className="panel" style={{ padding: '32px', textAlign: 'center' }}>
          <p className="muted">
            Форма для этого типа появится в следующем шаге.
          </p>
        </div>
      )}
    </div>
  );
}

function TypeButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        fontSize: '13px',
        fontWeight: active ? 'bold' : 'normal',
        backgroundColor: active ? 'var(--accent)' : 'var(--bg-primary)',
        color: active ? 'var(--text-inverse)' : 'var(--text-primary)',
        border: '1px solid var(--accent)',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
      }}
    >
      {icon}
      <span>{label}</span>
      {count > 0 && (
        <span
          style={{
            fontSize: '11px',
            padding: '1px 6px',
            borderRadius: '10px',
            backgroundColor: active ? 'var(--text-inverse)' : 'var(--accent)',
            color: active ? 'var(--accent)' : 'var(--text-inverse)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}