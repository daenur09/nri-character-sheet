import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import Fuse from 'fuse.js';
import { RULE_SECTIONS, type RuleSection } from '../../data/rulebook';
import { Search } from 'lucide-react';

interface LoadedSection extends RuleSection {
  content: string;
}

export function RuleBook() {
  const [sections, setSections] = useState<LoadedSection[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAll() {
      try {
        const loaded = await Promise.all(
          RULE_SECTIONS.map(async (section) => {
            const res = await fetch(`/rules/${section.file}`);
            const text = await res.text();
            return { ...section, content: text };
          })
        );
        setSections(loaded);
        if (loaded.length > 0) setActiveId(loaded[0].id);
      } catch (err) {
        console.error('Ошибка загрузки правил:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAll();
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(sections, {
        keys: [
          { name: 'title', weight: 2 },
          { name: 'summary', weight: 1.5 },
          { name: 'content', weight: 1 },
        ],
        includeMatches: true,
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 3,
      }),
    [sections]
  );

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return fuse.search(searchQuery).slice(0, 20);
  }, [fuse, searchQuery]);

  const activeSection = sections.find((s) => s.id === activeId) ?? null;

  const categories = useMemo(() => {
    const map: Record<string, LoadedSection[]> = {};
    for (const s of sections) {
      if (!map[s.category]) map[s.category] = [];
      map[s.category].push(s);
    }
    return map;
  }, [sections]);

  function handleNavigate(id: string) {
    setActiveId(id);
    setSearchQuery('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (isLoading) {
    return <div style={{ padding: '24px' }}>Загрузка правил…</div>;
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '20px',
        alignItems: 'flex-start',
      }}
    >
      {/* --- Боковая панель --- */}
      <aside
        className="panel"
        style={{
          width: '260px',
          flexShrink: 0,
          position: 'sticky',
          top: '16px',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по правилам…"
            className="input"
            style={{ paddingLeft: '32px' }}
          />
        </div>

        {searchResults && (
          <div style={{ marginBottom: '12px' }}>
            <div
              className="tiny"
              style={{
                marginBottom: '6px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                fontSize: '11px',
              }}
            >
              Найдено: {searchResults.length}
            </div>
            {searchResults.length === 0 && (
              <div className="tiny">Ничего не найдено.</div>
            )}
            {searchResults.map((r) => (
              <button
                key={r.item.id}
                onClick={() => handleNavigate(r.item.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 10px',
                  marginBottom: '4px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{r.item.title}</div>
                <div className="tiny" style={{ fontSize: '11px' }}>
                  {r.item.category}
                </div>
              </button>
            ))}
          </div>
        )}

        {!searchResults &&
          Object.entries(categories).map(([cat, items]) => (
            <div key={cat} style={{ marginBottom: '16px' }}>
              <div
                className="tiny"
                style={{
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  marginBottom: '6px',
                  letterSpacing: '0.5px',
                  fontSize: '11px',
                }}
              >
                {cat}
              </div>
              {items.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleNavigate(s.id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 10px',
                    marginBottom: '2px',
                    backgroundColor:
                      activeId === s.id ? 'var(--accent-soft)' : 'transparent',
                    color:
                      activeId === s.id
                        ? 'var(--accent-text)'
                        : 'var(--text-primary)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: activeId === s.id ? 'bold' : 'normal',
                  }}
                >
                  {s.title}
                </button>
              ))}
            </div>
          ))}
      </aside>

      {/* --- Содержимое --- */}
      <div
        className="panel"
        style={{ flex: 1, padding: '24px 32px', minHeight: '60vh' }}
      >
        {activeSection ? (
          <article
            style={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: 'var(--text-primary)',
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSlug]}
              components={{
                a: ({ href, children }) => {
                  if (href && href.startsWith('#')) {
                    const id = href.substring(1);
                    const target = RULE_SECTIONS.find((s) => s.id === id);
                    if (target) {
                      return (
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavigate(id);
                          }}
                          style={{
                            color: 'var(--accent)',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                          }}
                        >
                          {children}
                        </a>
                      );
                    }
                  }
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent)' }}
                    >
                      {children}
                    </a>
                  );
                },
                h1: ({ children }) => (
                  <h1
                    style={{
                      borderBottom: '2px solid var(--border)',
                      paddingBottom: '8px',
                    }}
                  >
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 style={{ marginTop: '24px', color: 'var(--accent-text)' }}>
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 style={{ marginTop: '20px', color: 'var(--accent-text)' }}>
                    {children}
                  </h3>
                ),
                table: ({ children }) => (
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      margin: '16px 0',
                    }}
                  >
                    {children}
                  </table>
                ),
                th: ({ children }) => (
                  <th
                    style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderBottom: '2px solid var(--border-strong)',
                    }}
                  >
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td
                    style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {children}
                  </td>
                ),
                code: ({ children }) => (
                  <code
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '13px',
                    }}
                  >
                    {children}
                  </code>
                ),
              }}
            >
              {activeSection.content.replace(
                /\[\[([a-zA-Z0-9_-]+)\]\]/g,
                (_match, id) => {
                  const target = RULE_SECTIONS.find((s) => s.id === id);
                  return target
                    ? `[${target.title}](#${id})`
                    : `[${id}](#${id})`;
                }
              )}
            </ReactMarkdown>
          </article>
        ) : (
          <p className="muted">Выберите раздел слева.</p>
        )}
      </div>
    </div>
  );
}