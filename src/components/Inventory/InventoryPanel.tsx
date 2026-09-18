import { useState } from 'react';
import { Plus, X, Package, Coins, ShoppingCart, Sword, Shield, Backpack } from 'lucide-react';
import type { Character } from '../../models/character';
import type { InventoryItem } from '../../types/gear';
import { getEncumbranceInfo } from '../../mechanics/encumbrance';
import { AddItemDialog } from './AddItemDialog';

interface Props {
  character: Character;
  onChange: React.Dispatch<React.SetStateAction<Character | null>>;
}

/**
 * Панель инвентаря персонажа.
 * Показывает список предметов, деньги и индикатор нагрузки.
 */
export function InventoryPanel({ character, onChange }: Props) {
  const [isAddOpen, setIsAddOpen] = useState(false);

  const inventory = character.inventory ?? [];
  const money = character.money ?? 500;
  const enc = getEncumbranceInfo(character);

  // Общий вес и стоимость инвентаря.
  const totalCost = inventory.reduce(
    (sum, item) => sum + item.cost * (item.quantity || 1),
    0
  );

  function updateInventory(updater: (items: InventoryItem[]) => InventoryItem[]) {
    onChange((c) => {
      if (!c) return c;
      return { ...c, inventory: updater(c.inventory ?? []) };
    });
  }

  function handleAdd(item: InventoryItem) {
    updateInventory((items) => [...items, item]);
    setIsAddOpen(false);
  }

  function handleRemove(instanceId: string) {
    if (!confirm('Удалить предмет из инвентаря?')) return;
    updateInventory((items) => items.filter((i) => i.instanceId !== instanceId));
  }

  function changeQuantity(instanceId: string, delta: number) {
    updateInventory((items) =>
      items.map((i) => {
        if (i.instanceId !== instanceId) return i;
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      })
    );
  }

  function toggleEquipped(instanceId: string) {
    updateInventory((items) =>
      items.map((i) =>
        i.instanceId === instanceId ? { ...i, isEquipped: !i.isEquipped } : i
      )
    );
  }

  function toggleCarried(instanceId: string) {
    updateInventory((items) =>
      items.map((i) =>
        i.instanceId === instanceId ? { ...i, isCarried: !i.isCarried } : i
      )
    );
  }

  function changeMoney(delta: number) {
    onChange((c) => (c ? { ...c, money: Math.max(0, money + delta) } : c));
  }

  return (
    <>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Package size={20} /> Снаряжение
      </h2>

      {/* --- Деньги --- */}
      <div
        className="panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '12px',
          padding: '10px 14px',
        }}
      >
        <Coins size={18} style={{ color: 'var(--warning)' }} />
        <strong>Деньги:</strong>
        <button onClick={() => changeMoney(-10)} style={buttonStyle}>−10</button>
        <button onClick={() => changeMoney(-1)} style={buttonStyle}>−1</button>
        <span style={{ fontSize: '20px', fontWeight: 'bold', minWidth: '70px', textAlign: 'center' }}>
          {money} лун
        </span>
        <button onClick={() => changeMoney(+1)} style={buttonStyle}>+1</button>
        <button onClick={() => changeMoney(+10)} style={buttonStyle}>+10</button>
      </div>

      {/* --- Индикатор нагрузки --- */}
      <LoadIndicator enc={enc} />

      {/* --- Кнопка добавления --- */}
      <div style={{ marginBottom: '12px' }}>
        <button
          onClick={() => setIsAddOpen(true)}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={14} />
          <span>Добавить предмет</span>
        </button>
      </div>

      {/* --- Таблица предметов --- */}
      {inventory.length === 0 ? (
        <div
          className="panel"
          style={{ padding: '24px', textAlign: 'center' }}
        >
          <ShoppingCart size={32} style={{ color: 'var(--text-tertiary)' }} />
          <p className="muted" style={{ marginTop: '8px' }}>
            Инвентарь пуст. Нажмите «Добавить предмет».
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {inventory.map((item) => (
            <ItemRow
              key={item.instanceId}
              item={item}
              onChangeQuantity={(d) => changeQuantity(item.instanceId, d)}
              onToggleEquipped={() => toggleEquipped(item.instanceId)}
              onToggleCarried={() => toggleCarried(item.instanceId)}
              onRemove={() => handleRemove(item.instanceId)}
            />
          ))}

          {/* Итоги */}
          <div
            className="panel"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 14px',
              marginTop: '4px',
              backgroundColor: 'var(--bg-tertiary)',
              fontSize: '13px',
            }}
          >
            <span>
              <strong>Общий вес:</strong> {enc.totalWeight.toFixed(1)} кг
            </span>
            <span>
              <strong>Общая стоимость:</strong> {totalCost} лун
            </span>
          </div>
        </div>
      )}

      {isAddOpen && (
        <AddItemDialog onAdd={handleAdd} onClose={() => setIsAddOpen(false)} />
      )}
    </>
  );
}

