import { useState, useEffect } from 'react';
import { Plus, Save, X } from 'lucide-react';
import type { CustomHindrance } from '../../types/custom-content';
import type { Rank } from '../../types/requirements';
import type { HindranceSeverity } from '../../data/hindrances';
import { addCustomHindrance, updateCustomHindrance } from '../../db/customContent';

/**
 * Значения severity в этом проекте: 'minor' | 'major'.
 * Отображаются по-русски как «Мелкий» / «Крупный».
 */
const SEVERITY_OPTIONS: { value: HindranceSeverity; label: string }[] = [
  { value: 'minor' as HindranceSeverity, label: 'Мелкий (Minor)' },
  { value: 'major' as HindranceSeverity, label: 'Крупный (Major)' },
];

const RANKS: Rank[] = ['Новичок', 'Закалённый', 'Ветеран', 'Герой', 'Легенда'];

interface Props {
  editing: CustomHindrance | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function HindranceForm({ editing, onSaved, onCancel }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<HindranceSeverity>(SEVERITY_OPTIONS[0].value);
  const [minRank, setMinRank] = useState<Rank | ''>('');
  const [parryBonus, setParryBonus] = useState(0);
  const [toughnessBonus, setToughnessBonus] = useState(0);
  const [charismaBonus, setCharismaBonus] = useState(0);
  const [paceBonus, setPaceBonus] = useState(0);
  const [skillName, setSkillName] = useState('');
  const [skillBonus, setSkillBonus] = useState(0);
  const [skillBonuses, setSkillBonuses] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setDescription(editing.description);
      setSeverity(editing.severity);
      setMinRank(editing.requirements?.minRank ?? '');
      setParryBonus(editing.effects.parryBonus ?? 0);
      setToughnessBonus(editing.effects.toughnessBonus ?? 0);
      setCharismaBonus(editing.effects.charismaBonus ?? 0);
      setPaceBonus(editing.effects.paceBonus ?? 0);
      setSkillBonuses(editing.effects.skillBonus ?? {});
    } else {
      resetForm();
    }
  }, [editing]);

  function resetForm() {
    setName('');
    setDescription('');
    setSeverity(SEVERITY_OPTIONS[0].value);
    setMinRank('');
    setParryBonus(0);
    setToughnessBonus(0);
    setCharismaBonus(0);
    setPaceBonus(0);
    setSkillName('');
    setSkillBonus(0);
    setSkillBonuses({});
  }

  function addSkillBonus() {
    if (!skillName.trim()) return;
    setSkillBonuses({ ...skillBonuses, [skillName.trim()]: skillBonus });
    setSkillName('');
    setSkillBonus(0);
  }

  function removeSkillBonus(key: string) {
    const copy = { ...skillBonuses };
    delete copy[key];
    setSkillBonuses(copy);
  }

  async function handleSave() {
    if (!name.trim()) {
      alert('Введите название изъяна');
      return;
    }

    setIsSaving(true);
    try {
      const effects = {
        ...(parryBonus !== 0 ? { parryBonus } : {}),
        ...(toughnessBonus !== 0 ? { toughnessBonus } : {}),
        ...(charismaBonus !== 0 ? { charismaBonus } : {}),
        ...(paceBonus !== 0 ? { paceBonus } : {}),
        ...(Object.keys(skillBonuses).length > 0
          ? { skillBonus: skillBonuses }
          : {}),
      };

      const requirements = minRank ? { minRank } : undefined;

      if (editing) {
        await updateCustomHindrance(editing.id, {
          name: name.trim(),
          description: description.trim(),
          severity,
          effects,
          requirements,
        });
      } else {
        await addCustomHindrance({
          name: name.trim(),
          description: description.trim(),
          severity,
          effects,
          requirements,
        });
      }

      resetForm();
      onSaved();
    } catch (err) {
      console.error(err);
      alert('Не удалось сохранить изъян.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="panel" style={{ marginTop: '16px' }}>
      <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px' }}>
        {editing ? 'Редактировать изъян' : 'Новый изъян'}
      </h3>

      <label style={labelStyle}>Название *</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Например, Аллергия"
        className="input"
      />

      <label style={labelStyle}>Описание</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Что даёт этот изъян?"
        className="input"
        rows={3}
        style={{ resize: 'vertical', fontFamily: 'inherit' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label style={labelStyle}>Степень</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as HindranceSeverity)}
            className="select"
          >
            {SEVERITY_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Минимальный ранг</label>
          <select
            value={minRank}
            onChange={(e) => setMinRank(e.target.value as Rank | '')}
            className="select"
          >
            <option value="">— любой —</option>
            {RANKS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      <label style={labelStyle}>Механические эффекты</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        <NumField label="Защита" value={parryBonus} onChange={setParryBonus} />
        <NumField label="Стойкость" value={toughnessBonus} onChange={setToughnessBonus} />
        <NumField label="Харизма" value={charismaBonus} onChange={setCharismaBonus} />
        <NumField label="Шаг" value={paceBonus} onChange={setPaceBonus} />
      </div>

      <label style={labelStyle}>Бонусы к навыкам</label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
        <input
          type="text"
          value={skillName}
          onChange={(e) => setSkillName(e.target.value)}
          placeholder="Название навыка"
          className="input"
          style={{ flex: 1 }}
        />
        <input
          type="number"
          value={skillBonus}
          onChange={(e) => setSkillBonus(parseInt(e.target.value) || 0)}
          className="input"
          style={{ width: '80px' }}
        />
        <button onClick={addSkillBonus} className="btn btn-primary" type="button">
          <Plus size={14} />
        </button>
      </div>

      {Object.keys(skillBonuses).length > 0 && (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {Object.entries(skillBonuses).map(([key, val]) => (
            <div
              key={key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 8px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
              }}
            >
              <span><strong>{key}</strong>: {val > 0 ? '+' : ''}{val}</span>
              <button
                onClick={() => removeSkillBonus(key)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--danger)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '20px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} className="btn" disabled={isSaving}>
          Отмена
        </button>
        <button onClick={handleSave} className="btn btn-success" disabled={isSaving}>
          <Save size={14} />
          <span>{isSaving ? 'Сохранение…' : 'Сохранить'}</span>
        </button>
      </div>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="tiny" style={{ marginBottom: '4px' }}>{label}</div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="input"
        style={{ textAlign: 'center' }}
      />
    </div>
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