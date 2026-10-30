import { useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { dragCrop, type CropHandle, type Margins } from '../../../lib/organize/cropMath';

const handles: { handle: Exclude<CropHandle, 'move'>; className: string }[] = [
  { handle: 'top', className: 'crop-handle--top' },
  { handle: 'bottom', className: 'crop-handle--bottom' },
  { handle: 'left', className: 'crop-handle--left' },
  { handle: 'right', className: 'crop-handle--right' },
  { handle: 'topLeft', className: 'crop-handle--top-left' },
  { handle: 'topRight', className: 'crop-handle--top-right' },
  { handle: 'bottomLeft', className: 'crop-handle--bottom-left' },
  { handle: 'bottomRight', className: 'crop-handle--bottom-right' },
];

interface Props {
  margins: Margins;
  onChange: (margins: Margins) => void;
  labels: Record<CropHandle, string> & { area: string };
  disabled?: boolean;
}

/**
 * The draggable crop box drawn over a PagePreview. Positions are percentages of the page,
 * so the box lines up at any preview size. Every handle also works with arrow keys.
 */
export function CropOverlay({ margins, onChange, labels, disabled = false }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ handle: CropHandle; x: number; y: number; start: Margins; width: number; height: number }>(null);

  function begin(event: PointerEvent<HTMLElement>, handle: CropHandle) {
    if (disabled) return;
    // A handle sits inside the box; don't let the box start a move as well.
    event.stopPropagation();
    const page = boxRef.current?.parentElement?.getBoundingClientRect();
    if (!page) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { handle, x: event.clientX, y: event.clientY, start: margins, width: page.width, height: page.height };
  }

  function move(event: PointerEvent<HTMLElement>) {
    const current = drag.current;
    if (!current) return;
    const dx = (event.clientX - current.x) / current.width;
    const dy = (event.clientY - current.y) / current.height;
    onChange(dragCrop(current.start, current.handle, dx, dy));
  }

  function end() {
    drag.current = null;
  }

  function nudge(event: KeyboardEvent<HTMLElement>, handle: CropHandle) {
    const step = event.shiftKey ? 0.05 : 0.005;
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const d = delta[event.key];
    if (!d || disabled) return;
    event.preventDefault();
    event.stopPropagation();
    onChange(dragCrop(margins, handle, d[0], d[1]));
  }

  const pointerHandlers = { onPointerMove: move, onPointerUp: end, onPointerCancel: end };

  return (
    <div
      ref={boxRef}
      className="crop-box"
      role="group"
      aria-label={labels.area}
      tabIndex={disabled ? -1 : 0}
      title={labels.move}
      style={{
        left: `${margins.left * 100}%`,
        top: `${margins.top * 100}%`,
        right: `${margins.right * 100}%`,
        bottom: `${margins.bottom * 100}%`,
      }}
      onPointerDown={(event) => begin(event, 'move')}
      onKeyDown={(event) => nudge(event, 'move')}
      {...pointerHandlers}
    >
      {handles.map(({ handle, className }) => (
        <button
          key={handle}
          type="button"
          className={`crop-handle ${className}`}
          aria-label={labels[handle]}
          disabled={disabled}
          onPointerDown={(event) => begin(event, handle)}
          onKeyDown={(event) => nudge(event, handle)}
          {...pointerHandlers}
        />
      ))}
    </div>
  );
}
