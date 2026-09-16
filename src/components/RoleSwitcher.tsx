import { Crown, User } from 'lucide-react';
import type { Role } from '../hooks/useRole';

interface Props {
  role: Role;
  onChange: (role: Role) => void;
}

/**
 * Компактный переключатель роли: Ведущий / Игрок.
 */
export function RoleSwitcher({ role, onChange }: Props) {
  const buttonBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '5px 10px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    border: '1px solid var(--border)',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    transition: 'background-color 0.15s, color 0.15s',
  };

  const activeStyle: React.CSSProperties = {
    backgroundColor: 'var(--accent)',
    color: 'var(--text-inverse)',
    borderColor: 'var(--accent)',
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
      title="Роль определяет доступ к функциям ведущего"
    >
      <button
        onClick={() => onChange('gm')}
        style={{
          ...buttonBase,
          ...(role === 'gm' ? activeStyle : {}),
          borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
        }}
      >
        <Crown size={13} />
        <span>Ведущий</span>
      </button>
      <button
        onClick={() => onChange('player')}
        style={{
          ...buttonBase,
          ...(role === 'player' ? activeStyle : {}),
          borderRadius: '0 var(--radius-md) var(--radius-md) 0',
          borderLeft: 'none',
        }}
      >
        <User size={13} />
        <span>Игрок</span>
      </button>
    </div>
  );
}