// ============================================================
// Строка предмета
// ============================================================

function ItemRow({
  item,
  onChangeQuantity,
  onToggleEquipped,
  onToggleCarried,
  onRemove,
}: {
  item: InventoryItem;
  onChangeQuantity: (delta: number) => void;
  onToggleEquipped: () => void;
  onToggleCarried: () => void;
  onRemove: () => void;
}) {
  const kindIcon =
    item.kind === 'weapon' ? <Sword size={14} /> :
    item.kind === 'armor' ? <Shield size={14} /> :
    <Backpack size={14} />;

  return (
    <div
      className="panel"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px',
      }}
    >
      <div style={{ display: 'inline-flex', color: 'var(--text-secondary)' }}>
        {kindIcon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <span>{item.name}</span>
          {item.isEquipped && <Badge color="success" text="Надето" />}
          {item.isCarried && <Badge color="accent" text="В руках" />}
        </div>
        {item.notes && (
          <div className="tiny" style={{ fontSize: '11px' }}>
            {item.notes}
          </div>
        )}
      </div>

      <div className="tiny" style={{ fontSize: '11px', textAlign: 'right', whiteSpace: 'nowrap' }}>
        {item.weight.toFixed(1)} кг · {item.cost} лун
      </div>

      {/* Количество */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <button onClick={() => onChangeQuantity(-1)} style={qtyButtonStyle} title="Меньше">−</button>
        <span
          style={{
            minWidth: '24px',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          {item.quantity}
        </span>
        <button onClick={() => onChangeQuantity(+1)} style={qtyButtonStyle} title="Больше">+</button>
      </div>

      {/* Переключатели */}
      {item.kind === 'armor' && (
        <button
          onClick={onToggleEquipped}
          className="btn"
          style={{ fontSize: '11px', padding: '4px 8px' }}
        >
          {item.isEquipped ? 'Снять' : 'Надеть'}
        </button>
      )}
      {item.kind === 'weapon' && (
        <button
          onClick={onToggleCarried}
          className="btn"
          style={{ fontSize: '11px', padding: '4px 8px' }}
        >
          {item.isCarried ? 'Убрать' : 'В руки'}
        </button>
      )}

      <button
        onClick={onRemove}
        title="Удалить"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--danger)',
          cursor: 'pointer',
          padding: '0 4px',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

function Badge({ color, text }: { color: 'accent' | 'success'; text: string }) {
  const bg = color === 'accent' ? 'var(--accent-soft)' : 'var(--success-soft)';
  const fg = color === 'accent' ? 'var(--accent-text)' : 'var(--success-text)';
  return (
    <span
      style={{
        fontSize: '10px',
        padding: '1px 6px',
        borderRadius: '10px',
        backgroundColor: bg,
        color: fg,
        fontWeight: 'bold',
        textTransform: 'uppercase',
      }}
    >
      {text}
    </span>
  );
}

// ============================================================
// Индикатор нагрузки
// ============================================================

function LoadIndicator({ enc }: { enc: ReturnType<typeof getEncumbranceInfo> }) {
  const percent = enc.comfortable > 0
    ? Math.min(100, (enc.totalWeight / (enc.comfortable * 3)) * 100)
    : 0;

  let barColor = 'var(--success)';
  if (enc.status === 'light') barColor = 'var(--warning)';
  else if (enc.status === 'medium') barColor = '#f97316';
  else if (enc.status === 'heavy') barColor = 'var(--danger)';

  return (
    <div className="panel" style={{ marginBottom: '12px', padding: '10px 14px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px',
          fontSize: '13px',
        }}
      >
        <div>
          <strong>Нагрузка:</strong> {enc.label}
          {enc.penalty !== 0 && (
            <span
              style={{
                marginLeft: '8px',
                color: 'var(--danger)',
                fontWeight: 'bold',
              }}
            >
              штраф −{enc.penalty} (Ловкость, Сила)
            </span>
          )}
        </div>
        <div className="tiny" style={{ fontSize: '11px' }}>
          {enc.totalWeight.toFixed(1)} / {enc.comfortable.toFixed(1)} кг
        </div>
      </div>

      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            backgroundColor: barColor,
            transition: 'width 0.2s, background-color 0.2s',
          }}
        />
        {/* Маркеры порогов на 33% и 66% */}
        <div
          style={{
            position: 'absolute',
            left: '33.33%',
            top: 0,
            bottom: 0,
            width: '1px',
            backgroundColor: 'var(--border)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '66.66%',
            top: 0,
            bottom: 0,
            width: '1px',
            backgroundColor: 'var(--border)',
          }}
        />
      </div>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: '13px',
  fontWeight: 'bold',
  border: '1px solid var(--border-strong)',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
};

const qtyButtonStyle: React.CSSProperties = {
  padding: '2px 8px',
  fontSize: '14px',
  fontWeight: 'bold',
  border: '1px solid var(--border-strong)',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  lineHeight: 1,
};