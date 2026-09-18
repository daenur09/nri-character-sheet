export type Weapon = {
  id: string;
  name: string;
  damage: string;
  range: string;
  weight: number;
  cost: number;
  notes?: string;
};

export type Armor = {
  id: string;
  name: string;
  /** Бонус к броне (Toughness) */
  armorBonus: number;
  weight: number;
  cost: number;
  notes?: string;
};

export type GearItem = {
  id: string;
  name: string;
  description: string;
  weight: number;
  cost: number;
};

export type InventoryKind = 'weapon' | 'armor' | 'gear';

export interface InventoryItem {
  /** Уникальный id экземпляра (для React-ключей и CRUD) */
  instanceId: string;
  /** id из каталога (или `custom-xxx` для кастомного предмета) */
  catalogId: string;
  kind: InventoryKind;
  name: string;
  quantity: number;
  /** Вес одной единицы, кг */
  weight: number;
  /** Стоимость одной единицы, лун */
  cost: number;
  isCarried?: boolean;
  isEquipped?: boolean;
  notes?: string;
}