import { useMemo, useState } from 'react';
import { Plus, X, Zap } from 'lucide-react';
import type { Character, PowerInstance } from '../models/character';
import type { CustomPower } from '../types/custom-content';
import { useCustomContent } from '../hooks/useCustomContent';
import { SourceBadge } from './SourceBadge';

/**
 * Генерирует уникальный id для экземпляра силы на персонаже.
 */
function generatePowerInstanceId(): string {
  return (
    'pow-' +
    Math.random().toString(36).substring(2, 10) +
    Date.now().toString(36)
  );
}

/**
 * Преобразует каталог CustomPower в экземпляр PowerInstance
 * с указанным кастующим навыком.
 */
function customToInstance(c: CustomPower, castingSkill: string): PowerInstance {
  return {
    id: generatePowerInstanceId(),
    powerId: c.id,
    name: c.name,
    description: c.description,
    rank: c.rank,
    cost: c.cost,
    range: c.range,
    duration: c.duration,
    aspects: c.aspects,
    castingSkill,
    sourceId: 'custom',
  };
}

interface Props {
  character: Character;
  onChange: React.Dispatch<React.SetStateAction<Character | null>>;
  hasRolled: boolean;
  onRollPower: (powerInstanceId: string) => void;
  totalPenalty: number;
}

/**
 * Панель сил персонажа.
 *
 * Позволяет:
 *  - добавлять силы из каталога кастомного контента (вкладка «Контент»);
 *  - назначать каждой силе кастующий навык (по имени навыка персонажа);
 *  - бросать проверку силы (использует кубик и модификатор кастующего навыка,
 *    либо d4 −2, если навык не найден);
 *  - удалять силы с персонажа.
 */
export function PowersPanel({
  character,
  onChange,
  hasRolled,
  onRollPower,
  totalPenalty,
}: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedPowerId, setSelectedPowerId] = useState('');
  const [castingSkill, setCastingSkill] = useState('');

  const { customPowers } = useCustomContent();

  const powers = character.powers ?? [];

  const ownedPowerIds = useMemo(
    () =>
      new Set(
        powers
          .map((p) => p.powerId)
          .filter((id): id is string => typeof id === 'string' && id.length > 0)
      ),
    [powers]
  );

  const availablePowers = useMemo(
    () => (customPowers ?? []).filter((p) => !ownedPowerIds.has(p.id)),
    [customPowers, ownedPowerIds]
  );

  const characterSkillNames = character.skills.map((s) => s.name);

  function handleAdd() {
    if (!selectedPowerId) return;
    const def = (customPowers ?? []).find((p) => p.id === selectedPowerId);
    if (!def) return;

    const skill = castingSkill.trim();
    const instance = customToInstance(def, skill);

    onChange((c) =>
      c ? { ...c, powers: [...(c.powers ?? []), instance] } : c
    );
    setSelectedPowerId('');
    setCastingSkill('');
    setIsAdding(false);
  }

  function handleRemove(power: PowerInstance) {
    if (!confirm(`Удалить силу «${power.name}»?`)) return;
    onChange((c) =>
      c
        ? { ...c, powers: (c.powers ?? []).filter((p) => p.id !== power.id) }
        : c
    );
  }

  function setPowerCastingSkill(id: string, skill: string) {
    onChange((c) =>
      c
        ? {
            ...c,
            powers: (c.powers ?? []).map((p) =>
              p.id === id ? { ...p, castingSkill: skill } : p
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
        <h2
          style={{
            margin: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Zap size={20} />
          Силы
        </h2>
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
              <span>Добавить силу</span>
            </>
          )}
        </button>
      </div>

      {isAdding && (
        <div className="panel" style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>Сила из каталога</label>
          <select
            value={selectedPowerId}
            onChange={(e) => setSelectedPowerId(e.target.value)}
            className="select"
          >
            <option value="">— выберите силу —</option>
            {availablePowers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.rank} · {p.cost} ОД [CUSTOM]
              </option>
            ))}
          </select>
          {availablePowers.length === 0 && (
            <p className="tiny" style={{ marginTop: '6px' }}>
              Нет доступных сил. Создайте их на вкладке «Контент»
              (тип контента — «Силы»).
            </p>
          )}

          <label style={labelStyle}>
            Кастующий навык (имя навыка персонажа)
          </label>
          <input
            type="text"
            value={castingSkill}
            onChange={(e) => setCastingSkill(e.target.value)}
            placeholder="Например: Магия"
            className="input"
            list="powers-casting-skill-suggestions"
          />
          <datalist id="powers-casting-skill-suggestions">
            {characterSkillNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
          <p className="tiny" style={{ marginTop: '4px' }}>
            Если такого навыка у персонажа нет — бросок пойдёт как
            неподготовленный (d4 −2).
          </p>

          <div
            style={{
              marginTop: '12px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
            }}
          >
            <button
              onClick={() => {
                setIsAdding(false);
                setSelectedPowerId('');
                setCastingSkill('');
              }}
              className="btn"
            >
              Отмена
            </button>
            <button
              onClick={handleAdd}
              disabled={!selectedPowerId}
              className="btn btn-success"
            >
              Добавить
            </button>
          </div>
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

      {powers.length === 0 ? (
        <p className="muted">У персонажа нет сил.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {powers.map((power) => (
            <div
              key={power.id}
              className="panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                opacity: hasRolled ? 0.7 : 1,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ flex: 1, minWidth: '180px' }}>
                  <strong>{power.name}</strong>
                  {power.sourceId === 'custom' && (
                    <span style={{ marginLeft: '6px' }}>
                      <SourceBadge sourceId="custom" small />
                    </span>
                  )}
                  <span
                    className="tiny"
                    style={{ marginLeft: '8px', fontSize: '12px' }}
                  >
                    {power.rank} · {power.cost} ОД · {power.range} ·{' '}
                    {power.duration}
                  </span>
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

                <button
                  onClick={() => onRollPower(power.id)}
                  className="btn btn-primary"
                  disabled={hasRolled}
                  style={
                    hasRolled
                      ? { opacity: 0.5, cursor: 'not-allowed' }
                      : undefined
                  }
                  title={
                    hasRolled
                      ? 'Сначала завершите текущее действие'
                      : undefined
                  }
                >
                  Бросить
                </button>

                <button
                  onClick={() => handleRemove(power)}
                  title="Удалить силу"
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

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexWrap: 'wrap',
                }}
              >
                <span className="tiny" style={{ fontSize: '11px' }}>
                  кастующий навык:
                </span>
                <input
                  type="text"
                  value={power.castingSkill}
                  onChange={(e) =>
                    setPowerCastingSkill(power.id, e.target.value)
                  }
                  className="input"
                  style={{
                    width: '200px',
                    padding: '4px 6px',
                    fontSize: '13px',
                  }}
                  list="powers-casting-skill-suggestions"
                  placeholder="Например: Магия"
                />
              </div>

              {power.description && (
                <div
                  className="tiny"
                  style={{ fontSize: '12px', lineHeight: 1.4 }}
                >
                  {power.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginTop: '8px',
  marginBottom: '4px',
  fontSize: '13px',
  fontWeight: 'bold',
  color: 'var(--text-primary)',
};