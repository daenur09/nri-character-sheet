import { useRef, useState } from 'react';
import {
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Package,
  Trash2,
} from 'lucide-react';
import type { Character } from '../models/character';
import type { FieldMap } from '../types/fieldmap';
import { exportToJson, importFromJson, db } from '../db/database';
import {
  exportCustomContent,
  importCustomContent,
} from '../db/customContent';
import { useCustomContent } from '../hooks/useCustomContent';

interface Props {
  character: Character;
  fieldMap: FieldMap | null;
  onImport: (character: Character, fieldMap: FieldMap | null) => void;
}

type Message = { type: 'ok' | 'error'; text: string } | null;

/**
 * Панель управления данными.
 *
 * Две независимые секции:
 *  1. Персонаж — экспорт и импорт одного персонажа в JSON-файл.
 *  2. Кастомный контент — экспорт/импорт/сброс всей пользовательской
 *     библиотеки (черты, изъяны, навыки, силы, монстры).
 */
export function DataManager({ character, fieldMap, onImport }: Props) {
  const characterFileInputRef = useRef<HTMLInputElement>(null);
  const customFileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<Message>(null);
  const [customMessage, setCustomMessage] = useState<Message>(null);
  const [isBusy, setIsBusy] = useState(false);

  const {
    customEdges,
    customHindrances,
    customSkills,
    customPowers,
    customMonsters,
    reload,
  } = useCustomContent();

  const totalCustom =
    (customEdges?.length ?? 0) +
    (customHindrances?.length ?? 0) +
    (customSkills?.length ?? 0) +
    (customPowers?.length ?? 0) +
    (customMonsters?.length ?? 0);

  function flashMessage(
    setter: (m: Message) => void,
    type: 'ok' | 'error',
    text: string,
    timeout = 3000
  ) {
    setter({ type, text });
    setTimeout(() => setter(null), timeout);
  }

  // ============================================================
  // Персонаж
  // ============================================================

  function handleExportCharacter() {
    try {
      const json = exportToJson(character, fieldMap);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = character.profile.name.replace(/[^\w\u0400-\u04FF]+/g, '_');
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `${safeName || 'character'}_${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      flashMessage(setMessage, 'ok', 'Файл сохранён.');
    } catch (err) {
      console.error(err);
      flashMessage(setMessage, 'error', 'Не удалось сохранить файл.');
    }
  }

  function handleImportCharacterClick() {
    characterFileInputRef.current?.click();
  }

  function handleCharacterFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = reader.result as string;
        const { character: newChar, fieldMap: newMap } = importFromJson(text);

        if (
          !confirm(
            `Загрузить персонажа «${newChar.profile.name}»?\n\n` +
              `Внимание: текущий персонаж будет заменён. ` +
              `Рекомендуем сначала сохранить его через «Экспорт».`
          )
        ) {
          if (characterFileInputRef.current) characterFileInputRef.current.value = '';
          return;
        }

        await db.characters.put(newChar);
        if (newMap) {
          await db.fieldMaps.put(newMap);
        }

        onImport(newChar, newMap);
        flashMessage(setMessage, 'ok', `Персонаж «${newChar.profile.name}» загружен.`);
      } catch (err) {
        console.error(err);
        const msg = err instanceof Error ? err.message : 'Неизвестная ошибка.';
        flashMessage(setMessage, 'error', msg);
      } finally {
        if (characterFileInputRef.current) characterFileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  }

  // ============================================================
  // Кастомный контент
  // ============================================================

  async function handleExportCustom() {
    try {
      setIsBusy(true);
      const json = await exportCustomContent();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `nri-custom-content_${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      flashMessage(setCustomMessage, 'ok', `Экспортировано элементов: ${totalCustom}.`);
    } catch (err) {
      console.error(err);
      flashMessage(setCustomMessage, 'error', 'Не удалось экспортировать кастомный контент.');
    } finally {
      setIsBusy(false);
    }
  }

  function handleImportCustomClick() {
    customFileInputRef.current?.click();
  }

  function handleCustomFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        setIsBusy(true);
        const text = reader.result as string;

        if (
          !confirm(
            'Импортировать кастомный контент?\n\n' +
              'Элементы с теми же id будут заменены. ' +
              'Остальные — добавятся к существующим.'
          )
        ) {
          if (customFileInputRef.current) customFileInputRef.current.value = '';
          return;
        }

        const counts = await importCustomContent(text);
        await reload();

        const total =
          counts.edges +
          counts.hindrances +
          counts.skills +
          counts.powers +
          counts.monsters;

        const summary =
          `Черты: ${counts.edges}, Изъяны: ${counts.hindrances}, ` +
          `Навыки: ${counts.skills}, Силы: ${counts.powers}, Монстры: ${counts.monsters}`;

        flashMessage(
          setCustomMessage,
          'ok',
          `Импортировано элементов: ${total}. ${summary}`,
          8000
        );

        if (
          confirm(
            `Импортировано элементов: ${total}.\n${summary}\n\n` +
              'Обновить страницу сейчас, чтобы изменения отобразились во всех панелях?'
          )
        ) {
          window.location.reload();
        }
      } catch (err) {
        console.error(err);
        const msg = err instanceof Error ? err.message : 'Неизвестная ошибка.';
        flashMessage(setCustomMessage, 'error', msg, 6000);
      } finally {
        setIsBusy(false);
        if (customFileInputRef.current) customFileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  }

  async function handleResetCustom() {
    if (
      !confirm(
        `Удалить ВСЁ кастомное содержимое (${totalCustom} элементов)?\n\n` +
          'Это действие нельзя отменить. Рекомендуем сначала сделать экспорт.'
      )
    ) {
      return;
    }
    try {
      setIsBusy(true);
      await Promise.all([
        db.customEdges.clear(),
        db.customHindrances.clear(),
        db.customSkills.clear(),
        db.customPowers.clear(),
        db.customMonsters.clear(),
      ]);
      await reload();
      flashMessage(setCustomMessage, 'ok', 'Кастомный контент очищен.');
    } catch (err) {
      console.error(err);
      flashMessage(setCustomMessage, 'error', 'Не удалось очистить кастомный контент.');
    } finally {
      setIsBusy(false);
    }
  }

  // ============================================================
  // Рендер
  // ============================================================

  return (
    <div className="panel" style={{ marginTop: '24px' }}>
      <h3
        style={{
          marginTop: 0,
          marginBottom: '12px',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Download size={18} />
        <span>Экспорт и импорт</span>
      </h3>

      {/* ==== Секция: персонаж ==== */}
      <h4 style={{ marginTop: 0, marginBottom: '8px', fontSize: '14px' }}>
        Персонаж
      </h4>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={handleExportCharacter}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Download size={16} />
          <span>Экспорт персонажа</span>
        </button>
        <button
          onClick={handleImportCharacterClick}
          className="btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Upload size={16} />
          <span>Импорт персонажа</span>
        </button>
        <input
          ref={characterFileInputRef}
          type="file"
          accept="application/json"
          onChange={handleCharacterFileSelected}
          style={{ display: 'none' }}
        />
      </div>

      {message && <MessageBar message={message} />}

      <div className="tiny" style={{ marginTop: '10px' }}>
        Экспорт сохраняет персонажа и карту разметки в один JSON-файл.
        При импорте текущий персонаж будет заменён.
      </div>

      {/* ==== Разделитель ==== */}
      <hr
        className="hr"
        style={{ marginTop: '20px', marginBottom: '16px' }}
      />

      {/* ==== Секция: кастомный контент ==== */}
      <h4
        style={{
          marginTop: 0,
          marginBottom: '8px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <Package size={16} />
        <span>Кастомный контент</span>
      </h4>

      <div
        className="tiny"
        style={{
          marginBottom: '10px',
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-tertiary)',
        }}
      >
        <strong>Черты:</strong> {customEdges?.length ?? 0} ·{' '}
        <strong>Изъяны:</strong> {customHindrances?.length ?? 0} ·{' '}
        <strong>Навыки:</strong> {customSkills?.length ?? 0} ·{' '}
        <strong>Силы:</strong> {customPowers?.length ?? 0} ·{' '}
        <strong>Монстры:</strong> {customMonsters?.length ?? 0}
        <div style={{ marginTop: '4px', fontStyle: 'italic' }}>
          Всего: {totalCustom} элементов
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={handleExportCustom}
          className="btn btn-primary"
          disabled={isBusy || totalCustom === 0}
          title={totalCustom === 0 ? 'Нет кастомного контента для экспорта' : undefined}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            ...(isBusy || totalCustom === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
          }}
        >
          <Download size={16} />
          <span>Экспорт кастомного контента</span>
        </button>

        <button
          onClick={handleImportCustomClick}
          className="btn"
          disabled={isBusy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            ...(isBusy ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
          }}
        >
          <Upload size={16} />
          <span>Импорт кастомного контента</span>
        </button>

        <button
          onClick={handleResetCustom}
          className="btn btn-danger"
          disabled={isBusy || totalCustom === 0}
          title={totalCustom === 0 ? 'Нечего сбрасывать' : 'Удалить весь кастомный контент'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            ...(isBusy || totalCustom === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
          }}
        >
          <Trash2 size={16} />
          <span>Сбросить кастомный контент</span>
        </button>

        <input
          ref={customFileInputRef}
          type="file"
          accept="application/json"
          onChange={handleCustomFileSelected}
          style={{ display: 'none' }}
        />
      </div>

      {customMessage && <MessageBar message={customMessage} />}

      <div className="tiny" style={{ marginTop: '10px' }}>
        Экспорт сохраняет <strong>всю пользовательскую библиотеку</strong>{' '}
        (черты, изъяны, навыки, силы, монстры) в один JSON-файл.
        Такой файл можно перенести на другую машину или отдать другому ведущему.
      </div>
    </div>
  );
}

/**
 * Единый компонент сообщения (успех/ошибка).
 */
function MessageBar({ message }: { message: NonNullable<Message> }) {
  return (
    <div
      style={{
        marginTop: '10px',
        padding: '8px 12px',
        borderRadius: 'var(--radius-md)',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        backgroundColor:
          message.type === 'ok' ? 'var(--success-soft)' : 'var(--danger-soft)',
        color:
          message.type === 'ok' ? 'var(--success-text)' : 'var(--danger-text)',
      }}
    >
      {message.type === 'ok' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      <span style={{ whiteSpace: 'pre-line' }}>{message.text}</span>
    </div>
  );
}