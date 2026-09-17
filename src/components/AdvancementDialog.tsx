import { useState, useMemo } from 'react';
import type { Character, AttributeName, Skill } from '../models/character';
import type { DieType } from '../mechanics/dice';
import { dieToNumber } from '../mechanics/dice';
import { EDGES, type Edge as CatalogEdge } from '../data/edges';
import { useCustomContent } from '../hooks/useCustomContent';
import { checkRequirements, formatRequirements } from '../mechanics/requirements';
import {
  canRaiseAttribute,
  canRaiseSkill,
  nextDieType,
  isSkillAboveAttribute,
  raiseAttribute,
  raiseSingleSkill,
  raiseTwoSkills,
  addNewSkill,
  addEdge,
} from '../mechanics/advancement';

type Step = 'choose' | 'attribute' | 'skill1' | 'skill2' | 'new_skill' | 'edge';

const ATTRIBUTE_LABELS: Record<AttributeName, string> = {
  agility: 'Ловкость',
  smarts: 'Смекалка',
  spirit: 'Характер',
  strength: 'Сила',
  vigor: 'Выносливость',
};

interface Props {
  character: Character;
  onApply: (updated: Character) => void;
  onClose: () => void;
}

export function AdvancementDialog({ character, onApply, onClose }: Props) {
  const [step, setStep] = useState<Step>('choose');
  const { customEdges } = useCustomContent();
  const [filterMode, setFilterMode] = useState<'available' | 'all'>('available');
  const [selectedAttribute, setSelectedAttribute] = useState<AttributeName | null>(null);
  const [selectedSkill1, setSelectedSkill1] = useState<string | null>(null);
  const [selectedSkill2, setSelectedSkill2] = useState<string | null>(null);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillAttribute, setNewSkillAttribute] = useState<AttributeName>('agility');
  const [searchEdge, setSearchEdge] = useState('');

  const availableAttributes = useMemo(() => {
    return (Object.keys(character.attributes) as AttributeName[]).filter((attr) =>
      canRaiseAttribute(character, attr)
    );
  }, [character]);

  const availableSkills = useMemo(() => {
    return character.skills.filter((s) => canRaiseSkill(s));
  }, [character]);

  const skillsBelowAttr = useMemo(() => {
    return character.skills.filter(
      (s) => canRaiseSkill(s) && !isSkillAboveAttribute(s, character)
    );
  }, [character]);

  /**
   * Список черт с информацией о доступности.
   */
  const edgesWithStatus = useMemo(() => {
    const search = searchEdge.toLowerCase().trim();
    const allEdges: CatalogEdge[] = [
      ...EDGES,
      ...(customEdges ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        requirements: c.requirements,
        effects: c.effects,
        sourceId: 'custom',
      })),
    ];
    return allEdges.map((edge) => {
      const alreadyOwned = character.edges.some((e) => e.id === edge.id);
      const check = checkRequirements(character, edge.requirements);
      return {
        edge,
        alreadyOwned,
        canTake: !alreadyOwned && check.ok,
        reasons: alreadyOwned ? ['Черта уже есть'] : check.reasons,
      };
    }).filter((item) => {
      if (search && !item.edge.name.toLowerCase().includes(search)) return false;
      if (filterMode === 'available') {
        return item.canTake;
      }
      return true;
    });
  }, [character, searchEdge, filterMode, customEdges]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  function applyAttribute() {
    if (!selectedAttribute) return;
    const updated = raiseAttribute(character, selectedAttribute);
    if (updated) {
      onApply(updated);
      onClose();
    } else {
      alert('Не удалось повысить атрибут.');
    }
  }

  function applySingleSkill() {
    if (!selectedSkill1) return;
    const updated = raiseSingleSkill(character, selectedSkill1);
    if (updated) {
      onApply(updated);
      onClose();
    } else {
      alert('Не удалось повысить навык.');
    }
  }

  function applyTwoSkills() {
    if (!selectedSkill1 || !selectedSkill2) return;
    const updated = raiseTwoSkills(character, selectedSkill1, selectedSkill2);
    if (updated) {
      onApply(updated);
      onClose();
    } else {
      alert('Не удалось повысить два навыка.');
    }
  }

  function applyNewSkill() {
    if (!newSkillName.trim()) return;
    const updated = addNewSkill(character, newSkillName.trim(), newSkillAttribute);
    if (updated) {
      onApply(updated);
      onClose();
    } else {
      alert('Навык с таким именем уже существует.');
    }
  }

  function applyEdge(edgeId: string, edgeName: string, sourceId: string, description: string) {
    const updated = addEdge(character, edgeId, edgeName, sourceId, description);
    if (updated) {
      onApply(updated);
      onClose();
    } else {
      alert('Такая черта уже есть у персонажа.');
    }
  }

  return (
    <div className="backdrop" style={backdropStyle} onClick={handleBackdropClick}>
      <div className="dialog" style={dialogStyle}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>Мастер повышений</h2>
          <button onClick={onClose} style={closeButtonStyle}>×</button>
        </div>

        <div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
          {step === 'choose' && (
            <StepChoose
              character={character}
              onChoose={setStep}
              availableAttributesCount={availableAttributes.length}
              availableSkillsCount={availableSkills.length}
            />
          )}

          {step === 'attribute' && (
            <StepAttribute
              character={character}
              filterMode={filterMode}
              setFilterMode={setFilterMode}
              selected={selectedAttribute}
              onSelect={setSelectedAttribute}
              onApply={applyAttribute}
              onBack={() => setStep('choose')}
            />
          )}

          {step === 'skill1' && (
            <StepSkillSelect
              title="Повысить один навык"
              hint="Навык будет повышен на одну ступень. Стоимость — 1 повышение."
              character={character}
              filterMode={filterMode}
              setFilterMode={setFilterMode}
              skills={character.skills}
              selected={selectedSkill1}
              onSelect={setSelectedSkill1}
              onApply={applySingleSkill}
              onBack={() => setStep('choose')}
            />
          )}

          {step === 'skill2' && (
            <StepTwoSkills
              character={character}
              filterMode={filterMode}
              setFilterMode={setFilterMode}
              skillsBelowAttr={skillsBelowAttr}
              selected1={selectedSkill1}
              selected2={selectedSkill2}
              onSelect1={setSelectedSkill1}
              onSelect2={setSelectedSkill2}
              onApply={applyTwoSkills}
              onBack={() => setStep('choose')}
            />
          )}

          {step === 'new_skill' && (
            <StepNewSkill
              name={newSkillName}
              setName={setNewSkillName}
              attribute={newSkillAttribute}
              setAttribute={setNewSkillAttribute}
              onApply={applyNewSkill}
              onBack={() => setStep('choose')}
            />
          )}

          {step === 'edge' && (
            <StepEdge
              items={edgesWithStatus}
              filterMode={filterMode}
              setFilterMode={setFilterMode}
              search={searchEdge}
              setSearch={setSearchEdge}
              onSelect={applyEdge}
              onBack={() => setStep('choose')}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Подкомпоненты
// ============================================================

function StepChoose({
  character,
  onChoose,
  availableAttributesCount,
  availableSkillsCount,
}: {
  character: Character;
  onChoose: (step: Step) => void;
  availableAttributesCount: number;
  availableSkillsCount: number;
}) {
  return (
    <div>
      <p style={{ marginTop: 0 }}>
        Выберите тип повышения. У персонажа{' '}
        <strong>{character.profile.xp} XP</strong>.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <OptionButton
          title="⬆️ Повысить атрибут"
          subtitle={`Доступно для повышения: ${availableAttributesCount}. Не чаще одного раза за ранг.`}
          onClick={() => onChoose('attribute')}
        />
        <OptionButton
          title="⬆️ Повысить один навык"
          subtitle={`Навык будет повышен на одну ступень. Доступно навыков: ${availableSkillsCount}.`}
          onClick={() => onChoose('skill1')}
        />
        <OptionButton
          title="⬆️⬆️ Повысить два навыка"
          subtitle="Оба навыка должны быть ниже своих атрибутов."
          onClick={() => onChoose('skill2')}
        />
        <OptionButton
          title="✨ Изучить новый навык"
          subtitle="Новый навык начинается со значения d4."
          onClick={() => onChoose('new_skill')}
        />
        <OptionButton
          title="🎖️ Получить черту (Edge)"
          subtitle="Получить новую черту из каталога."
          onClick={() => onChoose('edge')}
        />
      </div>
    </div>
  );
}

function StepAttribute({
  character,
  filterMode,
  setFilterMode,
  selected,
  onSelect,
  onApply,
  onBack,
}: {
  character: Character;
  filterMode: 'available' | 'all';
  setFilterMode: (m: 'available' | 'all') => void;
  selected: AttributeName | null;
  onSelect: (a: AttributeName) => void;
  onApply: () => void;
  onBack: () => void;
}) {
  const all = Object.keys(character.attributes) as AttributeName[];
  const list =
    filterMode === 'available'
      ? all.filter((a) => canRaiseAttribute(character, a))
      : all;

  return (
    <div>
      <BackAndFilter
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        onBack={onBack}
      />
      <h3>Выберите атрибут</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {list.map((attr) => {
          const can = canRaiseAttribute(character, attr);
          const current = character.attributes[attr];
          const next = can ? nextDieType(current) : null;
          return (
            <button
              key={attr}
              disabled={!can}
              onClick={() => onSelect(attr)}
              style={{
                ...listItemStyle,
                backgroundColor:
                  selected === attr ? 'var(--accent-soft)' : 'var(--bg-primary)',
                borderColor:
                  selected === attr ? 'var(--accent)' : 'var(--border)',
                opacity: can ? 1 : 0.5,
                cursor: can ? 'pointer' : 'not-allowed',
              }}
            >
              <strong>{ATTRIBUTE_LABELS[attr]}</strong> — {current} →{' '}
              {next ?? '—'}
              {!can && (
                <span className="tiny" style={{ marginLeft: '8px' }}>
                  (недоступно)
                </span>
              )}
            </button>
          );
        })}
      </div>
      <ApplyButton onClick={onApply} disabled={!selected} />
    </div>
  );
}

function StepSkillSelect({
  title,
  hint,
  character,
  filterMode,
  setFilterMode,
  skills,
  selected,
  onSelect,
  onApply,
  onBack,
}: {
  title: string;
  hint: string;
  character: Character;
  filterMode: 'available' | 'all';
  setFilterMode: (m: 'available' | 'all') => void;
  skills: Skill[];
  selected: string | null;
  onSelect: (name: string) => void;
  onApply: () => void;
  onBack: () => void;
}) {
  const list =
    filterMode === 'available' ? skills.filter((s) => canRaiseSkill(s)) : skills;

  return (
    <div>
      <BackAndFilter
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        onBack={onBack}
      />
      <h3>{title}</h3>
      <p className="tiny" style={{ fontSize: '14px', marginBottom: '12px' }}>
        {hint}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {list.map((skill) => {
          const can = canRaiseSkill(skill);
          const next = can ? nextDieType(skill.die) : null;
          const isAbove = isSkillAboveAttribute(skill, character);
          return (
            <button
              key={skill.name}
              disabled={!can}
              onClick={() => onSelect(skill.name)}
              style={{
                ...listItemStyle,
                backgroundColor:
                  selected === skill.name
                    ? 'var(--accent-soft)'
                    : 'var(--bg-primary)',
                borderColor:
                  selected === skill.name ? 'var(--accent)' : 'var(--border)',
                opacity: can ? 1 : 0.5,
                cursor: can ? 'pointer' : 'not-allowed',
              }}
            >
              <strong>{skill.name}</strong> — {skill.die} → {next ?? '—'}
              <span className="tiny" style={{ marginLeft: '8px' }}>
                ({ATTRIBUTE_LABELS[skill.attribute]})
              </span>
              {isAbove && (
                <span
                  style={{
                    color: 'var(--warning)',
                    marginLeft: '8px',
                    fontSize: '12px',
                  }}
                >
                  выше атрибута
                </span>
              )}
            </button>
          );
        })}
      </div>
      <ApplyButton onClick={onApply} disabled={!selected} />
    </div>
  );
}

function StepTwoSkills({
  character,
  filterMode,
  setFilterMode,
  skillsBelowAttr,
  selected1,
  selected2,
  onSelect1,
  onSelect2,
  onApply,
  onBack,
}: {
  character: Character;
  filterMode: 'available' | 'all';
  setFilterMode: (m: 'available' | 'all') => void;
  skillsBelowAttr: Skill[];
  selected1: string | null;
  selected2: string | null;
  onSelect1: (n: string) => void;
  onSelect2: (n: string) => void;
  onApply: () => void;
  onBack: () => void;
}) {
  const list = filterMode === 'available' ? skillsBelowAttr : character.skills;
  const availableNames = new Set(skillsBelowAttr.map((s) => s.name));

  function renderSkillList(
    onSelect: (n: string) => void,
    selected: string | null,
    blocked: string | null
  ) {
    return list.map((skill) => {
      const can = availableNames.has(skill.name) && skill.name !== blocked;
      return (
        <button
          key={skill.name}
          disabled={!can}
          onClick={() => onSelect(skill.name)}
          style={{
            ...listItemStyle,
            backgroundColor:
              selected === skill.name
                ? 'var(--accent-soft)'
                : 'var(--bg-primary)',
            borderColor:
              selected === skill.name ? 'var(--accent)' : 'var(--border)',
            opacity: can ? 1 : 0.5,
            cursor: can ? 'pointer' : 'not-allowed',
          }}
        >
          <strong>{skill.name}</strong> — {skill.die}
          {!availableNames.has(skill.name) && (
            <span
              style={{
                color: 'var(--warning)',
                marginLeft: '8px',
                fontSize: '12px',
              }}
            >
              (нельзя: ≥ атрибута)
            </span>
          )}
        </button>
      );
    });
  }

  return (
    <div>
      <BackAndFilter
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        onBack={onBack}
      />
      <h3>Повысить два навыка</h3>
      <p className="tiny" style={{ fontSize: '14px', marginBottom: '12px' }}>
        Оба навыка должны быть <strong>ниже</strong> своих атрибутов.
      </p>

      <h4 style={{ marginBottom: '6px' }}>Первый навык</h4>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          marginBottom: '16px',
        }}
      >
        {renderSkillList(onSelect1, selected1, selected2)}
      </div>

      <h4 style={{ marginBottom: '6px' }}>Второй навык</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {renderSkillList(onSelect2, selected2, selected1)}
      </div>

      <ApplyButton onClick={onApply} disabled={!selected1 || !selected2} />
    </div>
  );
}

function StepNewSkill({
  name,
  setName,
  attribute,
  setAttribute,
  onApply,
  onBack,
}: {
  name: string;
  setName: (v: string) => void;
  attribute: AttributeName;
  setAttribute: (a: AttributeName) => void;
  onApply: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <button onClick={onBack} style={backButtonStyle}>
        ← Назад
      </button>
      <h3>Изучить новый навык</h3>
      <p className="tiny" style={{ fontSize: '14px' }}>
        Новый навык начинается со значения d4.
      </p>
      <label style={{ display: 'block', marginTop: '16px', marginBottom: '6px' }}>
        Название навыка:
      </label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Например, Верховая езда"
        className="input"
      />
      <label style={{ display: 'block', marginTop: '16px', marginBottom: '6px' }}>
        Атрибут:
      </label>
      <select
        value={attribute}
        onChange={(e) => setAttribute(e.target.value as AttributeName)}
        className="select"
      >
        {(Object.keys(ATTRIBUTE_LABELS) as AttributeName[]).map((a) => (
          <option key={a} value={a}>
            {ATTRIBUTE_LABELS[a]}
          </option>
        ))}
      </select>
      <ApplyButton onClick={onApply} disabled={!name.trim()} />
    </div>
  );
}

interface EdgeItem {
  edge: CatalogEdge;
  alreadyOwned: boolean;
  canTake: boolean;
  reasons: string[];
}

function StepEdge({
  items,
  filterMode,
  setFilterMode,
  search,
  setSearch,
  onSelect,
  onBack,
}: {
  items: EdgeItem[];
  filterMode: 'available' | 'all';
  setFilterMode: (m: 'available' | 'all') => void;
  search: string;
  setSearch: (v: string) => void;
  onSelect: (id: string, name: string, sourceId: string, description: string) => void;
  onBack: () => void;
}) {
  const allCount = items.length;

  return (
    <div>
      <BackAndFilter
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        onBack={onBack}
      />
      <h3>Выбрать черту (Edge)</h3>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Поиск черты…"
        className="input"
        style={{ marginBottom: '12px' }}
      />
      <div className="tiny" style={{ marginBottom: '8px' }}>
        Показано: {allCount}
        {filterMode === 'available' && ' (только доступные)'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map(({ edge, canTake, reasons }) => {
          const reqText = formatRequirements(edge.requirements);
          return (
            <button
              key={edge.id}
              disabled={!canTake}
              onClick={() => onSelect(edge.id, edge.name, edge.sourceId, edge.description)}
              style={{
                ...listItemStyle,
                opacity: canTake ? 1 : 0.55,
                cursor: canTake ? 'pointer' : 'not-allowed',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <strong>{edge.name}</strong>
                {!canTake && (
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--danger)',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                    }}
                  >
                    недоступно
                  </span>
                )}
              </div>

              {edge.description && (
                <div className="tiny" style={{ marginTop: '4px' }}>
                  {edge.description}
                </div>
              )}

              {reqText && (
                <div
                  className="tiny"
                  style={{
                    marginTop: '6px',
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <strong>Требования:</strong> {reqText}
                </div>
              )}

              {reasons.length > 0 && (
                <div
                  style={{
                    marginTop: '6px',
                    padding: '6px 10px',
                    backgroundColor: 'var(--danger-soft)',
                    color: 'var(--danger-text)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                  }}
                >
                  {reasons.map((r, i) => (
                    <div key={i}>• {r}</div>
                  ))}
                </div>
              )}
            </button>
          );
        })}
        {items.length === 0 && (
          <p className="muted">Ничего не найдено.</p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Вспомогательные
// ============================================================

function OptionButton({
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} style={optionButtonStyle}>
      <div
        style={{
          fontWeight: 'bold',
          fontSize: '15px',
          marginBottom: '4px',
        }}
      >
        {title}
      </div>
      <div className="tiny">{subtitle}</div>
    </button>
  );
}

function ApplyButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="btn btn-success"
      style={{
        marginTop: '20px',
        width: '100%',
        padding: '12px 24px',
        fontSize: '15px',
      }}
    >
      Применить повышение
    </button>
  );
}

function BackAndFilter({
  filterMode,
  setFilterMode,
  onBack,
}: {
  filterMode: 'available' | 'all';
  setFilterMode: (m: 'available' | 'all') => void;
  onBack: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}
    >
      <button onClick={onBack} style={backButtonStyle}>
        ← Назад
      </button>
      <div style={{ display: 'flex', gap: '4px' }}>
        <button
          onClick={() => setFilterMode('available')}
          style={{
            ...filterTabStyle,
            backgroundColor:
              filterMode === 'available'
                ? 'var(--accent)'
                : 'var(--bg-primary)',
            color:
              filterMode === 'available'
                ? 'var(--text-inverse)'
                : 'var(--text-primary)',
          }}
        >
          Доступные сейчас
        </button>
        <button
          onClick={() => setFilterMode('all')}
          style={{
            ...filterTabStyle,
            backgroundColor:
              filterMode === 'all' ? 'var(--accent)' : 'var(--bg-primary)',
            color:
              filterMode === 'all'
                ? 'var(--text-inverse)'
                : 'var(--text-primary)',
          }}
        >
          Все
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Стили
// ============================================================

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const dialogStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  borderRadius: 'var(--radius-lg)',
  width: '90%',
  maxWidth: '680px',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: 'var(--shadow-lg)',
  border: '1px solid var(--border)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: '1px solid var(--border)',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  fontSize: '24px',
  cursor: 'pointer',
  color: 'var(--text-secondary)',
  padding: '0 4px',
  lineHeight: 1,
};

const listItemStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '12px 16px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  textAlign: 'left',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'background-color 0.15s',
};

const optionButtonStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '16px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background-color 0.15s',
};

const backButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--accent)',
  cursor: 'pointer',
  fontSize: '14px',
  padding: '4px 0',
};

const filterTabStyle: React.CSSProperties = {
  padding: '6px 12px',
  border: '1px solid var(--accent)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  fontSize: '13px',
};