import { useEffect, useState } from 'react';

/** Copies `text` to the clipboard and confirms for a moment. */
export function CopyButton({
  text,
  labels,
}: {
  text: string;
  labels: { copy: string; copied: string; copyFailed: string };
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  useEffect(() => {
    if (state !== 'copied') return;
    const timer = setTimeout(() => setState('idle'), 2000);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <>
      <button
        type="button"
        className="secondary-button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setState('copied');
          } catch {
            setState('failed');
          }
        }}
      >
        {state === 'copied' ? labels.copied : labels.copy}
      </button>
      {state === 'failed' && (
        <p className="warning" role="status">
          {labels.copyFailed}
        </p>
      )}
    </>
  );
}
