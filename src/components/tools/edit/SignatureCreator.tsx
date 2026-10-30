import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';
import { format, type CommonMessages, type ToolMessages } from '../../../i18n';
import { Checkbox, Field, Segmented } from '../../ui/fields';
import { FilePicker } from '../../ui/FilePicker';
import { imageFromFile, isBlank, placedFromCanvas, trimTransparent, type PlacedImage } from './images';

type Method = 'draw' | 'type' | 'upload';

const INKS = { black: '#111111', blue: '#1a3d9e', red: '#b3261e' } as const;
type Ink = keyof typeof INKS;

/** Handwriting-style font stacks; each falls back to whatever cursive font the system has. */
export const SIGNATURE_FONTS = [
  "'Segoe Script', 'Snell Roundhand', 'Brush Script MT', cursive",
  "'Lucida Handwriting', 'Apple Chancery', 'URW Chancery L', cursive",
  "'Ink Free', 'Bradley Hand', 'Comic Sans MS', cursive",
] as const;

interface Props {
  t: ToolMessages<'sign'>;
  common: CommonMessages;
  onCreate: (signature: PlacedImage) => void;
  onCancel?: (() => void) | undefined;
}

export function SignatureCreator({ t, common, onCreate, onCancel }: Props) {
  const [method, setMethod] = useState<Method>('draw');
  const [ink, setInk] = useState<Ink>('black');
  const [name, setName] = useState('');
  const [fontIndex, setFontIndex] = useState(0);
  const [upload, setUpload] = useState<File>();
  const [removeWhite, setRemoveWhite] = useState(true);
  const [hasInk, setHasInk] = useState(false);
  const [error, setError] = useState<string>();
  const padRef = useRef<HTMLCanvasElement>(null);

  async function create() {
    setError(undefined);
    try {
      if (method === 'draw') {
        const canvas = padRef.current;
        if (!canvas || isBlank(canvas)) return setError(t.emptySignature);
        onCreate(await placedFromCanvas(trimTransparent(canvas)));
      } else if (method === 'type') {
        if (name.trim() === '') return setError(t.emptySignature);
        onCreate(await placedFromCanvas(renderTyped(name.trim(), SIGNATURE_FONTS[fontIndex]!, INKS[ink])));
      } else {
        if (!upload) return setError(t.emptySignature);
        onCreate(await imageFromFile(upload, { removeWhite }));
      }
    } catch (failure) {
      console.error(failure);
      setError(common.errors.unexpected);
    }
  }

  const ready = method === 'draw' ? hasInk : method === 'type' ? name.trim() !== '' : !!upload;

  return (
    <div className="panel">
      <h2 className="panel__heading">{t.createHeading}</h2>
      <Segmented
        label={t.methodLabel}
        value={method}
        onChange={(next) => {
          setMethod(next);
          setError(undefined);
        }}
        options={[
          { value: 'draw', label: t.methods.draw },
          { value: 'type', label: t.methods.type },
          { value: 'upload', label: t.methods.upload },
        ]}
      />

      {method !== 'upload' && (
        <fieldset className="segmented">
          <legend>{t.inkLabel}</legend>
          <div className="swatches">
            {(Object.keys(INKS) as Ink[]).map((key) => (
              <button
                key={key}
                type="button"
                className="swatch"
                style={{ background: INKS[key] }}
                aria-label={t.inks[key]}
                aria-pressed={ink === key}
                onClick={() => setInk(key)}
              />
            ))}
          </div>
        </fieldset>
      )}

      {method === 'draw' && (
        <>
          <p className="hint">{t.drawHint}</p>
          <SignaturePad canvasRef={padRef} ink={INKS[ink]} label={t.padLabel} onInk={setHasInk} />
          <div className="toolbar">
            <button
              type="button"
              className="link-button"
              onClick={() => {
                const canvas = padRef.current;
                canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
                setHasInk(false);
              }}
            >
              {t.clear}
            </button>
          </div>
        </>
      )}

      {method === 'type' && (
        <>
          <Field label={t.nameLabel}>
            {(id) => (
              <input id={id} type="text" autoComplete="name" value={name} onChange={(event) => setName(event.currentTarget.value)} />
            )}
          </Field>
          <fieldset className="segmented">
            <legend>{t.styleLabel}</legend>
            <div className="signature-styles">
              {SIGNATURE_FONTS.map((family, index) => (
                <label key={family} className={index === fontIndex ? 'signature-style is-selected' : 'signature-style'}>
                  <input
                    type="radio"
                    name="signature-style"
                    checked={index === fontIndex}
                    onChange={() => setFontIndex(index)}
                    aria-label={format(t.styleOption, { number: index + 1 })}
                  />
                  <span style={{ fontFamily: family, color: INKS[ink] }}>{name.trim() || t.nameLabel}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}

      {method === 'upload' && (
        <>
          <p className="hint">{t.uploadHint}</p>
          {upload ? (
            <UploadPreview file={upload} onClear={() => setUpload(undefined)} label={t.chooseImage} />
          ) : (
            <FilePicker common={common} kind="image" onFiles={([file]) => setUpload(file)} />
          )}
          <Checkbox label={t.removeBackground} checked={removeWhite} onChange={setRemoveWhite} />
        </>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="toolbar">
        <button type="button" className="primary-button" onClick={create} disabled={!ready}>
          {t.useSignature}
        </button>
        {onCancel && (
          <button type="button" className="link-button" onClick={onCancel}>
            {common.actions.startOver}
          </button>
        )}
      </div>
    </div>
  );
}

function UploadPreview({ file, onClear, label }: { file: File; onClear: () => void; label: string }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return (
    <div className="signature-preview">
      {url && <img src={url} alt="" />}
      <button type="button" className="link-button" onClick={onClear}>
        {label}
      </button>
    </div>
  );
}

/** Freehand drawing with smoothed strokes. The canvas keeps the ink at device resolution. */
function SignaturePad({
  canvasRef,
  ink,
  label,
  onInk,
}: {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  ink: string;
  label: string;
  onInk: (hasInk: boolean) => void;
}) {
  const points = useRef<{ x: number; y: number }[]>([]);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 3);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
  }, [canvasRef]);

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  function stroke(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d')!;
    const list = points.current;
    if (list.length < 2) return;
    context.strokeStyle = ink;
    context.lineWidth = Math.max(2, canvas.width / 260);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    // Quadratic curves through the midpoints give smooth lines without lag.
    const [a, b, c] = list.slice(-3);
    context.beginPath();
    if (!c) {
      context.moveTo(a!.x, a!.y);
      context.lineTo(b!.x, b!.y);
    } else {
      context.moveTo((a!.x + b!.x) / 2, (a!.y + b!.y) / 2);
      context.quadraticCurveTo(b!.x, b!.y, (b!.x + c.x) / 2, (b!.y + c.y) / 2);
    }
    context.stroke();
  }

  return (
    <div className="signature-pad">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          drawing.current = true;
          const start = point(event);
          points.current = [start, { x: start.x + 0.1, y: start.y + 0.1 }];
          stroke(event.currentTarget);
        }}
        onPointerMove={(event) => {
          if (!drawing.current) return;
          points.current.push(point(event));
          stroke(event.currentTarget);
        }}
        onPointerUp={() => {
          if (!drawing.current) return;
          drawing.current = false;
          points.current = [];
          onInk(true);
        }}
        onPointerCancel={() => {
          drawing.current = false;
          points.current = [];
        }}
      />
      <div className="signature-pad__line" />
    </div>
  );
}

/** Renders a typed name in a handwriting-style font. */
function renderTyped(name: string, family: string, ink: string): HTMLCanvasElement {
  const size = 120;
  const measure = document.createElement('canvas').getContext('2d')!;
  measure.font = `${size}px ${family}`;
  const width = Math.ceil(measure.measureText(name).width + size);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.ceil(size * 1.8);
  const context = canvas.getContext('2d')!;
  context.font = `${size}px ${family}`;
  context.fillStyle = ink;
  context.textBaseline = 'middle';
  context.fillText(name, size / 2, canvas.height / 2);
  return trimTransparent(canvas, 8);
}
