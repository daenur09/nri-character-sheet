import { Dice6 } from 'lucide-react';
import type { Character, AttributeName } from '../models/character';
import type { DieType } from '../mechanics/dice';

const DIE_OPTIONS: DieType[] = ['d4', 'd6', 'd8', 'd10', 'd12'];

const ATTRIBUTE_LABELS: Record<AttributeName, string> = {
  agility: 'Ловкость',
  smarts: 'Смекалка',
  spirit: 'Характер',
  strength: 'Сила',
  vigor: 'Выносливость',
};

interface Props {
  character: Character;
  onChange: (updated: Character) => void;
  hasRolled: boolean;
  onRollAttribute: (attr: AttributeName) => void;
}

/**
 * Панель атрибутов персонажа.
 *
 * Помимо выбора кубика, позволяет бросить атрибут со штрафом −2 —
 * это правило SWADE на случай, когда у персонажа нет нужного навыка.
 * Штраф −2 применяется автоматически, дополнительно вычитаются
 * ранения и усталость (см. `handleRollAttribute` в App.tsx).
 */
export function AttributesPanel({
  character,
  onChange,
  hasRolled,
  onRollAttribute,
}: Props) {
  function setAttribute(attr: AttributeName, die: DieType) {
    onChange({
      ...character,
      attributes: { ...character.attributes, [attr]: die },
    });
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '12px',
        marginBottom: '24px',
      }}
    >
      {(Object.keys(character.attributes) as AttributeName[]).map((attr) => (
        <div
          key={attr}
          className="stat-box"
          style={{
            display: 'flex',
            flexDirection: 'column',
            textAlign: 'center',
            gap: '6px',
          }}
        >
          <span className="stat-label" style={{ marginBottom: '4px' }}>
            {ATTRIBUTE_LABELS[attr]}
          </span>

          <select
            value={character.attributes[attr]}
            onChange={(e) => setAttribute(attr, e.target.value as DieType)}
            className="select"
            style={{
              fontSize: '16px',
              fontWeight: 'bold',
              textAlign: 'center',
              padding: '6px',
            }}
          >
            {DIE_OPTIONS.map((die) => (
              <option key={die} value={die}>
                {die}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onRollAttribute(attr)}
            disabled={hasRolled}
            className="btn btn-primary"
            title={
              hasRolled
                ? 'Сначала завершите текущее действие'
                : 'Бросок атрибута со штрафом −2 (когда нет нужного навыка)'
            }
            style={{
              fontSize: '11px',
              padding: '4px 6px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              ...(hasRolled
                ? { opacity: 0.5, cursor: 'not-allowed' }
                : {}),
            }}
          >
            <Dice6 size={12} />
            <span>Бросок −2</span>
          </button>
        </div>
      ))}
    </div>
  );
}