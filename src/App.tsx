import { useEffect, useState } from 'react';
import { rollSkill, type SkillRollResult, type DieType } from './mechanics/dice';
import { calculateDerivedStats } from './mechanics/derived';
import {
  calculateRank,
  calculateAvailableAdvancements,
  calculateRemainingAdvancements,
} from './mechanics/advancement';
import type { Character, AttributeName } from './models/character';
import type { FieldMap } from './types/fieldmap';
import { db } from './db/database';
import { DEMO_CHARACTER } from './data/demo-character';
import { RollResultDisplay } from './components/RollResultDisplay';
import { AdvancementDialog } from './components/AdvancementDialog';
import { EdgesPanel } from './components/EdgesPanel';
import { HindrancesPanel } from './components/HindrancesPanel';
import { FieldEditor } from './components/FieldEditor/FieldEditor';
import { SheetView } from './components/SheetView/SheetView';
import { RuleBook } from './components/RuleBook/RuleBook';
import { Bestiary } from './components/Bestiary/Bestiary';
import { DataManager } from './components/DataManager';
import { ThemeToggle } from './components/ThemeToggle';
import { RoleSwitcher } from './components/RoleSwitcher';
import { GameMasterScreen } from './components/GameMaster/GameMasterScreen';
import { ContentEditor } from './components/ContentEditor/ContentEditor';
import { useTheme } from './hooks/useTheme';
import { useRole } from './hooks/useRole';
import { ScrollText, Wrench, BookOpen, Skull, Users, FileText } from 'lucide-react';

const DIE_OPTIONS: DieType[] = ['d4', 'd6', 'd8', 'd10', 'd12'];

const ATTRIBUTE_LABELS: Record<AttributeName, string> = {
  agility: 'Ловкость',
  smarts: 'Смекалка',
  spirit: 'Характер',
  strength: 'Сила',
  vigor: 'Выносливость',
};

type Tab = 'sheet' | 'editor' | 'rules' | 'bestiary' | 'gm' | 'content';
type SheetMode = 'form' | 'image';

