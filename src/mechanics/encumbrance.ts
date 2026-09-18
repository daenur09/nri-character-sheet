import type { Character } from '../models/character';
import type { InventoryItem } from '../types/gear';
import { dieToNumber } from './dice';

/**
 * Комфортная нагрузка = Сила × 2,5 кг.
 */
export function calculateComfortableLoad(character: Character): number {
  const strengthValue = dieToNumber(character.attributes.strength);
  return strengthValue * 2.5;
}

/**
 * Максимальный вес = 4× комфортной нагрузки.
 */
export function calculateMaxLoad(character: Character): number {
  return calculateComfortableLoad(character) * 4;
}

/**
 * Общий вес инвентаря.
 */
export function calculateTotalWeight(
  inventory: InventoryItem[] | undefined
): number {
  if (!inventory || inventory.length === 0) return 0;
  return inventory.reduce(
    (sum, item) => sum + item.weight * (item.quantity || 1),
    0
  );
}

export type EncumbranceStatus = 'ok' | 'light' | 'medium' | 'heavy';

export interface EncumbranceInfo {
  totalWeight: number;
  comfortable: number;
  maxLoad: number;
  status: EncumbranceStatus;
  penalty: number;
  label: string;
}

export function getEncumbranceInfo(character: Character): EncumbranceInfo {
  const comfortable = calculateComfortableLoad(character);
  const maxLoad = calculateMaxLoad(character);
  const totalWeight = calculateTotalWeight(character.inventory);

  let status: EncumbranceStatus = 'ok';
  let penalty = 0;
  let label = 'Норма';

  if (totalWeight > comfortable * 3) {
    status = 'heavy';
    penalty = 4;
    label = 'Перегрузка';
  } else if (totalWeight > comfortable * 2) {
    status = 'medium';
    penalty = 2;
    label = 'Тяжёлая нагрузка';
  } else if (totalWeight > comfortable) {
    status = 'light';
    penalty = 1;
    label = 'Лёгкая нагрузка';
  }

  return { totalWeight, comfortable, maxLoad, status, penalty, label };
}

export function generateInventoryId(): string {
  return (
    'inv-' +
    Math.random().toString(36).substring(2, 10) +
    Date.now().toString(36)
  );
}