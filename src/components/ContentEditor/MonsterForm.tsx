import { useState, useEffect } from 'react';
import { Plus, Save, X } from 'lucide-react';
import type { CustomMonster } from '../../types/custom-content';
import type {
  MonsterCategory,
  MonsterRole,
  MonsterRank,
  MonsterSkill,
  MonsterAbility,
} from '../../types/bestiary';
import { addCustomMonster, updateCustomMonster } from '../../db/customContent';

const CATEGORIES: MonsterCategory[] = [
  'Животные',
  'Чудовища',
  'Нежить',
  'Демоны',
  'Люди',
  'Культы',
  'Уникальные существа',
];

const ROLES: { value: MonsterRole; label: string }[] = [
  { value: 'статист', label: 'Статист' },
  { value: 'приспешник', label: 'Приспешник' },
  { value: 'правая_рука', label: 'Правая рука' },
  { value: 'дикая_карта', label: 'Дикая карта' },
  { value: 'существо', label: 'Существо' },
];

const RANKS: MonsterRank[] = ['Новичок', 'Закалённый', 'Ветеран', 'Герой', 'Легенда'];

const DIE_OPTIONS = ['d4', 'd6', 'd8', 'd10', 'd12'];

interface Props {
  editing: CustomMonster | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function MonsterForm({ editing, onSaved, onCancel }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MonsterCategory>('Чудовища');
  const [role, setRole] = useState<MonsterRole>('статист');
  const [rank, setRank] = useState<MonsterRank>('Новичок');
  const [isWildCard, setIsWildCard] = useState(false);
  const [attributes, setAttributes] = useState({
    agility: 'd6',
    smarts: 'd6',
    spirit: 'd6',
    strength: 'd6',
    vigor: 'd6',
  });
  const [skills, setSkills] = useState<MonsterSkill[]>([]);
  const [pace, setPace] = useState(6);
  const [parry, setParry] = useState(5);
  const [toughness, setToughness] = useState('5');
  const [charisma, setCharisma] = useState<number | ''>('');
  const [abilities, setAbilities] = useState<MonsterAbility[]>([]);
  const [tags, setTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // --- Загрузка при редактировании ---
  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setDescription(editing.description);
      setCategory(editing.category);
      setRole(editing.role);
      setRank(editing.rank);
      setIsWildCard(editing.isWildCard);
      setAttributes(editing.attributes);
      setSkills(editing.skills);
      setPace(editing.pace);
      setParry(editing.parry);
      setToughness(editing.toughness);
      setCharisma(editing.charisma ?? '');
      setAbilities(editing.abilities);
      setTags((editing.tags ?? []).join(', '));
    } else {
      resetForm();
    }
  }, [editing]);

  function resetForm() {
    setName('');
    setDescription('');
    setCategory('Чудовища');
    setRole('статист');
    setRank('Новичок');
    setIsWildCard(false);
    setAttributes({
      agility: 'd6',
      smarts: 'd6',
      spirit: 'd6',
      strength: 'd6',
      vigor: 'd6',
    });
    setSkills([]);
    setPace(6);
    setParry(5);
    setToughness('5');
    setCharisma('');
    setAbilities([]);
    setTags('');
  }

  // --- Навыки ---
  function addSkill() {
    setSkills([...skills, { name: '', die: 'd6' }]);
  }
  function updateSkill(index: number, updates: Partial<MonsterSkill>) {
    setSkills(skills.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  }
  function removeSkill(index: number) {
    setSkills(skills.filter((_, i) => i !== index));
  }

  // --- Особенности ---
  function addAbility() {
    setAbilities([...abilities, { name: '', description: '' }]);
  }
  function updateAbility(index: number, updates: Partial<MonsterAbility>) {
    setAbilities(abilities.map((a, i) => (i === index ? { ...a, ...updates } : a)));
  }
  function removeAbility(index: number) {
    setAbilities(abilities.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!name.trim()) {
      alert('Введите имя монстра');
      return;
    }

    setIsSaving(true);
    try {
      const cleanSkills = skills.filter((s) => s.name.trim());
      const cleanAbilities = abilities.filter((a) => a.name.trim());
      const cleanTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const data = {
        name: name.trim(),
        description: description.trim(),
        category,
        role,
        rank,
        isWildCard,
        attributes,
        skills: cleanSkills,
        pace,
        parry,
        toughness,
        charisma: charisma === '' ? undefined : Number(charisma),
        abilities: cleanAbilities,
        tags: cleanTags,
      };

      if (editing) {
        await updateCustomMonster(editing.id, data);
      } else {
        await addCustomMonster(data);
      }

      resetForm();
      onSaved();
    } catch (err) {
      console.error(err);
      alert('Не удалось сохранить монстра.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="panel" style={{ marginTop: '16px' }}>
      <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px' }}>
        {editing ? 'Редактировать монстра / НПС' : 'Новый монстр / НПС'}
      </h3>

      <label style={labelStyle}>Имя *</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Например, Гоблин-шаман"
        className="input"
      />

      <label style={labelStyle}>Описание</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Внешний вид, повадки, роль в истории"
        className="input"
        rows={3}
        style={{ resize: 'vertical', fontFamily: 'inherit' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <div>
          <label style={labelStyle}>Категория</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as MonsterCategory)}
            className="select"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Роль</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as MonsterRole)}
            className="select"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Ранг</label>
          <select
            value={rank}
            onChange={(e) => setRank(e.target.value as MonsterRank)}
            className="select"
          >
            {RANKS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      <label
        style={{
          ...labelStyle,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={isWildCard}
          onChange={(e) => setIsWildCard(e.target.checked)}
        />
        <span>Дикая карта (босс, уникальный НПС)</span>
      </label>

      {/* --- Атрибуты --- */}
      <label style={labelStyle}>Атрибуты</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
        {(['agility', 'smarts', 'spirit', 'strength', 'vigor'] as const).map((attr) => (
          <div key={attr}>
            <div className="tiny" style={{ marginBottom: '4px', textAlign: 'center' }}>
              {attr === 'agility' ? 'Лов.' :
               attr === 'smarts' ? 'Смек.' :
               attr === 'spirit' ? 'Хар.' :
               attr === 'strength' ? 'Сила' : 'Вын.'}
            </div>
            <select
              value={attributes[attr]}
              onChange={(e) => setAttributes({ ...attributes, [attr]: e.target.value })}
              className="select"
              style={{ textAlign: 'center', fontWeight: 'bold' }}
            >
              {DIE_OPTIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* --- Производные --- */}
      <label style={labelStyle}>Производные параметры</label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
        <NumField label="Шаг" value={pace} onChange={setPace} />
        <NumField label="Защита" value={parry} onChange={setParry} />
        <div>
          <div className="tiny" style={{ marginBottom: '4px' }}>Стойкость</div>
          <input
            type="text"
            value={toughness}
            onChange={(e) => setToughness(e.target.value)}
            placeholder="6+2"
            className="input"
            style={{ textAlign: 'center' }}
          />
        </div>
        <NumField
          label="Харизма (опц.)"
          value={charisma === '' ? 0 : charisma}
          onChange={(v) => setCharisma(v)}
        />
      </div>

      {/* --- Навыки --- */}
      <label style={labelStyle}>
        Навыки
        <button
          onClick={addSkill}
          className="btn"
          type="button"
          style={{ marginLeft: '8px', padding: '2px 8px', fontSize: '12px' }}
        >
          <Plus size={12} />
        </button>
      </label>
      {skills.length === 0 ? (
        <div className="tiny">Навыки не заданы.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {skills.map((skill, i) => (
            <div key={i} style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={skill.name}
                onChange={(e) => updateSkill(i, { name: e.target.value })}
                placeholder="Драка"
                className="input"
                style={{ flex: 1 }}
              />
              <select
                value={skill.die}
                onChange={(e) => updateSkill(i, { die: e.target.value })}
                className="select"
                style={{ width: '80px' }}
              >
                {DIE_OPTIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <button
                onClick={() => removeSkill(i)}
                className="btn"
                type="button"
                style={{ padding: '4px 8px' }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* --- Особенности --- */}
      <label style={labelStyle}>
        Особенности
        <button
          onClick={addAbility}
          className="btn"
          type="button"
          style={{ marginLeft: '8px', padding: '2px 8px', fontSize: '12px' }}
        >
          <Plus size={12} />
        </button>
      </label>
      {abilities.length === 0 ? (
        <div className="tiny">Особенности не заданы.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {abilities.map((ability, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  value={ability.name}
                  onChange={(e) => updateAbility(i, { name: e.target.value })}
                  placeholder="Название (например, Броня +2)"
                  className="input"
                  style={{ flex: 1 }}
                />
                <button
                  onClick={() => removeAbility(i)}
                  className="btn"
                  type="button"
                  style={{ padding: '4px 8px' }}
                >
                  <X size={14} />
                </button>
              </div>
              <textarea
                value={ability.description}
                onChange={(e) => updateAbility(i, { description: e.target.value })}
                placeholder="Описание эффекта"
                className="input"
                rows={2}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
          ))}
        </div>
      )}

      {/* --- Теги --- */}
      <label style={labelStyle}>Теги (через запятую)</label>
      <input
        type="text"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="лес, яд, ночь"
        className="input"
      />

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