import { useEffect, useState } from 'react';

/**
 * Роль пользователя.
 *  - 'gm'     — ведущий (мастер), полный доступ
 *  - 'player' — игрок, ограниченный доступ
 */
export type Role = 'gm' | 'player';

const STORAGE_KEY = 'nri-role';

/**
 * Возвращает сохранённую роль или 'gm' по умолчанию.
 */
function getInitialRole(): Role {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'gm' || stored === 'player') return stored;
  return 'gm';
}

/**
 * Хук для управления ролью пользователя.
 */
export function useRole() {
  const [role, setRole] = useState<Role>(getInitialRole);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, role);
  }, [role]);

  const isGM = role === 'gm';
  const isPlayer = role === 'player';

  return { role, setRole, isGM, isPlayer };
}