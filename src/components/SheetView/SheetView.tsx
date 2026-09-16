import type { Character } from '../../models/character';
import type { FieldMap, FieldDefinition } from '../../types/fieldmap';
import type { DieType } from '../../mechanics/dice';
import { getValueByPath, setValueByPath } from '../../utils/binding';

const DIE_OPTIONS: DieType[] = ['d4', 'd6', 'd8', 'd10', 'd12'];

interface Props {
  fieldMap: FieldMap;
  character: Character;
  onChange: (updated: Character) => void;
}

/**
 * Отображает изображение листа персонажа с интерактивными полями поверх.
 */
export function SheetView({ fieldMap, character, onChange }: Props) {
  function handleFieldChange(field: FieldDefinition, newValue: unknown) {
    if (!field.binding) return;
    const updated = setValueByPath(character, field.binding, newValue);
    onChange(updated);
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '1000px',
        margin: '0 auto',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-tertiary)',
      }}
    >
      <img
        src={fieldMap.imageDataUrl}
        alt="Лист персонажа"
        draggable={false}
        style={{ display: 'block', width: '100%', height: 'auto' }}
      />

      {fieldMap.fields.map((field) => (
        <FieldView
          key={field.id}
          field={field}
          character={character}
          onChange={(value) => handleFieldChange(field, value)}
        />
      ))}
    </div>
  );
}

function FieldView({
  field,
  character,
  onChange,
}: {
  field: FieldDefinition;
  character: Character;
  onChange: (value: unknown) => void;
}) {
  const value = field.binding ? getValueByPath(character, field.binding) : undefined;
  const hasBinding = !!field.binding;

  const wrapperStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${field.x}%`,
    top: `${field.y}%`,
    width: `${field.width}%`,
    height: `${field.height}%`,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    border: hasBinding
      ? '1px solid var(--accent)'
      : '1px dashed var(--border-strong)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: hasBinding ? 'var(--bg-primary)' : 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    fontSize: '14px',
    padding: '2px 6px',
    boxSizing: 'border-box',
    outline: 'none',
  };

  if (!hasBinding) {
    return (
      <div style={wrapperStyle}>
        <div
          style={{
            ...inputStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-tertiary)',
            fontSize: '11px',
          }}
        >
          {field.name}
        </div>
      </div>
    );
  }

  let input: React.ReactNode;

  if (field.type === 'die') {
    input = (
      <select
        value={(value as string) || 'd4'}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, textAlign: 'center', fontWeight: 'bold' }}
      >
        {DIE_OPTIONS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
    );
  } else if (field.type === 'number') {
    input = (
      <input
        type="number"
        value={value === undefined || value === null ? '' : String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        style={inputStyle}
      />
    );
  } else if (field.type === 'checkbox') {
    input = (
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(e.target.checked)}
        style={{ ...inputStyle, width: 'auto', height: 'auto' }}
      />
    );
  } else {
    input = (
      <input
        type="text"
        value={value === undefined || value === null ? '' : String(value)}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    );
  }

  return <div style={wrapperStyle}>{input}</div>;
}