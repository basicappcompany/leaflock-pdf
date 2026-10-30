import type { ToolMessages } from '../../../i18n';
import type { DiffPart } from '../../../lib/secure/textDiff';

/** One page's text with removed words struck through and added words underlined. */
export function TextDiffView({ parts, t }: { parts: DiffPart[]; t: ToolMessages<'compare'> }) {
  if (parts.length === 0) return <p className="muted">{t.noText}</p>;
  return (
    <div className="text-diff">
      <p className="text-diff__legend" aria-hidden="true">
        <ins>{t.legendAdded}</ins> <del>{t.legendRemoved}</del>
      </p>
      <p className="text-diff__body">
        {parts.map((part, index) => {
          const text = part.words.join(' ');
          const spaced = index < parts.length - 1 ? `${text} ` : text;
          if (part.type === 'insert') {
            return (
              <ins key={index} aria-label={`${t.legendAdded}: ${text}`}>
                {spaced}
              </ins>
            );
          }
          if (part.type === 'delete') {
            return (
              <del key={index} aria-label={`${t.legendRemoved}: ${text}`}>
                {spaced}
              </del>
            );
          }
          return <span key={index}>{spaced}</span>;
        })}
      </p>
    </div>
  );
}
