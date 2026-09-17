import { X } from 'lucide-react';
import type { SkillRollResult } from '../mechanics/dice';
import { RollResultDisplay } from './RollResultDisplay';

interface Props {
  result: SkillRollResult;
  bennies?: number;
  canReroll?: boolean;
  onReroll?: () => void;
  alreadyRerolled?: boolean;
  /** Закрыть окно и завершить ход (разблокировать броски). */
  onNextTurn: () => void;
  rollLabel?: string;
}

/**
 * Модальное окно результата броска.
 *
 * Показывается поверх листа персонажа сразу после броска. Содержимое —
 * переиспользуемый компонент `RollResultDisplay`, а вся «рамка» —
 * backdrop с кнопкой закрытия. Закрытие через «×» или клик по фону
 * приравнивается к «Следующее действие» (сброс состояния броска).
 */
export function RollResultModal({
  result,
  bennies,
  canReroll,
  onReroll,
  alreadyRerolled,
  onNextTurn,
  rollLabel,
}: Props) {
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      onNextTurn();
    }
  }

  return (
    <div
      className="backdrop"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200,
      }}
    >
      <div
        className="dialog"
        style={{
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          width: '90%',
          maxWidth: '480px',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '18px' }}>Результат броска</h3>
          <button
            onClick={onNextTurn}
            className="btn"
            title="Закрыть (завершит текущее действие)"
            style={{
              padding: '4px 8px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <RollResultDisplay
          result={result}
          bennies={bennies}
          canReroll={canReroll}
          onReroll={onReroll}
          alreadyRerolled={alreadyRerolled}
          onNextTurn={onNextTurn}
          rollLabel={rollLabel}
        />
      </div>
    </div>
  );
}