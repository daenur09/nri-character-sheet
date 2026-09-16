/**
 * Описание источника контента.
 */
export interface ContentSource {
  id: string;
  name: string;
  shortName: string;
  description: string;
  color: string;
  isOfficial: boolean;
  order: number;
}

/**
 * Справочник всех источников контента в приложении.
 */
export const SOURCES: ContentSource[] = [
  {
    id: 'core',
    name: 'Дневник авантюриста',
    shortName: 'Core',
    description: 'Базовые правила Savage Worlds (SWADE)',
    color: '#3b82f6',
    isOfficial: true,
    order: 1,
  },
  {
    id: 'barbarians',
    name: 'Варвары и чудовища',
    shortName: 'Barbarians',
    description: 'Сеттинг меча и магии для Savage Worlds',
    color: '#dc2626',
    isOfficial: true,
    order: 2,
  },
  {
    id: 'chudovischa',
    name: 'Чудовища Вотчин',
    shortName: 'Bestiary',
    description: 'Бестиарий Вотчин Моря Ужаса',
    color: '#7c3aed',
    isOfficial: true,
    order: 3,
  },
  {
    id: 'custom',
    name: 'Пользовательский контент',
    shortName: 'Custom',
    description: 'Элементы, добавленные вами',
    color: '#10b981',
    isOfficial: false,
    order: 100,
  },
];

/** Найти источник по id. */
export function getSource(id?: string): ContentSource | undefined {
  if (!id) return undefined;
  return SOURCES.find((s) => s.id === id);
}