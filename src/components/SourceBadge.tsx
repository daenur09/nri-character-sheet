import { getSource } from '../data/sources';

interface Props {
  sourceId?: string;
  /** Маленький размер (для карточек). */
  small?: boolean;
}

/**
 * Бейдж источника контента — цветной ярлычок с названием.
 */
export function SourceBadge({ sourceId, small }: Props) {
  const source = getSource(sourceId);
  if (!source) return null;

  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: small ? '10px' : '11px',
        fontWeight: 'bold',
        padding: small ? '1px 6px' : '2px 8px',
        borderRadius: '4px',
        backgroundColor: source.color,
        color: '#ffffff',
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
      }}
      title={source.description}
    >
      {source.shortName}
    </span>
  );
}