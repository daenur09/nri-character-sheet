import type { AttributeName } from '../models/character';

export interface SkillDefinition {
  id: string;
  name: string;
  attribute: AttributeName;
  isCore: boolean;
  description: string;
  uses?: string[];
  hasSpecialization?: boolean;
  sourceId: string;
}

export const SKILLS: SkillDefinition[] = [
  // ============ Базовые (Core) ============
  { id: 'athletics', name: 'Атлетика', attribute: 'agility', isCore: true,
    description: 'Бег, прыжки, лазание, плавание, метание.',
    uses: ['Лазание', 'Плавание', 'Прыжок', 'Метание'], sourceId: 'core' },
  { id: 'common_knowledge', name: 'Общие знания', attribute: 'smarts', isCore: true,
    description: 'Знание истории, культуры, обычаев своего края.', sourceId: 'core' },
  { id: 'notice', name: 'Внимание', attribute: 'smarts', isCore: true,
    description: 'Бдительность, замечать детали, слышать шум.', sourceId: 'core' },
  { id: 'persuasion', name: 'Убеждение', attribute: 'spirit', isCore: true,
    description: 'Уговорить, убедить, договориться.', sourceId: 'core' },
  { id: 'stealth', name: 'Маскировка', attribute: 'agility', isCore: true,
    description: 'Прятаться, подкрадываться, не быть замеченным.', sourceId: 'core' },

  // ============ Обычные ============
  { id: 'academics', name: 'Наука', attribute: 'smarts', isCore: false,
    description: 'Гуманитарные науки, история, литература.', sourceId: 'core' },
  { id: 'battle', name: 'Военное дело', attribute: 'smarts', isCore: false,
    description: 'Тактика, стратегия, командование войсками.', sourceId: 'core' },
  { id: 'boating', name: 'Судовождение', attribute: 'agility', isCore: false,
    description: 'Управление лодками, кораблями.', sourceId: 'core' },
  { id: 'driving', name: 'Вождение', attribute: 'agility', isCore: false,
    description: 'Управление наземным транспортом.', sourceId: 'core' },
  { id: 'fighting', name: 'Драка', attribute: 'strength', isCore: false,
    description: 'Ближний бой — кулаками, оружием.', sourceId: 'core' },
  { id: 'focus', name: 'Сосредоточение', attribute: 'spirit', isCore: false,
    description: 'Сверхъестественный навык для некоторых мистических даров.', sourceId: 'core' },
  { id: 'gambling', name: 'Азартные игры', attribute: 'smarts', isCore: false,
    description: 'Игра в карты, кости, ставки.', sourceId: 'core' },
  { id: 'healing', name: 'Лечение', attribute: 'smarts', isCore: false,
    description: 'Первая помощь, хирургия, заживление ран.', sourceId: 'core' },
  { id: 'intimidation', name: 'Запугивание', attribute: 'spirit', isCore: false,
    description: 'Внушить страх, угрожать.', sourceId: 'core' },
  { id: 'language', name: 'Язык', attribute: 'smarts', isCore: false,
    description: 'Знание иностранного языка.', hasSpecialization: true, sourceId: 'core' },
  { id: 'occult', name: 'Оккультизм', attribute: 'smarts', isCore: false,
    description: 'Знание магии, сверхъестественного.', sourceId: 'core' },
  { id: 'performance', name: 'Искусство', attribute: 'spirit', isCore: false,
    description: 'Пение, танец, актёрство, музыка.', hasSpecialization: true, sourceId: 'core' },
  { id: 'piloting', name: 'Пилотирование', attribute: 'agility', isCore: false,
    description: 'Управление летательными аппаратами.', sourceId: 'core' },
  { id: 'provoke', name: 'Провокация', attribute: 'smarts', isCore: false,
    description: 'Оскорбить, вывести из себя, спровоцировать.', sourceId: 'core' },
  { id: 'repair', name: 'Ремонт', attribute: 'smarts', isCore: false,
    description: 'Починка техники, механизмов, оружия.', sourceId: 'core' },
  { id: 'research', name: 'Анализ текста', attribute: 'smarts', isCore: false,
    description: 'Работа с книгами, документами, архивами.', sourceId: 'core' },
  { id: 'riding', name: 'Верховая езда', attribute: 'agility', isCore: false,
    description: 'Управление ездовым животным.', sourceId: 'core' },
  { id: 'science', name: 'Естественные науки', attribute: 'smarts', isCore: false,
    description: 'Физика, химия, биология, медицина.', sourceId: 'core' },
  { id: 'shooting', name: 'Стрельба', attribute: 'agility', isCore: false,
    description: 'Стрельба из лука, пистолета, ружья.', sourceId: 'core' },
  { id: 'survival', name: 'Выживание', attribute: 'smarts', isCore: false,
    description: 'Добыть еду и воду, укрытие в дикой местности.', sourceId: 'core' },
  { id: 'thievery', name: 'Воровство', attribute: 'agility', isCore: false,
    description: 'Взлом замков, карманные кражи, обезвреживание ловушек.', sourceId: 'core' },
  { id: 'tracking', name: 'Выслеживание', attribute: 'smarts', isCore: false,
    description: 'Идти по следу человека или зверя.', sourceId: 'core' },
  { id: 'weird_science', name: 'Безумная наука', attribute: 'smarts', isCore: false,
    description: 'Сверхъестественный навык для безумных учёных.', sourceId: 'core' },

  // ============ «Варвары и чудовища» ============
  { id: 'lotus_secrets', name: 'Секреты лотоса', attribute: 'smarts', isCore: false,
    description: 'Сверхъестественный навык для знатоков лотоса.', sourceId: 'barbarians' },
  { id: 'insight', name: 'Прозрение', attribute: 'spirit', isCore: false,
    description: 'Сверхъестественный навык для монахов Пути Прозрения.', sourceId: 'barbarians' },
  { id: 'witchcraft', name: 'Чернокнижие', attribute: 'smarts', isCore: false,
    description: 'Сверхъестественный навык для тёмных колдунов.', sourceId: 'barbarians' },
];