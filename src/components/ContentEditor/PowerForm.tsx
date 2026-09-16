import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import type { CustomPower } from '../../types/custom-content';
import type { Rank } from '../../types/requirements';
import { addCustomPower, updateCustomPower } from '../../db/customContent';

const RANKS: Rank[] = ['Новичок', 'Закалённый', 'Ветеран', 'Герой', 'Легенда'];

interface Props {
  editing: CustomPower | null;
  onSaved: () => void;
  onCancel: () => void;
}

export function PowerForm({ editing, onSaved, onCancel }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rank, setRank] = useState<Rank>('Новичок');
  const [cost, setCost] = useState('');
  const [range, setRange] = useState('');
  const [duration, setDuration] = useState('');
  const [aspects, setAspects] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setDescription(editing.description);
      setRank(editing.rank);
      setCost(editing.cost);
      setRange(editing.range);
      setDuration(editing.duration);
      setAspects(editing.aspects ?? '');
    } else {
      resetForm();
    }
  }, [editing]);

  function resetForm() {
    setName('');
    setDescription('');
    setRank('Новичок');
    setCost('');
    setRange('');
    setDuration('');
    setAspects('');
  }

  async function handleSave() {
    if (!name.trim()) {
      alert('Введите название силы');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        name: name.trim(),
        description: description.trim(),
        rank,
        cost: cost.trim(),
        range: range.trim(),
        duration: duration.trim(),
        aspects: aspects.trim() || undefined,
      };

      if (editing) {
        await updateCustomPower(editing.id, data);
      } else {
        await addCustomPower(data);
      }

      resetForm();
      onSaved();
    } catch (err) {
      console.error(err);
      alert('Не удалось сохранить силу.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="panel" style={{ marginTop: '16px' }}>
      <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px' }}>
        {editing ? 'Редактировать силу' : 'Новая сила'}
      </h3>

      <label style={labelStyle}>Название *</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Например, Огненный шар"
        className="input"
      />

      <label style={labelStyle}>Описание</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Что делает эта сила?"
        className="input"
        rows={3}
        style={{ resize: 'vertical', fontFamily: 'inherit' }}
      />

      <label style={labelStyle}>Ранг</label>
      <select
        value={rank}
        onChange={(e) => setRank(e.target.value as Rank)}
        className="select"
      >
        {RANKS.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <div>
          <label style={labelStyle}>Стоимость (ОД)</label>
          <input
            type="text"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="2"
            className="input"
            style={{ textAlign: 'center' }}
          />
        </div>
        <div>
          <label style={labelStyle}>Дистанция</label>
          <input
            type="text"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            placeholder="12/24/48"
            className="input"
            style={{ textAlign: 'center' }}
          />
        </div>
        <div>
          <label style={labelStyle}>Длительность</label>
          <input
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Мгновенно"
            className="input"
            style={{ textAlign: 'center' }}
          />
        </div>
      </div>

      <label style={labelStyle}>Аспекты (опционально)</label>
      <input
        type="text"
        value={aspects}
        onChange={(e) => setAspects(e.target.value)}
        placeholder="Например: огонь, свет"
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

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginTop: '12px',
  marginBottom: '4px',
  fontSize: '13px',
  fontWeight: 'bold',
  color: 'var(--text-primary)',
};