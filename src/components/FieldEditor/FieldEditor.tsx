import { useEffect, useRef, useState, useMemo } from 'react';
import { Rnd } from 'react-rnd';
import {
  Plus,
  Save,
  FolderOpen,
  Image as ImageIcon,
  Trash2,
  Search,
  Target,
} from 'lucide-react';
import type { FieldMap, FieldDefinition, FieldType } from '../../types/fieldmap';
import type { Character } from '../../models/character';
import { buildBindingOptions, guessBinding } from '../../data/bindings';

interface Props {
  fieldMap: FieldMap | null;
  onChange: (map: FieldMap) => void;
  character?: Character | null;
}

export function FieldEditor({ fieldMap, onChange, character }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      setContainerSize({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fieldMap?.imageDataUrl]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!selectedId || !fieldMap) return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA'
      ) {
        return;
      }

      const field = fieldMap.fields.find((f) => f.id === selectedId);
      if (!field) return;

      const step = e.shiftKey ? 1 : 0.2;
      let dx = 0;
      let dy = 0;

      switch (e.key) {
        case 'ArrowLeft': dx = -step; break;
        case 'ArrowRight': dx = step; break;
        case 'ArrowUp': dy = -step; break;
        case 'ArrowDown': dy = step; break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          deleteField(selectedId);
          return;
        default:
          return;
      }

      e.preventDefault();

      const maxX = 100 - field.width;
      const maxY = 100 - field.height;
      updateField(selectedId, {
        x: Math.max(0, Math.min(maxX, field.x + dx)),
        y: Math.max(0, Math.min(maxY, field.y + dy)),
      });
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, fieldMap]);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        onChange({
          id: fieldMap?.id ?? generateId(),
          name: fieldMap?.name ?? 'Новый лист',
          imageDataUrl: dataUrl,
          imageWidth: img.naturalWidth,
          imageHeight: img.naturalHeight,
          fields: fieldMap?.fields ?? [],
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function handleImportJson(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as FieldMap;
        onChange(parsed);
      } catch (err) {
        alert('Ошибка чтения JSON: ' + err);
      }
    };
    reader.readAsText(file);
  }

  function handleExportJson() {
    if (!fieldMap) return;
    const blob = new Blob([JSON.stringify(fieldMap, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fieldmap-${fieldMap.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function addField() {
    if (!fieldMap) return;
    const newField: FieldDefinition = {
      id: generateId(),
      name: `Поле ${fieldMap.fields.length + 1}`,
      type: 'text',
      binding: '',
      x: 10,
      y: 10,
      width: 10,
      height: 3,
    };
    onChange({ ...fieldMap, fields: [...fieldMap.fields, newField] });
    setSelectedId(newField.id);
  }

  function updateField(id: string, updates: Partial<FieldDefinition>) {
    if (!fieldMap) return;
    onChange({
      ...fieldMap,
      fields: fieldMap.fields.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    });
  }

  function deleteField(id: string) {
    if (!fieldMap) return;
    onChange({
      ...fieldMap,
      fields: fieldMap.fields.filter((f) => f.id !== id),
    });
    if (selectedId === id) setSelectedId(null);
  }

  function clearAll() {
    if (!confirm('Удалить изображение и все поля?')) return;
    onChange({
      id: generateId(),
      name: 'Новый лист',
      imageDataUrl: '',
      imageWidth: 0,
      imageHeight: 0,
      fields: [],
    });
  }

  if (!fieldMap || !fieldMap.imageDataUrl) {
    return (
      <div style={{ padding: '24px' }}>
        <h2 style={{ marginTop: 0 }}>Редактор разметки полей</h2>
        <p className="muted">
          Загрузите изображение листа персонажа (PNG или JPG) — и начните
          размечать поля.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <label
            className="btn btn-primary"
            style={{
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ImageIcon size={16} />
            <span>Загрузить изображение</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </label>
          <label
            className="btn"
            style={{
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FolderOpen size={16} />
            <span>Загрузить карту (JSON)</span>
            <input
              type="file"
              accept="application/json"
              onChange={handleImportJson}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
    );
  }

  const selectedField = fieldMap.fields.find((f) => f.id === selectedId) ?? null;

  return (
    <div style={{ padding: '16px' }}>
      {/* --- Тулбар --- */}
      <div
        className="panel"
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: '16px',
          padding: '10px',
        }}
      >
        <button
          onClick={addField}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} />
          <span>Добавить поле</span>
        </button>
        <button
          onClick={handleExportJson}
          className="btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Save size={16} />
          <span>Сохранить карту</span>
        </button>
        <label
          className="btn"
          style={{
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <FolderOpen size={16} />
          <span>Загрузить карту</span>
          <input
            type="file"
            accept="application/json"
            onChange={handleImportJson}
            style={{ display: 'none' }}
          />
        </label>
        <button
          onClick={clearAll}
          className="btn btn-danger"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Trash2 size={16} />
          <span>Очистить всё</span>
        </button>

        <div
          style={{
            width: '1px',
            height: '24px',
            backgroundColor: 'var(--border)',
            margin: '0 4px',
          }}
        />

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: 'var(--text-primary)',
          }}
        >
          <Search size={14} />
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ width: '120px' }}
          />
          <span style={{ minWidth: '40px' }}>{Math.round(zoom * 100)}%</span>
        </label>

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '13px',
            cursor: 'pointer',
            color: 'var(--text-primary)',
          }}
        >
          <input
            type="checkbox"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
          />
          Сетка
        </label>

        <div
          className="tiny"
          style={{ marginLeft: 'auto', fontSize: '13px' }}
        >
          Полей: {fieldMap.fields.length}
        </div>
      </div>

      {/* --- Основная область --- */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            maxHeight: '80vh',
            border: '2px solid var(--border)',
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div
            ref={containerRef}
            style={{
              position: 'relative',
              width: `${zoom * 100}%`,
              userSelect: 'none',
            }}
          >
            <img
              src={fieldMap.imageDataUrl}
              alt="Лист персонажа"
              draggable={false}
              style={{ display: 'block', width: '100%', height: 'auto' }}
            />

            {showGrid && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  backgroundImage:
                    'linear-gradient(to right, rgba(128,128,128,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(128,128,128,0.25) 1px, transparent 1px)',
                  backgroundSize: '2% 2%',
                }}
              />
            )}

            {containerSize.width > 0 &&
              fieldMap.fields.map((field) => (
                <Rnd
                  key={field.id}
                  size={{
                    width: `${field.width}%`,
                    height: `${field.height}%`,
                  }}
                  position={{
                    x: (field.x / 100) * containerSize.width,
                    y: (field.y / 100) * containerSize.height,
                  }}
                  bounds="parent"
                  onDragStop={(_e, d) => {
                    const parent = containerRef.current;
                    if (!parent) return;
                    updateField(field.id, {
                      x: (d.x / parent.clientWidth) * 100,
                      y: (d.y / parent.clientHeight) * 100,
                    });
                  }}
                  onResizeStop={(_e, _dir, ref, _delta, position) => {
                    const parent = containerRef.current;
                    if (!parent) return;
                    updateField(field.id, {
                      width: (ref.offsetWidth / parent.clientWidth) * 100,
                      height: (ref.offsetHeight / parent.clientHeight) * 100,
                      x: (position.x / parent.clientWidth) * 100,
                      y: (position.y / parent.clientHeight) * 100,
                    });
                  }}
                  onClick={() => setSelectedId(field.id)}
                  style={{
                    border:
                      selectedId === field.id
                        ? '2px solid var(--accent)'
                        : '1px dashed var(--warning)',
                    backgroundColor:
                      selectedId === field.id
                        ? 'rgba(96,165,250,0.25)'
                        : 'rgba(251,191,36,0.18)',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    cursor: 'move',
                  }}
                >
                  <div
                    style={{
                      fontSize: '10px',
                      color: 'var(--text-primary)',
                      padding: '2px 4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      pointerEvents: 'none',
                      textShadow: '0 0 3px var(--bg-primary)',
                    }}
                  >
                    {field.name}
                  </div>
                </Rnd>
              ))}
          </div>
        </div>

        {/* --- Панель свойств --- */}
        <div
          className="panel"
          style={{
            width: '340px',
            flexShrink: 0,
            position: 'sticky',
            top: '16px',
          }}
        >
          {selectedField ? (
            <FieldProperties
              field={selectedField}
              character={character}
              onUpdate={(updates) => updateField(selectedField.id, updates)}
              onDelete={() => deleteField(selectedField.id)}
            />
          ) : (
            <div className="muted" style={{ margin: 0 }}>
              <p>Выберите поле для настройки.</p>
              <p className="tiny">
                <strong>Подсказки:</strong>
                <br />• Кликните по полю, чтобы выбрать.
                <br />• Перетаскивайте мышкой.
                <br />• Стрелки клавиатуры — тонкая подстройка (Shift = быстрее).
                <br />• Delete — удалить выбранное поле.
                <br />• Используйте зум для точного позиционирования.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldProperties({
  field,
  character,
  onUpdate,
  onDelete,
}: {
  field: FieldDefinition;
  character?: Character | null;
  onUpdate: (updates: Partial<FieldDefinition>) => void;
  onDelete: () => void;
}) {
  const allBindings = useMemo(
    () => buildBindingOptions(character),
    [character]
  );

  const compatibleBindings = useMemo(
    () => allBindings.filter((o) => o.compatibleTypes.includes(field.type)),
    [allBindings, field.type]
  );

  const grouped = useMemo(() => {
    const map: Record<string, typeof compatibleBindings> = {};
    for (const opt of compatibleBindings) {
      if (!map[opt.category]) map[opt.category] = [];
      map[opt.category].push(opt);
    }
    return map;
  }, [compatibleBindings]);

  const isCurrentCompatible = compatibleBindings.some(
    (o) => o.path === field.binding
  );

  function handleNameChange(newName: string) {
    const updates: Partial<FieldDefinition> = { name: newName };

    if (!field.binding) {
      const guessed = guessBinding(newName, character);
      if (guessed) {
        updates.binding = guessed;
        const opt = allBindings.find((o) => o.path === guessed);
        if (opt && !opt.compatibleTypes.includes(field.type)) {
          updates.type = opt.compatibleTypes[0];
        }
      }
    }

    onUpdate(updates);
  }

  function handleBindingChange(newPath: string) {
    const updates: Partial<FieldDefinition> = { binding: newPath };
    const opt = allBindings.find((o) => o.path === newPath);
    if (opt && !opt.compatibleTypes.includes(field.type)) {
      updates.type = opt.compatibleTypes[0];
    }
    onUpdate(updates);
  }

  function handleGuessBinding() {
    const guessed = guessBinding(field.name, character);
    if (!guessed) {
      alert(
        'Не удалось угадать привязку. Попробуйте назвать поле иначе или выберите привязку вручную.'
      );
      return;
    }
    handleBindingChange(guessed);
  }

  return (
    <div>
      <h3 style={{ marginTop: 0, fontSize: '16px' }}>Свойства поля</h3>

      <label style={fieldLabelStyle}>Имя</label>
      <input
        type="text"
        value={field.name}
        onChange={(e) => handleNameChange(e.target.value)}
        className="input"
      />

      <label style={fieldLabelStyle}>Тип поля</label>
      <select
        value={field.type}
        onChange={(e) => onUpdate({ type: e.target.value as FieldType })}
        className="select"
      >
        <option value="text">Текст</option>
        <option value="number">Число</option>
        <option value="die">Кубик (d4–d12)</option>
        <option value="checkbox">Галочка</option>
      </select>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginTop: '12px',
          marginBottom: '4px',
        }}
      >
        <label style={{ ...fieldLabelStyle, margin: 0 }}>
          Привязка к персонажу
        </label>
        <button
          onClick={handleGuessBinding}
          title="Попробовать угадать привязку по имени поля"
          style={{
            fontSize: '11px',
            padding: '3px 8px',
            backgroundColor: 'var(--accent)',
            color: 'var(--text-inverse)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <Target size={12} />
          <span>Автоподбор</span>
        </button>
      </div>

      <select
        value={field.binding}
        onChange={(e) => handleBindingChange(e.target.value)}
        className="select"
      >
        <option value="">— не выбрано —</option>
        {Object.entries(grouped).map(([cat, opts]) => (
          <optgroup key={cat} label={cat}>
            {opts.map((opt) => (
              <option key={opt.path} value={opt.path}>
                {opt.label} ({opt.path})
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {field.binding && !isCurrentCompatible && (
        <div
          style={{
            marginTop: '6px',
            padding: '6px 8px',
            backgroundColor: 'var(--warning-soft)',
            color: 'var(--warning-text)',
            fontSize: '12px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          Текущая привязка <code>{field.binding}</code> несовместима с
          типом «{field.type}».
        </div>
      )}

      <div className="tiny" style={{ marginTop: '4px' }}>
        Если нужна нестандартная привязка, можно ввести её вручную —
        выберите «не выбрано» и напечатайте путь.
      </div>

      <label style={fieldLabelStyle}>Позиция и размер (в %)</label>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
        }}
      >
        <NumInput label="x" value={field.x} onChange={(v) => onUpdate({ x: v })} />
        <NumInput label="y" value={field.y} onChange={(v) => onUpdate({ y: v })} />
        <NumInput
          label="Ширина"
          value={field.width}
          onChange={(v) => onUpdate({ width: v })}
        />
        <NumInput
          label="Высота"
          value={field.height}
          onChange={(v) => onUpdate({ height: v })}
        />
      </div>

      <button
        onClick={onDelete}
        className="btn btn-danger"
        style={{
          marginTop: '20px',
          width: '100%',
          padding: '10px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
        }}
      >
        <Trash2 size={14} />
        <span>Удалить поле</span>
      </button>
    </div>
  );
}

function NumInput({
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
      <div className="tiny" style={{ marginBottom: '2px', fontSize: '11px' }}>
        {label}
      </div>
      <input
        type="number"
        step={0.1}
        value={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(v);
        }}
        className="input"
        style={{ padding: '6px 8px', fontSize: '13px' }}
      />
    </div>
  );
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

const fieldLabelStyle: React.CSSProperties = {
  display: 'block',
  marginTop: '12px',
  marginBottom: '4px',
  fontSize: '13px',
  fontWeight: 'bold',
  color: 'var(--text-primary)',
};