import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type {
  Monster,
  MonsterCategory,
  MonsterRole,
} from '../../types/bestiary';
import type { CustomMonster } from '../../types/custom-content';
import { db } from '../../db/database';
import { SourceBadge } from '../SourceBadge';

interface Filters {
  category: MonsterCategory | 'all';
  role: MonsterRole | 'all';
  source: string | 'all';
}

/**
 * Преобразует кастомного монстра в обычный формат бестиария.
 */
function customToMonster(c: CustomMonster): Monster {
  return {
    id: c.id,
    name: c.name,
    source: 'Пользовательский контент',
    category: c.category,
    role: c.role,
    rank: c.rank,
    description: c.description,
    attributes: c.attributes,
    skills: c.skills,
    pace: c.pace,
    parry: c.parry,
    toughness: c.toughness,
    charisma: c.charisma,
    edges: c.edges,
    hindrances: c.hindrances,
    gear: c.gear,
    abilities: c.abilities,
    tags: c.tags,
  };
}

/**
 * Компонент бестиария.
 */
export function Bestiary() {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
    category: 'all',
    role: 'all',
    source: 'all',
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadAll() {
      try {
        // Официальные монстры из JSON
        const res = await fetch('/bestiary/monsters.json');
        const officialData: Monster[] = await res.json();

        // Кастомные монстры из IndexedDB
        const customData = await db.customMonsters.toArray();
        const customMonsters = customData.map(customToMonster);

        const all = [...officialData, ...customMonsters];
        setMonsters(all);
        if (all.length > 0) setSelectedId(all[0].id);
      } catch (err) {
        console.error('Ошибка загрузки бестиария:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAll();
  }, []);

  const sources = useMemo(() => {
    const set = new Set(monsters.map((m) => m.source));
    return Array.from(set).sort();
  }, [monsters]);

  const filtered = useMemo(() => {
    let list = monsters;

    if (filters.category !== 'all') {
      list = list.filter((m) => m.category === filters.category);
    }
    if (filters.role !== 'all') {
      list = list.filter((m) => m.role === filters.role);
    }
    if (filters.source !== 'all') {
      list = list.filter((m) => m.source === filters.source);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          (m.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [monsters, filters, searchQuery]);

  const selected = monsters.find((m) => m.id === selectedId) ?? null;

  if (isLoading) {
    return <div style={{ padding: '24px' }}>Загрузка бестиария…</div>;
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '20px',
        alignItems: 'flex-start',
      }}
    >
      {/* --- Список монстров --- */}
      <aside
        className="panel"
        style={{
          width: '320px',
          flexShrink: 0,
          maxHeight: '85vh',
          overflowY: 'auto',
          position: 'sticky',
          top: '16px',
        }}
      >
        <div style={{ position: 'relative', marginBottom: '10px' }}>
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени, описанию, тегу…"
            className="input"
            style={{ paddingLeft: '32px' }}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            marginBottom: '10px',
          }}
        >
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters({
                ...filters,
                category: e.target.value as Filters['category'],
              })
            }
            className="select"
            style={{ fontSize: '12px', padding: '6px 8px' }}
          >
            <option value="all">Все категории</option>
            <option value="Животные">Животные</option>
            <option value="Чудовища">Чудовища</option>
            <option value="Нежить">Нежить</option>
            <option value="Демоны">Демоны</option>
            <option value="Люди">Люди</option>
            <option value="Культы">Культы</option>
            <option value="Уникальные существа">Уникальные</option>
          </select>

          <select
            value={filters.role}
            onChange={(e) =>
              setFilters({ ...filters, role: e.target.value as Filters['role'] })
            }
            className="select"
            style={{ fontSize: '12px', padding: '6px 8px' }}
          >
            <option value="all">Все роли</option>
            <option value="статист">Статист</option>
            <option value="приспешник">Приспешник</option>
            <option value="правая_рука">Правая рука</option>
            <option value="дикая_карта">Дикая карта</option>
            <option value="существо">Существо</option>
          </select>

          <select
            value={filters.source}
            onChange={(e) => setFilters({ ...filters, source: e.target.value })}
            className="select"
            style={{
              fontSize: '12px',
              padding: '6px 8px',
              gridColumn: '1 / -1',
            }}
          >
            <option value="all">Все источники</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div
          className="tiny"
          style={{
            marginBottom: '6px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            fontSize: '11px',
          }}
        >
          Монстров: {filtered.length} / {monsters.length}
        </div>

        {filtered.map((m) => {
          const isCustom = m.source === 'Пользовательский контент';
          return (
            <button
              key={m.id}
              onClick={() => setSelectedId(m.id)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 10px',
                marginBottom: '4px',
                backgroundColor:
                  selectedId === m.id
                    ? 'var(--accent-soft)'
                    : 'var(--bg-primary)',
                color:
                  selectedId === m.id
                    ? 'var(--accent-text)'
                    : 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexWrap: 'wrap',
                  marginBottom: '2px',
                }}
              >
                <span style={{ fontWeight: 'bold' }}>{m.name}</span>
                {isCustom && <SourceBadge sourceId="custom" small />}
              </div>
              <div className="tiny" style={{ fontSize: '11px' }}>
                {m.category} · {m.source}
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="muted" style={{ fontSize: '13px' }}>
            Ничего не найдено.
          </p>
        )}
      </aside>

      {/* --- Карточка монстра --- */}
      <div className="panel" style={{ flex: 1, minHeight: '60vh' }}>
        {selected ? (
          <MonsterCard monster={selected} />
        ) : (
          <p className="muted">Выберите монстра слева.</p>
        )}
      </div>
    </div>
  );
}

