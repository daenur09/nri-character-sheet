import { useState } from 'react';
import { Plus, Pencil, Trash2, Sparkles, Star, BookMarked, Zap, Bug } from 'lucide-react';
import type {
  CustomEdge,
  CustomHindrance,
  CustomSkill,
  CustomPower,
  CustomMonster,
} from '../../types/custom-content';
import { useCustomContent } from '../../hooks/useCustomContent';
import {
  deleteCustomEdge,
  deleteCustomHindrance,
  deleteCustomSkill,
  deleteCustomPower,
  deleteCustomMonster,
} from '../../db/customContent';
import { EdgeForm } from './EdgeForm';
import { HindranceForm } from './HindranceForm';
import { SkillForm } from './SkillForm';
import { PowerForm } from './PowerForm';
import { MonsterForm } from './MonsterForm';
import { SourceBadge } from '../SourceBadge';

type ContentType = 'edge' | 'hindrance' | 'skill' | 'power' | 'monster';

const CREATE_LABELS: Record<ContentType, string> = {
  edge: 'Новая черта',
  hindrance: 'Новый изъян',
  skill: 'Новый навык',
  power: 'Новая сила',
  monster: 'Новый монстр',
};

export function ContentEditor() {
  const [activeType, setActiveType] = useState<ContentType>('edge');
  const [isCreating, setIsCreating] = useState(false);
  const [editingEdge, setEditingEdge] = useState<CustomEdge | null>(null);
  const [editingHindrance, setEditingHindrance] = useState<CustomHindrance | null>(null);
  const [editingSkill, setEditingSkill] = useState<CustomSkill | null>(null);
  const [editingPower, setEditingPower] = useState<CustomPower | null>(null);
  const [editingMonster, setEditingMonster] = useState<CustomMonster | null>(null);

  const {
    customEdges,
    customHindrances,
    customSkills,
    customPowers,
    customMonsters,
    reload,
  } = useCustomContent();

  const edges = customEdges ?? [];
  const hindrances = customHindrances ?? [];
  const skills = customSkills ?? [];
  const powers = customPowers ?? [];
  const monsters = customMonsters ?? [];

  const isEditingAnything =
    isCreating ||
    !!editingEdge ||
    !!editingHindrance ||
    !!editingSkill ||
    !!editingPower ||
    !!editingMonster;

  function resetState() {
    setIsCreating(false);
    setEditingEdge(null);
    setEditingHindrance(null);
    setEditingSkill(null);
    setEditingPower(null);
    setEditingMonster(null);
  }

  async function handleDeleteEdge(e: CustomEdge) {
    if (!confirm(`Удалить черту «${e.name}»?`)) return;
    await deleteCustomEdge(e.id);
    await reload();
  }
  async function handleDeleteHindrance(h: CustomHindrance) {
    if (!confirm(`Удалить изъян «${h.name}»?`)) return;
    await deleteCustomHindrance(h.id);
    await reload();
  }
  async function handleDeleteSkill(s: CustomSkill) {
    if (!confirm(`Удалить навык «${s.name}»?`)) return;
    await deleteCustomSkill(s.id);
    await reload();
  }
  async function handleDeletePower(p: CustomPower) {
    if (!confirm(`Удалить силу «${p.name}»?`)) return;
    await deleteCustomPower(p.id);
    await reload();
  }
  async function handleDeleteMonster(m: CustomMonster) {
    if (!confirm(`Удалить монстра «${m.name}»?`)) return;
    await deleteCustomMonster(m.id);
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
          {!isEditingAnything && (
            <button
              onClick={() => setIsCreating(true)}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} />
              <span>{CREATE_LABELS[activeType]}</span>
            </button>
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
            <SimpleList
              items={edges}
              emptyText="Пока не создано ни одной кастомной черты."
              onEdit={setEditingEdge}
              onDelete={handleDeleteEdge}
              renderMeta={(e) => e.description}
            />
          )}
        </>
      )}

      {/* --- Изъяны --- */}
      {activeType === 'hindrance' && (
        <>
          {(isCreating || editingHindrance) && (
            <HindranceForm
              editing={editingHindrance}
              onSaved={async () => { resetState(); await reload(); }}
              onCancel={resetState}
            />
          )}
          {!isCreating && !editingHindrance && (
            <SimpleList
              items={hindrances}
              emptyText="Пока не создано ни одного изъяна."
              onEdit={setEditingHindrance}
              onDelete={handleDeleteHindrance}
              renderMeta={(h) =>
  `${h.severity === 'major' ? 'Крупный' : 'Мелкий'}${
    h.description ? ' · ' + h.description : ''
  }`
}
            />
          )}
        </>
      )}

      {/* --- Навыки --- */}
      {activeType === 'skill' && (
        <>
          {(isCreating || editingSkill) && (
            <SkillForm
              editing={editingSkill}
              onSaved={async () => { resetState(); await reload(); }}
              onCancel={resetState}
            />
          )}
          {!isCreating && !editingSkill && (
            <SimpleList
              items={skills}
              emptyText="Пока не создано ни одного навыка."
              onEdit={setEditingSkill}
              onDelete={handleDeleteSkill}
              renderMeta={(s) => `${s.attribute}${s.isCore ? ' · базовый' : ''}`}
            />
          )}
        </>
      )}

      {/* --- Силы --- */}
      {activeType === 'power' && (
        <>
          {(isCreating || editingPower) && (
            <PowerForm
              editing={editingPower}
              onSaved={async () => { resetState(); await reload(); }}
              onCancel={resetState}
            />
          )}
          {!isCreating && !editingPower && (
            <SimpleList
              items={powers}
              emptyText="Пока не создано ни одной силы."
              onEdit={setEditingPower}
              onDelete={handleDeletePower}
              renderMeta={(p) => `${p.rank} · ${p.cost} ОД · ${p.range} · ${p.duration}`}
            />
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
            <SimpleList
              items={monsters}
              emptyText="Пока не создано ни одного монстра."
              onEdit={setEditingMonster}
              onDelete={handleDeleteMonster}
              renderMeta={(m) =>
                `${m.category} · ${m.role} · ${m.rank}${m.isWildCard ? ' · ДИКАЯ КАРТА' : ''}`
              }
            />
          )}
        </>
      )}
    </div>
  );
}

/**
 * Универсальный список элементов с бейджем CUSTOM и кнопками edit/delete.
 */
function SimpleList<T extends { id: string; name: string }>({
  items,
  emptyText,
  onEdit,
  onDelete,
  renderMeta,
}: {
  items: T[];
  emptyText: string;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  renderMeta?: (item: T) => string;
}) {
  if (items.length === 0) {
    return (
      <div className="panel" style={{ padding: '32px', textAlign: 'center' }}>
        <p className="muted">{emptyText}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map((item) => (
        <div
          key={item.id}
          className="panel"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '4px',
              }}
            >
              <strong>{item.name}</strong>
              <SourceBadge sourceId="custom" small />
            </div>
            {renderMeta && (
              <div className="tiny" style={{ marginBottom: '4px' }}>
                {renderMeta(item)}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => onEdit(item)} className="btn" style={{ padding: '6px 10px' }}>
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(item)}
              className="btn btn-danger"
              style={{ padding: '6px 10px' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
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