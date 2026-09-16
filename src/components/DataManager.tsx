import { useRef, useState } from 'react';
import { Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import type { Character } from '../models/character';
import type { FieldMap } from '../types/fieldmap';
import { exportToJson, importFromJson, db } from '../db/database';

interface Props {
  character: Character;
  fieldMap: FieldMap | null;
  onImport: (character: Character, fieldMap: FieldMap | null) => void;
}

/**
 * Панель управления данными: экспорт и импорт персонажа в JSON.
 */
export function DataManager({ character, fieldMap, onImport }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{
    type: 'ok' | 'error';
    text: string;
  } | null>(null);

  function handleExport() {
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

      setMessage({ type: 'ok', text: 'Файл сохранён.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Не удалось сохранить файл.' });
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
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
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        await db.characters.put(newChar);
        if (newMap) {
          await db.fieldMaps.put(newMap);
        }

        onImport(newChar, newMap);

        setMessage({
          type: 'ok',
          text: `Персонаж «${newChar.profile.name}» загружен.`,
        });
        setTimeout(() => setMessage(null), 3000);
      } catch (err) {
        console.error(err);
        const msg = err instanceof Error ? err.message : 'Неизвестная ошибка.';
        setMessage({ type: 'error', text: msg });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  }

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

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={handleExport}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Download size={16} />
          <span>Экспорт в файл</span>
        </button>
        <button
          onClick={handleImportClick}
          className="btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Upload size={16} />
          <span>Импорт из файла</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleFileSelected}
          style={{ display: 'none' }}
        />
      </div>

      {message && (
        <div
          style={{
            marginTop: '10px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor:
              message.type === 'ok'
                ? 'var(--success-soft)'
                : 'var(--danger-soft)',
            color:
              message.type === 'ok'
                ? 'var(--success-text)'
                : 'var(--danger-text)',
          }}
        >
          {message.type === 'ok' ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="tiny" style={{ marginTop: '10px' }}>
        Экспорт сохраняет персонажа и карту разметки в один JSON-файл.
        При импорте текущий персонаж будет заменён.
      </div>
    </div>
  );
}