import { useMemo, useState } from 'react';
import { Search, Sword, Shield, Backpack, Plus, X } from 'lucide-react';
import type { Weapon, Armor, GearItem, InventoryItem } from '../../types/gear';
import { WEAPONS, ARMOR, GEAR } from '../../data/gear';
import { generateInventoryId } from '../../mechanics/encumbrance';

type Tab = 'weapon' | 'armor' | 'gear' | 'custom';

interface Props {
  onAdd: (item: InventoryItem) => void;
  onClose: () => void;
}

/**
 * Модальное окно выбора предмета для добавления в инвентарь.
 */
export function AddItemDialog({ onAdd, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('weapon');
  const [search, setSearch] = useState('');

  // Кастомный предмет
  const [customName, setCustomName] = useState('');
  const [customKind, setCustomKind] = useState<'weapon' | 'armor' | 'gear'>('gear');
  const [customWeight, setCustomWeight] = useState(1);
  const [customCost, setCustomCost] = useState(0);
  const [customNotes, setCustomNotes] = useState('');

  const weapons = useMemo(
    () => filterCatalog(WEAPONS, search),
    [search]
  );
  const armors = useMemo(() => filterCatalog(ARMOR, search), [search]);
  const gears = useMemo(() => filterCatalog(GEAR, search), [search]);

  function handleAddWeapon(w: Weapon) {
    onAdd({
      instanceId: generateInventoryId(),
      catalogId: w.id,
      kind: 'weapon',
      name: w.name,
      quantity: 1,
      weight: w.weight,
      cost: w.cost,
      isCarried: false,
      notes: w.notes,
    });
  }

  function handleAddArmor(a: Armor) {
    onAdd({
      instanceId: generateInventoryId(),
      catalogId: a.id,
      kind: 'armor',
      name: a.name,
      quantity: 1,
      weight: a.weight,
      cost: a.cost,
      isEquipped: false,
      notes: a.notes,
    });
  }

  function handleAddGear(g: GearItem) {
    onAdd({
      instanceId: generateInventoryId(),
      catalogId: g.id,
      kind: 'gear',
      name: g.name,
      quantity: 1,
      weight: g.weight,
      cost: g.cost,
      notes: g.description,
    });
  }

  function handleAddCustom() {
    if (!customName.trim()) {
      alert('Введите название предмета');
      return;
    }
    onAdd({
      instanceId: generateInventoryId(),
      catalogId: `custom-${generateInventoryId()}`,
      kind: customKind,
      name: customName.trim(),
      quantity: 1,
      weight: customWeight,
      cost: customCost,
      notes: customNotes.trim() || undefined,
    });
  }

  return (
    <div
      className="backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="dialog"
        style={{
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          borderRadius: 'var(--radius-lg)',
          width: '90%',
          maxWidth: '720px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Заголовок */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '18px' }}>Добавить предмет</h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              lineHeight: 1,
              padding: '0 4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Вкладки */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            padding: '12px 20px 0',
            borderBottom: '1px solid var(--border)',
            flexWrap: 'wrap',
          }}
        >
          <TabButton active={tab === 'weapon'} onClick={() => setTab('weapon')} icon={<Sword size={14} />} label="Оружие" />
          <TabButton active={tab === 'armor'} onClick={() => setTab('armor')} icon={<Shield size={14} />} label="Броня" />
          <TabButton active={tab === 'gear'} onClick={() => setTab('gear')} icon={<Backpack size={14} />} label="Снаряжение" />
          <TabButton active={tab === 'custom'} onClick={() => setTab('custom')} icon={<Plus size={14} />} label="Свой предмет" />
        </div>

        {/* Содержимое */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {tab !== 'custom' && (
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-tertiary)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по каталогу…"
                className="input"
                style={{ paddingLeft: '32px' }}
              />
            </div>
          )}

          {tab === 'weapon' && (
            <ItemList
              items={weapons}
              renderRow={(w) => ({
                name: w.name,
                meta: `Урон: ${w.damage} · Дист.: ${w.range}${w.notes ? ' · ' + w.notes : ''}`,
                weight: w.weight,
                cost: w.cost,
                onAdd: () => handleAddWeapon(w),
              })}
            />
          )}

          {tab === 'armor' && (
            <ItemList
              items={armors}
              renderRow={(a) => ({
                name: a.name,
                meta: `Броня +${a.armorBonus}${a.notes ? ' · ' + a.notes : ''}`,
                weight: a.weight,
                cost: a.cost,
                onAdd: () => handleAddArmor(a),
              })}
            />
          )}

          {tab === 'gear' && (
            <ItemList
              items={gears}
              renderRow={(g) => ({
                name: g.name,
                meta: g.description || '',
                weight: g.weight,
                cost: g.cost,
                onAdd: () => handleAddGear(g),
              })}
            />
          )}

          {tab === 'custom' && (
            <div>
              <label style={labelStyle}>Название *</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Например, Серебряный кинжал"
                className="input"
              />

              <label style={labelStyle}>Тип</label>
              <select
                value={customKind}
                onChange={(e) => setCustomKind(e.target.value as 'weapon' | 'armor' | 'gear')}
                className="select"
              >
                <option value="weapon">Оружие</option>
                <option value="armor">Броня / щит</option>
                <option value="gear">Снаряжение</option>
              </select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={labelStyle}>Вес (кг)</label>
                  <input
                    type="number"
                    step={0.1}
                    value={customWeight}
                    onChange={(e) => setCustomWeight(parseFloat(e.target.value) || 0)}
                    className="input"
                    style={{ textAlign: 'center' }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Цена (луны)</label>
                  <input
                    type="number"
                    value={customCost}
                    onChange={(e) => setCustomCost(parseInt(e.target.value) || 0)}
                    className="input"
                    style={{ textAlign: 'center' }}
                  />
                </div>
              </div>

              <label style={labelStyle}>Заметки</label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Дополнительные сведения"
                className="input"
              />

              <button
                onClick={handleAddCustom}
                className="btn btn-success"
                style={{ marginTop: '16px', width: '100%', padding: '10px' }}
              >
                <Plus size={14} /> Добавить в инвентарь
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Вспомогательные компоненты
// ============================================================

function filterCatalog<T extends { name: string }>(list: T[], search: string): T[] {
  if (!search.trim()) return list;
  const q = search.toLowerCase();
  return list.filter((item) => item.name.toLowerCase().includes(q));
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        fontSize: '13px',
        fontWeight: active ? 'bold' : 'normal',
        backgroundColor: 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        border: 'none',
        borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
        cursor: 'pointer',
        marginBottom: '-1px',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

interface RowData {
  name: string;
  meta: string;
  weight: number;
  cost: number;
  onAdd: () => void;
}

function ItemList<T>({
  items,
  renderRow,
}: {
  items: T[];
  renderRow: (item: T) => RowData;
}) {
  if (items.length === 0) {
    return <p className="muted">Ничего не найдено.</p>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {items.map((item, idx) => {
        const row = renderRow(item);
        return (
          <button
            key={idx}
            onClick={row.onAdd}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '10px 12px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '13px',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{row.name}</div>
              {row.meta && (
                <div className="tiny" style={{ fontSize: '11px' }}>
                  {row.meta}
                </div>
              )}
            </div>
            <div
              className="tiny"
              style={{
                fontSize: '11px',
                textAlign: 'right',
                whiteSpace: 'nowrap',
              }}
            >
              {row.weight} кг · {row.cost} лун
            </div>
            <Plus size={16} style={{ color: 'var(--accent)' }} />
          </button>
        );
      })}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginTop: '12px',
  marginBottom: '4px',
  fontSize: '13px',
  fontWeight: 'bold',
  color: 'var(--text-primary)',
};