function MonsterCard({ monster }: { monster: Monster }) {
  const isCustom = monster.source === 'Пользовательский контент';

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          marginBottom: '4px',
        }}
      >
        <h1 style={{ margin: 0 }}>{monster.name}</h1>
        {isCustom && <SourceBadge sourceId="custom" />}
      </div>
      <div className="tiny" style={{ marginBottom: '16px' }}>
        {monster.category} · {monster.source} · Ранг: {monster.rank}
      </div>

      <p style={{ fontSize: '15px', lineHeight: 1.5 }}>{monster.description}</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          margin: '20px 0',
        }}
      >
        <Stat label="Шаг" value={monster.pace} />
        <Stat label="Защита" value={monster.parry} />
        <Stat label="Стойкость" value={monster.toughness} />
        {monster.charisma !== undefined && (
          <Stat label="Харизма" value={monster.charisma} />
        )}
      </div>

      <h2 style={h2Style}>Атрибуты</h2>
      <div style={gridRowStyle}>
        <span><strong>Ловкость:</strong> {monster.attributes.agility}</span>
        <span><strong>Смекалка:</strong> {monster.attributes.smarts}</span>
        <span><strong>Характер:</strong> {monster.attributes.spirit}</span>
        <span><strong>Сила:</strong> {monster.attributes.strength}</span>
        <span><strong>Выносливость:</strong> {monster.attributes.vigor}</span>
      </div>

      <h2 style={h2Style}>Навыки</h2>
      <div style={gridRowStyle}>
        {monster.skills.map((s) => (
          <span key={s.name}>
            <strong>{s.name}:</strong> {s.die}
          </span>
        ))}
        {monster.skills.length === 0 && (
          <span className="muted">Навыки не заданы.</span>
        )}
      </div>

      {monster.edges && monster.edges.length > 0 && (
        <>
          <h2 style={h2Style}>Черты</h2>
          <div>{monster.edges.join(', ')}</div>
        </>
      )}

      {monster.hindrances && monster.hindrances.length > 0 && (
        <>
          <h2 style={h2Style}>Изъяны</h2>
          <div>{monster.hindrances.join(', ')}</div>
        </>
      )}

      {monster.gear && monster.gear.length > 0 && (
        <>
          <h2 style={h2Style}>Снаряжение</h2>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {monster.gear.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </>
      )}

      {monster.abilities.length > 0 && (
        <>
          <h2 style={h2Style}>Особенности</h2>
          <div>
            {monster.abilities.map((a) => (
              <div
                key={a.name}
                style={{
                  marginBottom: '10px',
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: '3px solid var(--accent)',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {a.name}
                </div>
                <div style={{ fontSize: '14px' }}>{a.description}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {monster.tags && monster.tags.length > 0 && (
        <>
          <h2 style={h2Style}>Теги</h2>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {monster.tags.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: '12px',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent-text)',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat-box">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

const h2Style: React.CSSProperties = {
  marginTop: '20px',
  marginBottom: '8px',
  fontSize: '18px',
  color: 'var(--accent-text)',
  borderBottom: '1px solid var(--border)',
  paddingBottom: '4px',
};

const gridRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '6px',
  fontSize: '14px',
};