import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import type { CustomSkill } from '../../types/custom-content';
import type { AttributeName } from '../../models/character';
import { addCustomSkill, updateCustomSkill } from '../../db/customContent';

const ATTRIBUTES: { value: AttributeName; label: string }[] = [
  { value: 'agility', label: 'Ловкость' },
  { value: 'smarts', label: 'Смекалка' },
  { value: 'spirit', label: 'Характер' },
  { value: 'strength', label: 'Сила' },
  { value: 'vigor', label: 'Выносливость' },
];

interface Props {
  editing: CustomSkill | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function SkillForm({ editing, onSaved, onCancel }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [attribute, setAttribute] = useState<AttributeName>('smarts');
  const [isCore, setIsCore] = useState(false);
  const [hasSpecialization, setHasSpecialization] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setDescription(editing.description);
      setAttribute(editing.attribute);
      setIsCore(editing.isCore);
      setHasSpecialization(editing.hasSpecialization ?? false);
    } else {
      resetForm();
    }
  }, [editing]);

  function resetForm() {
    setName('');
    setDescription('');
    setAttribute('smarts');
    setIsCore(false);
    setHasSpecialization(false);
  }

  async function handleSave() {
    if (!name.trim()) {
      alert('Введите название навыка');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        name: name.trim(),
        description: description.trim(),
        attribute,
        isCore,
        hasSpecialization,
      };

      if (editing) {
        await updateCustomSkill(editing.id, data);
      } else {
        await addCustomSkill(data);
      }

      resetForm();
      onSaved();
    } catch (err) {
      console.error(err);
      alert('Не удалось сохранить навык.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="panel" style={{ marginTop: '16px' }}>
      <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px' }}>
        {editing ? 'Редактировать навык' : 'Новый навык'}
      </h3>

      <label style={labelStyle}>Название *</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Например, Взлом"
        className="input"
      />

      <label style={labelStyle}>Описание</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Что позволяет делать этот навык?"
        className="input"
        rows={3}
        style={{ resize: 'vertical', fontFamily: 'inherit' }}
      />

      <label style={labelStyle}>Базовый атрибут</label>
      <select
        value={attribute}
        onChange={(e) => setAttribute(e.target.value as AttributeName)}
        className="select"
      >
        {ATTRIBUTES.map((a) => (
          <option key={a.value} value={a.value}>{a.label}</option>
        ))}
      </select>

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
          checked={isCore}
          onChange={(e) => setIsCore(e.target.checked)}
        />
        <span>Базовый навык (Core Skill)</span>
      </label>

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
          checked={hasSpecialization}
          onChange={(e) => setHasSpecialization(e.target.checked)}
        />
        <span>Имеет специализации (например, «Стрельба: луки»)</span>
      </label>

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

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginTop: '12px',
  marginBottom: '4px',
  fontSize: '13px',
  fontWeight: 'bold',
  color: 'var(--text-primary)',
};