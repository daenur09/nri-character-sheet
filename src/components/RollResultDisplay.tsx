import { RefreshCw, ArrowRight } from 'lucide-react';
import type { SkillRollResult } from '../mechanics/dice';

interface Props {
  result: SkillRollResult;
  /** Количество доступных фишек у персонажа. */
  bennies?: number;
  /** Можно ли перебрасывать (после броска навыка/атрибута). */
  canReroll?: boolean;
  /** Колбэк переброса. */
  onReroll?: () => void;
  /** Был ли уже использован переброс для этого броска. */
  alreadyRerolled?: boolean;
  /** Колбэк «Следующее действие» — сбросить блокировку и позволить бросить снова. */
  onNextTurn?: () => void;
  /**
   * Заголовок блока броска. По умолчанию «Бросок навыка».
   * Для броска атрибута передавайте «Бросок атрибута».
   */
  rollLabel?: string;
}

/**
 * Компонент для показа результата броска.
 */
export function RollResultDisplay({
  result,
  bennies = 0,
  canReroll = false,
  onReroll,
  alreadyRerolled = false,
  onNextTurn,
  rollLabel = 'Бросок навыка',
}: Props) {
  const canUseReroll =
    canReroll &&
    bennies > 0 &&
    !alreadyRerolled &&
    !result.hasAce &&
    !result.isCriticalFailure &&
    typeof onReroll === 'function';

  const noBennies = canReroll && bennies === 0 && !alreadyRerolled;

  return (
    <div
      className="panel"
      style={{
        borderLeft: '4px solid var(--accent)',
      }}
    >
      <div style={{ marginBottom: '8px' }}>
        <strong>{rollLabel}:</strong>{' '}
        {result.skillRoll.rolls.join(' + ')} = {result.skillRoll.total}
        {result.skillRoll.rolls.length > 1 && (
          <span
            style={{
              marginLeft: '8px',
              fontSize: '11px',
              color: 'var(--warning)',
              fontWeight: 'bold',
              textTransform: 'uppercase',
            }}
          >
            💥 Ace
          </span>
        )}
      </div>
      {result.wildRoll && (
        <div style={{ marginBottom: '8px' }}>
          <strong>Дикий кубик:</strong>{' '}
          {result.wildRoll.rolls.join(' + ')} = {result.wildRoll.total}
          {result.wildRoll.rolls.length > 1 && (
            <span
              style={{
                marginLeft: '8px',
                fontSize: '11px',
                color: 'var(--warning)',
                fontWeight: 'bold',
                textTransform: 'uppercase',
              }}
            >
              💥 Ace
            </span>
          )}
        </div>
      )}
      <div
        style={{
          marginBottom: '8px',
          fontSize: '20px',
          color: 'var(--accent-text)',
        }}
      >
        <strong>Итог:</strong> {result.total}
      </div>
      <div style={{ marginBottom: '8px' }}>
        <strong>Подъёмов:</strong> {result.raises}
      </div>
      {result.isCriticalFailure && (
        <div
          style={{
            color: 'var(--danger)',
            fontWeight: 'bold',
            marginTop: '8px',
          }}
        >
          ⚠️ КРИТИЧЕСКИЙ ПРОВАЛ!
        </div>
      )}

      {/* --- Кнопка переброса за фишку --- */}
      {canUseReroll && (
        <div
          style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <button
            onClick={onReroll}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} />
            <span>Перебросить за фишку ({bennies})</span>
          </button>
          <div className="tiny" style={{ marginTop: '6px' }}>
            Будет выбран лучший из двух результатов.
          </div>
        </div>
      )}

      {alreadyRerolled && (
        <div
          className="tiny"
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
            fontStyle: 'italic',
          }}
        >
          Переброс уже использован.
        </div>
      )}

      {result.hasAce && canReroll && !alreadyRerolled && (
        <div
          className="tiny"
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
            color: 'var(--warning-text)',
          }}
        >
          Взрыв кубика — переброс недоступен.
        </div>
      )}

      {result.isCriticalFailure && canReroll && !alreadyRerolled && (
        <div
          className="tiny"
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
            color: 'var(--danger-text)',
            fontWeight: 'bold',
          }}
        >
          Критический провал — переброс недоступен.
        </div>
      )}

      {noBennies && (
        <div
          className="tiny"
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
            color: 'var(--text-tertiary)',
          }}
        >
          Нет фишек для переброса.
        </div>
      )}

      {/* --- Кнопка «Следующее действие» --- */}
      {onNextTurn && (
        <div
          style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <button
            onClick={onNextTurn}
            className="btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowRight size={14} />
            <span>Следующее действие</span>
          </button>
          <div className="tiny" style={{ marginTop: '6px' }}>
            Завершить ход и разблокировать кнопки бросков.
          </div>
        </div>
      )}
    </div>
  );
}