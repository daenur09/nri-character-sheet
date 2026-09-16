/**
 * Описание одного раздела справочника.
 */
export interface RuleSection {
  /** Уникальный идентификатор. Используется в ссылках. */
  id: string;
  /** Название раздела (отображается в навигации и поиске). */
  title: string;
  /** Имя файла в папке public/rules (без пути). */
  file: string;
  /** Категория для группировки. */
  category: string;
  /** Краткое описание (для подсказки в поиске). */
  summary?: string;
}

/**
 * Список всех разделов справочника.
 * Чтобы добавить новый — создайте Markdown-файл в public/rules/
 * и допишите раздел сюда.
 */
export const RULE_SECTIONS: RuleSection[] = [
  // --- Основы ---
  {
    id: 'basics',
    title: 'Основные правила',
    file: 'basics.md',
    category: 'Основы',
    summary: 'Проверки, Wild Die, взрывы кубов, подъёмы.',
  },
  {
    id: 'attributes',
    title: 'Характеристики',
    file: 'attributes.md',
    category: 'Основы',
    summary: 'Ловкость, Смекалка, Характер, Сила, Выносливость.',
  },
  {
    id: 'skills',
    title: 'Навыки',
    file: 'skills.md',
    category: 'Основы',
    summary: 'Список навыков, стоимость повышения, базовые навыки.',
  },

  // --- Бой ---
  {
    id: 'combat',
    title: 'Бой',
    file: 'combat.md',
    category: 'Бой',
    summary: 'Инициатива, действия, атаки, укрытия.',
  },
  {
    id: 'damage',
    title: 'Урон и ранения',
    file: 'damage.md',
    category: 'Бой',
    summary: 'Шок, ранения, при смерти, лечение.',
  },

  // --- Прокачка ---
  {
    id: 'advancement',
    title: 'Прокачка персонажа',
    file: 'advancement.md',
    category: 'Прокачка',
    summary: 'Опыт, ранги, пять вариантов повышения.',
  },
  {
    id: 'edges',
    title: 'Черты (Edges)',
    file: 'edges.md',
    category: 'Прокачка',
    summary: 'Что такое черты и как их получать.',
  },
  {
    id: 'hindrances',
    title: 'Изъяны (Hindrances)',
    file: 'hindrances.md',
    category: 'Прокачка',
    summary: 'Мелкие и крупные изъяны.',
  },
];