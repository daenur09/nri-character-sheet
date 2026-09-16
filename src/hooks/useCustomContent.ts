import { useEffect, useState, useCallback } from 'react';
import { db } from '../db/database';
import type {
  CustomEdge,
  CustomHindrance,
  CustomSkill,
  CustomPower,
  CustomMonster,
} from '../types/custom-content';

/**
 * Хук для загрузки всего кастомного контента.
 * Загружает каждую таблицу отдельно с защитой от ошибок —
 * если таблица ещё не создана (миграция не прошла), вернёт пустой массив.
 */
export function useCustomContent() {
  const [customEdges, setCustomEdges] = useState<CustomEdge[]>([]);
  const [customHindrances, setCustomHindrances] = useState<CustomHindrance[]>([]);
  const [customSkills, setCustomSkills] = useState<CustomSkill[]>([]);
  const [customPowers, setCustomPowers] = useState<CustomPower[]>([]);
  const [customMonsters, setCustomMonsters] = useState<CustomMonster[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      // Загружаем все таблицы параллельно, каждая с защитой.
      const safeLoad = async <T,>(
        loader: () => Promise<T[]>
      ): Promise<T[]> => {
        try {
          const result = await loader();
          return Array.isArray(result) ? result : [];
        } catch (err) {
          console.warn('Не удалось загрузить таблицу:', err);
          return [];
        }
      };

      const [edges, hindrances, skills, powers, monsters] = await Promise.all([
        safeLoad(() => db.customEdges.toArray()),
        safeLoad(() => db.customHindrances.toArray()),
        safeLoad(() => db.customSkills.toArray()),
        safeLoad(() => db.customPowers.toArray()),
        safeLoad(() => db.customMonsters.toArray()),
      ]);

      setCustomEdges(edges);
      setCustomHindrances(hindrances);
      setCustomSkills(skills);
      setCustomPowers(powers);
      setCustomMonsters(monsters);
    } catch (err) {
      console.error('Ошибка загрузки кастомного контента:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    customEdges: customEdges ?? [],
    customHindrances: customHindrances ?? [],
    customSkills: customSkills ?? [],
    customPowers: customPowers ?? [],
    customMonsters: customMonsters ?? [],
    isLoading,
    reload,
  };
}