export function App() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [lastRoll, setLastRoll] = useState<SkillRollResult | null>(null);
  const [lastSkillName, setLastSkillName] = useState<string | null>(null);
  const [rerolledFor, setRerolledFor] = useState<number | null>(null);
  const [rollCounter, setRollCounter] = useState(0);
  const [hasRolled, setHasRolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdvancementOpen, setIsAdvancementOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('sheet');
  const [sheetMode, setSheetMode] = useState<SheetMode>('form');
  const [fieldMap, setFieldMap] = useState<FieldMap | null>(null);
  const { theme, toggle } = useTheme();
  const { role, setRole, isGM } = useRole();

  // --- Загрузка активного персонажа ---
  useEffect(() => {
    async function load() {
      try {
        const all = await db.characters.toArray();
        if (all.length === 0) {
          await db.characters.add(DEMO_CHARACTER);
          setCharacter(DEMO_CHARACTER);
        } else {
          setCharacter(all[0]);
        }
      } catch (err) {
        console.error('Ошибка загрузки персонажа:', err);
        setCharacter(DEMO_CHARACTER);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // --- Автосохранение персонажа ---
  useEffect(() => {
    if (character && !isLoading) {
      db.characters
        .put(character)
        .catch((err) => console.error('Ошибка сохранения:', err));
    }
  }, [character, isLoading]);

  // --- Загрузка карты разметки ---
  useEffect(() => {
    db.fieldMaps.toArray().then((maps) => {
      if (maps.length > 0) setFieldMap(maps[0]);
    });
  }, []);

  // --- Автосохранение карты разметки ---
  useEffect(() => {
    if (fieldMap) {
      db.fieldMaps
        .put(fieldMap)
        .catch((err) => console.error('Ошибка сохранения карты:', err));
    }
  }, [fieldMap]);

  /** Перечитать активного персонажа из базы. */
  async function reloadActiveCharacter() {
    if (character) {
      const fresh = await db.characters.get(character.id);
      if (fresh) {
        setCharacter(fresh);
        return;
      }
    }
    const all = await db.characters.toArray();
    if (all.length > 0) {
      setCharacter(all[0]);
    } else {
      await db.characters.add(DEMO_CHARACTER);
      setCharacter(DEMO_CHARACTER);
    }
  }

  /** Переключить активного персонажа. */
  async function setActiveCharacter(id: string) {
    const target = await db.characters.get(id);
    if (target) {
      setCharacter(target);
      setActiveTab('sheet');
      setSheetMode('form');
    }
  }

  /** Сбросить состояние броска — новое действие. */
  function nextTurn() {
    setHasRolled(false);
    setLastRoll(null);
    setLastSkillName(null);
    setRerolledFor(null);
  }

  if (isLoading || !character) {
    return <div className="app-container">Загрузка персонажа…</div>;
  }

  // --- Вкладка «Редактор разметки» ---
  if (activeTab === 'editor') {
    return (
      <Outer width={1400}>
        <TabBar
          active={activeTab}
          onChange={setActiveTab}
          theme={theme}
          onToggleTheme={toggle}
          role={role}
          onRoleChange={setRole}
        />
        <FieldEditor
          fieldMap={fieldMap}
          onChange={setFieldMap}
          character={character}
        />
      </Outer>
    );
  }

  // --- Вкладка «Правила» ---
  if (activeTab === 'rules') {
    return (
      <Outer width={1200}>
        <TabBar
          active={activeTab}
          onChange={setActiveTab}
          theme={theme}
          onToggleTheme={toggle}
          role={role}
          onRoleChange={setRole}
        />
        <RuleBook />
      </Outer>
    );
  }

  // --- Вкладка «Бестиарий» ---
  if (activeTab === 'bestiary') {
    return (
      <Outer width={1200}>
        <TabBar
          active={activeTab}
          onChange={setActiveTab}
          theme={theme}
          onToggleTheme={toggle}
          role={role}
          onRoleChange={setRole}
        />
        <Bestiary />
      </Outer>
    );
  }

  // --- Вкладка «Контент» (только ведущий) ---
  if (activeTab === 'content' && isGM) {
    return (
      <Outer width={1200}>
        <TabBar
          active={activeTab}
          onChange={setActiveTab}
          theme={theme}
          onToggleTheme={toggle}
          role={role}
          onRoleChange={setRole}
        />
        <ContentEditor />
      </Outer>
    );
  }

  // --- Вкладка «Ведущий» ---
  if (activeTab === 'gm' && isGM) {
    return (
      <Outer width={1400}>
        <TabBar
          active={activeTab}
          onChange={setActiveTab}
          theme={theme}
          onToggleTheme={toggle}
          role={role}
          onRoleChange={setRole}
        />
        <GameMasterScreen
          activeCharacterId={character.id}
          onSetActive={setActiveCharacter}
          onRefresh={reloadActiveCharacter}
        />
      </Outer>
    );
  }

  // --- Вкладка «Лист персонажа» — режим «Вид листа» ---
  if (sheetMode === 'image') {
    return (
      <Outer width={1000}>
        <TabBar
          active={activeTab}
          onChange={setActiveTab}
          theme={theme}
          onToggleTheme={toggle}
          role={role}
          onRoleChange={setRole}
        />
        <SheetModeToggle
          mode={sheetMode}
          onChange={setSheetMode}
          hasFieldMap={!!fieldMap}
        />
        {fieldMap ? (
          <SheetView
            fieldMap={fieldMap}
            character={character}
            onChange={setCharacter}
          />
        ) : (
          <div className="panel" style={{ textAlign: 'center', padding: '32px' }}>
            <p className="muted">Карта разметки ещё не создана.</p>
            <p className="muted">
              Перейдите на вкладку <strong>🔧 Редактор разметки</strong>,
              загрузите изображение листа и разметьте поля.
            </p>
          </div>
        )}
      </Outer>
    );
  }

  // --- Вкладка «Лист персонажа» — режим «Форма» ---
  return (
    <Outer width={900}>
      <TabBar
        active={activeTab}
        onChange={setActiveTab}
        theme={theme}
        onToggleTheme={toggle}
        role={role}
        onRoleChange={setRole}
      />
      <SheetModeToggle
        mode={sheetMode}
        onChange={setSheetMode}
        hasFieldMap={!!fieldMap}
      />
      <SheetForm
        character={character}
        setCharacter={setCharacter}
        fieldMap={fieldMap}
        setFieldMap={setFieldMap}
        lastRoll={lastRoll}
        lastSkillName={lastSkillName}
        setLastSkillName={setLastSkillName}
        hasRolled={hasRolled}
        onRoll={(r) => {
          setLastRoll(r);
          setRerolledFor(null);
          setRollCounter((c) => c + 1);
          setHasRolled(true);
        }}
        onNextTurn={nextTurn}
        isAdvancementOpen={isAdvancementOpen}
        setIsAdvancementOpen={setIsAdvancementOpen}
        isGM={isGM}
        rollCounter={rollCounter}
        rerolledFor={rerolledFor}
        onMarkRerolled={() => setRerolledFor(rollCounter)}
        onSpendBenny={() => {
          setCharacter((c) =>
            c ? { ...c, bennies: Math.max(0, c.bennies - 1) } : c
          );
        }}
        resetDatabase={async () => {
          if (!confirm('Удалить все данные и начать заново?')) return;
          await db.characters.clear();
          location.reload();
        }}
      />
    </Outer>
  );
}

// ============================================================
// Компонент формы персонажа
// ============================================================

function SheetForm({
  character,
  setCharacter,
  fieldMap,
  setFieldMap,
  lastRoll,
  lastSkillName,
  setLastSkillName,
  hasRolled,
  onRoll,
  onNextTurn,
  isAdvancementOpen,
  setIsAdvancementOpen,
  isGM,
  rollCounter,
  rerolledFor,
  onMarkRerolled,
  onSpendBenny,
  resetDatabase,
}: {
  character: Character;
  setCharacter: React.Dispatch<React.SetStateAction<Character | null>>;
  fieldMap: FieldMap | null;
  setFieldMap: (map: FieldMap | null) => void;
  lastRoll: SkillRollResult | null;
  lastSkillName: string | null;
  setLastSkillName: (v: string | null) => void;
  hasRolled: boolean;
  onRoll: (r: SkillRollResult) => void;
  onNextTurn: () => void;
  isAdvancementOpen: boolean;
  setIsAdvancementOpen: (v: boolean) => void;
  isGM: boolean;
  rollCounter: number;
  rerolledFor: number | null;
  onMarkRerolled: () => void;
  onSpendBenny: () => void;
  resetDatabase: () => void;
}) {
  const derived = calculateDerivedStats(character);
  const rank = calculateRank(character.profile.xp);
  const available = calculateAvailableAdvancements(character.profile.xp);
  const remaining = calculateRemainingAdvancements(character);
  const totalPenalty = character.wounds + character.fatigue;

  function setAttribute(attr: AttributeName, die: DieType) {
    setCharacter((c) =>
      c ? { ...c, attributes: { ...c.attributes, [attr]: die } } : c
    );
  }

  function setSkillDie(skillName: string, die: DieType) {
    setCharacter((c) =>
      c
        ? {
            ...c,
            skills: c.skills.map((s) =>
              s.name === skillName ? { ...s, die } : s
            ),
          }
        : c
    );
  }

  function changeXp(delta: number) {
    setCharacter((c) =>
      c
        ? {
            ...c,
            profile: { ...c.profile, xp: Math.max(0, c.profile.xp + delta) },
          }
        : c
    );
  }

  function setWounds(value: number) {
    setCharacter((c) =>
      c ? { ...c, wounds: Math.max(0, Math.min(3, value)) } : c
    );
  }

  function setFatigue(value: number) {
    setCharacter((c) =>
      c ? { ...c, fatigue: Math.max(0, Math.min(2, value)) } : c
    );
  }

  function setBennies(value: number) {
    if (!isGM) return;
    setCharacter((c) => (c ? { ...c, bennies: Math.max(0, value) } : c));
  }

  function handleRollSkill(skillName: string) {
    if (hasRolled) return;
    const skill = character.skills.find((s) => s.name === skillName);
    if (!skill) return;
    const penalty = character.wounds + character.fatigue;
    const result = rollSkill(
      skill.die,
      skill.modifier - penalty,
      character.isWildCard
    );
    setLastSkillName(skillName);
    onRoll(result);
  }

  function handleReroll() {
    if (!lastRoll || !lastSkillName) return;
    if (character.bennies <= 0) return;
    if (lastRoll.hasAce) return;
    if (lastRoll.isCriticalFailure) return;
    if (rerolledFor === rollCounter) return;

    const skill = character.skills.find((s) => s.name === lastSkillName);
    if (!skill) return;

    onSpendBenny();

    const penalty = character.wounds + character.fatigue;
    const newResult = rollSkill(
      skill.die,
      skill.modifier - penalty,
      character.isWildCard
    );

    const finalResult: SkillRollResult =
      newResult.total >= lastRoll.total ? newResult : lastRoll;

    onMarkRerolled();
    onRoll(finalResult);
  }

  return (
    <>
      {/* --- Личные данные --- */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          value={character.profile.name}
          onChange={(e) =>
            setCharacter((c) =>
              c ? { ...c, profile: { ...c.profile, name: e.target.value } } : c
            )
          }
          placeholder="Имя персонажа"
          style={{
            fontSize: '28px',
            fontWeight: 'bold',
            border: 'none',
            borderBottom: '2px solid transparent',
            padding: '4px 0',
            width: '100%',
            outline: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) =>
            (e.target.style.borderBottom = '2px solid var(--accent)')
          }
          onBlur={(e) =>
            (e.target.style.borderBottom = '2px solid transparent')
          }
        />
        <input
          type="text"
          value={character.profile.concept}
          onChange={(e) =>
            setCharacter((c) =>
              c
                ? { ...c, profile: { ...c.profile, concept: e.target.value } }
                : c
            )
          }
          placeholder="Концепция персонажа"
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            border: 'none',
            padding: '4px 0',
            width: '100%',
            outline: 'none',
            backgroundColor: 'transparent',
          }}
        />
        <div
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            marginTop: '4px',
          }}
        >
          <strong>{rank}</strong> ({character.profile.xp} XP)
        </div>
      </div>

      {/* --- XP, ранения, усталость, фишки --- */}
      <div
        className="panel"
        style={{
          display: 'flex',
          gap: '32px',
          flexWrap: 'wrap',
          marginBottom: '24px',
        }}
      >
        <div>
          <strong>Опыт:</strong>{' '}
          <button onClick={() => changeXp(-1)} style={buttonStyle}>−</button>
          <span style={{ margin: '0 12px', fontSize: '20px', fontWeight: 'bold' }}>
            {character.profile.xp}
          </span>
          <button onClick={() => changeXp(+1)} style={buttonStyle}>+</button>
          <div className="tiny" style={{ marginTop: '4px' }}>
            Повышений: {available}, осталось: <strong>{remaining}</strong>
          </div>
        </div>

        <div>
          <strong>Ранения:</strong>{' '}
          <button onClick={() => setWounds(character.wounds - 1)} style={buttonStyle}>−</button>
          <span style={{ margin: '0 12px', fontSize: '20px', fontWeight: 'bold' }}>
            {character.wounds}
          </span>
          <button onClick={() => setWounds(character.wounds + 1)} style={buttonStyle}>+</button>
          <div className="tiny" style={{ marginTop: '4px' }}>
            Штраф: −{character.wounds}
          </div>
        </div>

        <div>
          <strong>Усталость:</strong>{' '}
          <button onClick={() => setFatigue(character.fatigue - 1)} style={buttonStyle}>−</button>
          <span style={{ margin: '0 12px', fontSize: '20px', fontWeight: 'bold' }}>
            {character.fatigue}
          </span>
          <button onClick={() => setFatigue(character.fatigue + 1)} style={buttonStyle}>+</button>
          <div className="tiny" style={{ marginTop: '4px' }}>
            {character.fatigue === 0 && 'Нет штрафа'}
            {character.fatigue === 1 && 'Утомлён: −1'}
            {character.fatigue === 2 && 'Истощён: −2'}
          </div>
        </div>

        <div>
          <strong>Фишки:</strong>{' '}
          <button
            onClick={() => setBennies(character.bennies - 1)}
            style={{
              ...buttonStyle,
              ...(!isGM
                ? { opacity: 0.4, cursor: 'not-allowed', pointerEvents: 'none' }
                : {}),
            }}
            disabled={!isGM}
            title={!isGM ? 'Только ведущий может изменять фишки' : undefined}
          >
            −
          </button>
          <span style={{ margin: '0 12px', fontSize: '20px', fontWeight: 'bold' }}>
            {character.bennies}
          </span>
          <button
            onClick={() => setBennies(character.bennies + 1)}
            style={{
              ...buttonStyle,
              ...(!isGM
                ? { opacity: 0.4, cursor: 'not-allowed', pointerEvents: 'none' }
                : {}),
            }}
            disabled={!isGM}
            title={!isGM ? 'Только ведущий может изменять фишки' : undefined}
          >
            +
          </button>
          {!isGM && (
            <div className="tiny" style={{ marginTop: '4px' }}>
              Выдаёт ведущий
            </div>
          )}
        </div>
      </div>

      {/* --- Кнопка повышения --- */}
      {remaining > 0 && (
        <button
          onClick={() => setIsAdvancementOpen(true)}
          className="btn btn-success"
          style={{ padding: '12px 24px', fontSize: '16px', marginBottom: '24px' }}
        >
          Повышение! (осталось {remaining})
        </button>
      )}

      {/* --- Атрибуты --- */}
      <h2>Характеристики</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {(Object.keys(character.attributes) as AttributeName[]).map((attr) => (
          <div
            key={attr}
            className="stat-box"
            style={{
              display: 'flex',
              flexDirection: 'column',
              textAlign: 'center',
            }}
          >
            <span className="stat-label" style={{ marginBottom: '8px' }}>
              {ATTRIBUTE_LABELS[attr]}
            </span>
            <select
              value={character.attributes[attr]}
              onChange={(e) => setAttribute(attr, e.target.value as DieType)}
              className="select"
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                textAlign: 'center',
                padding: '6px',
              }}
            >
              {DIE_OPTIONS.map((die) => (
                <option key={die} value={die}>{die}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* --- Производные --- */}
      <h2>Производные параметры</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <StatBox label="Защита" value={derived.parry} />
        <StatBox label="Стойкость" value={derived.toughness} />
        <StatBox label="Харизма" value={derived.charisma} />
        <StatBox label="Шаг" value={derived.pace} />
      </div>

      {/* --- Черты и изъяны --- */}
      <h2>Черты и изъяны</h2>
      <EdgesPanel character={character} onChange={setCharacter} />
      <HindrancesPanel character={character} onChange={setCharacter} />

      {/* --- Навыки --- */}
      <h2>Навыки</h2>
      {hasRolled && (
        <div
          className="tiny"
          style={{
            padding: '8px 12px',
            backgroundColor: 'var(--warning-soft)',
            color: 'var(--warning-text)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '8px',
            fontSize: '13px',
          }}
        >
          Действие уже выполнено. Нажмите «Следующее действие» ниже,
          чтобы разблокировать броски.
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {character.skills.map((skill) => (
          <div
            key={skill.name}
            className="panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              opacity: hasRolled ? 0.7 : 1,
            }}
          >
            <span style={{ flex: 1 }}>
              <strong>{skill.name}</strong>
              <span className="tiny" style={{ marginLeft: '8px', fontSize: '13px' }}>
                ({ATTRIBUTE_LABELS[skill.attribute]})
              </span>
              {totalPenalty > 0 && (
                <span
                  style={{
                    color: 'var(--danger)',
                    marginLeft: '8px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                >
                  штраф −{totalPenalty}
                </span>
              )}
            </span>
            <select
              value={skill.die}
              onChange={(e) => setSkillDie(skill.name, e.target.value as DieType)}
              className="select"
              style={{
                fontSize: '14px',
                fontWeight: 'bold',
                padding: '6px',
                width: 'auto',
                marginRight: '12px',
              }}
            >
              {DIE_OPTIONS.map((die) => (
                <option key={die} value={die}>{die}</option>
              ))}
            </select>
            <button
              onClick={() => handleRollSkill(skill.name)}
              className="btn btn-primary"
              disabled={hasRolled}
              style={
                hasRolled
                  ? {
                      opacity: 0.5,
                      cursor: 'not-allowed',
                    }
                  : undefined
              }
              title={
                hasRolled
                  ? 'Сначала завершите текущее действие'
                  : undefined
              }
            >
              Бросить
            </button>
          </div>
        ))}
      </div>

      {/* --- Результат броска --- */}
      <h2 style={{ marginTop: '24px' }}>Результат последнего броска</h2>
      {lastRoll ? (
        <RollResultDisplay
          result={lastRoll}
          bennies={character.bennies}
          canReroll={!!lastSkillName}
          onReroll={handleReroll}
          alreadyRerolled={rerolledFor === rollCounter}
          onNextTurn={onNextTurn}
        />
      ) : (
        <p className="muted">Нажмите «Бросить» у любого навыка.</p>
      )}

      {/* --- Модальное окно повышения --- */}
      {isAdvancementOpen && (
        <AdvancementDialog
          character={character}
          onApply={(updated) => setCharacter(updated)}
          onClose={() => setIsAdvancementOpen(false)}
        />
      )}

      {/* --- Экспорт и импорт --- */}
      <DataManager
        character={character}
        fieldMap={fieldMap}
        onImport={(newChar, newMap) => {
          setCharacter(newChar);
          setFieldMap(newMap);
        }}
      />

      {/* --- Кнопка сброса --- */}
      <hr className="hr" />
      <button onClick={resetDatabase} className="btn btn-danger">
        Сбросить все данные
      </button>
    </>
  );
}

// ============================================================
// Вспомогательные компоненты
// ============================================================

function Outer({
  width,
  children,
}: {
  width: number;
  children: React.ReactNode;
}) {
  return (
    <div className="app-container" style={{ maxWidth: `${width}px` }}>
      {children}
    </div>
  );
}

function TabBar({
  active,
  onChange,
  theme,
  onToggleTheme,
  role,
  onRoleChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  role: 'gm' | 'player';
  onRoleChange: (r: 'gm' | 'player') => void;
}) {
  return (
    <div className="tab-bar">
      <TabButton active={active === 'sheet'} onClick={() => onChange('sheet')}>
        <ScrollText size={16} />
        <span>Лист персонажа</span>
      </TabButton>
      <TabButton active={active === 'editor'} onClick={() => onChange('editor')}>
        <Wrench size={16} />
        <span>Редактор разметки</span>
      </TabButton>
      <TabButton active={active === 'rules'} onClick={() => onChange('rules')}>
        <BookOpen size={16} />
        <span>Правила</span>
      </TabButton>
      <TabButton active={active === 'bestiary'} onClick={() => onChange('bestiary')}>
        <Skull size={16} />
        <span>Бестиарий</span>
      </TabButton>
      {role === 'gm' && (
        <TabButton active={active === 'content'} onClick={() => onChange('content')}>
          <FileText size={16} />
          <span>Контент</span>
        </TabButton>
      )}
      {role === 'gm' && (
        <TabButton active={active === 'gm'} onClick={() => onChange('gm')}>
          <Users size={16} />
          <span>Ведущий</span>
        </TabButton>
      )}
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <RoleSwitcher role={role} onChange={onRoleChange} />
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`tab-button ${active ? 'active' : ''}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
    >
      {children}
    </button>
  );
}

function SheetModeToggle({
  mode,
  onChange,
  hasFieldMap,
}: {
  mode: SheetMode;
  onChange: (m: SheetMode) => void;
  hasFieldMap: boolean;
}) {
  const baseStyle: React.CSSProperties = {
    padding: '6px 14px',
    fontSize: '13px',
    border: '1px solid var(--accent)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
      <button
        onClick={() => onChange('form')}
        style={{
          ...baseStyle,
          backgroundColor: mode === 'form' ? 'var(--accent)' : 'var(--bg-primary)',
          color: mode === 'form' ? 'var(--text-inverse)' : 'var(--text-primary)',
        }}
      >
        📋 Форма
      </button>
      <button
        onClick={() => onChange('image')}
        style={{
          ...baseStyle,
          backgroundColor: mode === 'image' ? 'var(--accent)' : 'var(--bg-primary)',
          color: mode === 'image' ? 'var(--text-inverse)' : 'var(--text-primary)',
        }}
      >
        🖼️ Вид листа
      </button>
      {!hasFieldMap && (
        <div className="tiny" style={{ alignSelf: 'center', marginLeft: '12px' }}>
          (Сначала разметьте поля в редакторе)
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-box">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

// ============================================================
// Стили
// ============================================================

const buttonStyle: React.CSSProperties = {
  padding: '4px 12px',
  fontSize: '16px',
  fontWeight: 'bold',
  border: '1px solid var(--border-strong)',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
};