import { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { Character, Skill, AttributeName } from '../models/character';
import type { DieType } from '../mechanics/dice';
import type { CustomSkill } from '../types/custom-content';
import { SKILLS, type SkillDefinition } from '../data/skills';
import { useCustomContent } from '../hooks/useCustomContent';
import { SourceBadge } from './SourceBadge';

const DIE_OPTIONS: DieType[] = ['d4', 'd6', 'd8', 'd10', 'd12'];

const ATTRIBUTE_LABELS: Record<AttributeName, string> = {
  agility: 'Ловкость',
  smarts: 'Смекалка',
  spirit: 'Характер',
  strength: 'Сила',
  vigor: 'Выносливость',
};

/**
 * Преобразует кастомный навык в SkillDefinition.
 */
function customToSkillDefinition(c: CustomSkill): SkillDefinition {
  return {
    id: c.id,
    name: c.name,
    attribute: c.attribute,
    isCore: c.isCore,
    description: c.description,
    hasSpecialization: c.hasSpecialization,
    sourceId: 'custom',
  };
}

interface Props {
  character: Character;
  onChange: React.Dispatch<React.SetStateAction<Character | null>>;
  hasRolled: boolean;
  onRollSkill: (skillName: string) => void;
  totalPenalty: number;
}

/**
 * Панель навыков персонажа.
 * Показывает список навыков, позволяет менять кубик, модификатор,
 * бросить проверку, а также добавлять/удалять навыки
 * (включая кастомные из Контента).
 */
export function SkillsPanel({
  character,
  onChange,
  hasRolled,
  onRollSkill,
  totalPenalty,
}: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState('');

  const { customSkills } = useCustomContent();

  // Объединяем стандартные и кастомные навыки.
  const allSkills = useMemo(() => {
    const customAsDefs = (customSkills ?? []).map(customToSkillDefinition);
    return [...SKILLS, ...customAsDefs];
  }, [customSkills]);

  // Навык идентифицируется по имени.
  const ownedNames = new Set(character.skills.map((s) => s.name));
  const availableSkills = allSkills.filter((s) => !ownedNames.has(s.name));

  function handleAdd() {
    if (!selectedSkillId) return;
    const def = allSkills.find((s) => s.id === selectedSkillId);
    if (!def) return;

    const newSkill: Skill = {
      name: def.name,
      attribute: def.attribute,
      die: 'd4',
      modifier: 0,
      isCore: def.isCore,
      sourceId: def.sourceId,
    };

    onChange((c) => (c ? { ...c, skills: [...c.skills, newSkill] } : c));
    setSelectedSkillId('');
    setIsAdding(false);
  }

  function handleRemove(skill: Skill) {
    if (!confirm(`Удалить навык «${skill.name}»?`)) return;
    onChange((c) =>
      c ? { ...c, skills: c.skills.filter((s) => s.name !== skill.name) } : c
    );
  }

  function setSkillDie(skillName: string, die: DieType) {
    onChange((c) =>
      c
        ? {
            ...c,
            skills: c.skills.map((s) =>
              s.name === skillName ? { ...s, die } : s
            ),
          }
        : c
    );
  }

  function setSkillModifier(skillName: string, modifier: number) {
    onChange((c) =>
      c
        ? {
            ...c,
            skills: c.skills.map((s) =>
              s.name === skillName ? { ...s, modifier } : s
            ),
          }
        : c
    );
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          marginTop: '24px',
        }}
      >
        <h2 style={{ margin: 0 }}>Навыки</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`btn ${isAdding ? '' : 'btn-primary'}`}
          style={{
            fontSize: '13px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {isAdding ? (
            <>
              <X size={14} />
              <span>Отмена</span>
            </>
          ) : (
            <>
              <Plus size={14} />
              <span>Добавить навык</span>
            </>
          )}
        </button>
      </div>

      {isAdding && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <select
            value={selectedSkillId}
            onChange={(e) => setSelectedSkillId(e.target.value)}
            className="select"
            style={{ flex: 1 }}
          >
            <option value="">— выберите навык —</option>
            {availableSkills.map((s) => {
              const isCustom = s.sourceId === 'custom';
              return (
                <option key={s.id} value={s.id}>
                  {s.name} ({ATTRIBUTE_LABELS[s.attribute]})
                  {s.isCore ? ' · базовый' : ''}
                  {isCustom ? ' [CUSTOM]' : ''}
                </option>
              );
            })}
          </select>
          <button
            onClick={handleAdd}
            disabled={!selectedSkillId}
            className="btn btn-success"
          >
            Добавить
          </button>
        </div>
      )}

      {hasRolled && (
        <div
          className="tiny"
          style={{
            padding: '8px 12px',
            backgroundColor: 'var(--warning-soft)',
            color: 'var(--warning-text)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '8px',
            fontSize: '13px',
          }}
        >
          Действие уже выполнено. Нажмите «Следующее действие» ниже,
          чтобы разблокировать броски.
        </div>
      )}

      {character.skills.length === 0 ? (
        <p className="muted">У персонажа нет навыков.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {character.skills.map((skill) => (
            <div
              key={skill.name}
              className="panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                opacity: hasRolled ? 0.7 : 1,
              }}
            >
              <span style={{ flex: 1 }}>
                <strong>{skill.name}</strong>
                <span
                  className="tiny"
                  style={{ marginLeft: '8px', fontSize: '13px' }}
                >
                  ({ATTRIBUTE_LABELS[skill.attribute]})
                </span>
                {skill.isCore && (
                  <span
                    className="tiny"
                    style={{
                      marginLeft: '8px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: 'var(--accent-text)',
                    }}
                  >
                    CORE
                  </span>
                )}
                {skill.sourceId === 'custom' && (
                  <span style={{ marginLeft: '6px' }}>
                    <SourceBadge sourceId="custom" small />
                  </span>
                )}
                {totalPenalty > 0 && (
                  <span
                    style={{
                      color: 'var(--danger)',
                      marginLeft: '8px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    штраф −{totalPenalty}
                  </span>
                )}
              </span>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Модификатор к броску"
              >
                <span className="tiny" style={{ fontSize: '11px' }}>мод.</span>
                <input
                  type="number"
                  value={skill.modifier}
                  onChange={(e) =>
                    setSkillModifier(skill.name, parseInt(e.target.value) || 0)
                  }
                  className="input"
                  style={{
                    width: '50px',
                    padding: '4px 6px',
                    fontSize: '13px',
                    textAlign: 'center',
                  }}
                />
              </div>

              <select
                value={skill.die}
                onChange={(e) =>
                  setSkillDie(skill.name, e.target.value as DieType)
                }
                className="select"
                style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  padding: '6px',
                  width: 'auto',
                }}
              >
                {DIE_OPTIONS.map((die) => (
                  <option key={die} value={die}>
                    {die}
                  </option>
                ))}
              </select>

              <button
                onClick={() => onRollSkill(skill.name)}
                className="btn btn-primary"
                disabled={hasRolled}
                style={
                  hasRolled
                    ? { opacity: 0.5, cursor: 'not-allowed' }
                    : undefined
                }
                title={hasRolled ? 'Сначала завершите текущее действие' : undefined}
              >
                Бросить
              </button>

              <button
                onClick={() => handleRemove(skill)}
                title="Удалить навык"
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
    </>
  );
}