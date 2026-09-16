import { useRef, useState } from "react";

const GAP = 16;
const ROW = 84;

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function resolveCollisions(widgets, changedKey) {
  const next = widgets.map((widget) => ({ ...widget }));
  const moved = next.find((widget) => widget.key === changedKey);
  if (!moved) return next;

  const queue = [moved];
  const seen = new Set();
  while (queue.length) {
    const current = queue.shift();
    if (seen.has(current.key)) continue;
    seen.add(current.key);
    next.forEach((other) => {
      if (other.key === current.key || !overlaps(current, other)) return;
      other.y = current.y + current.h;
      queue.push(other);
      seen.delete(other.key);
    });
  }
  return next;
}

export default function DraggableDashboardGrid({ columns, widgets, renderWidget, onChange, editable = false }) {
  const ref = useRef(null);
  const [drag, setDrag] = useState(null);

  function pointerDown(event, widget) {
    if (!editable || event.button !== 0 || event.target.closest("button") || event.target.dataset.resize) return;
    event.preventDefault();
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const cell = (rect.width - (columns - 1) * GAP) / columns;
    setDrag({ key: widget.key, x: event.clientX, y: event.clientY, ox: widget.x, oy: widget.y, ow: widget.w, oh: widget.h, cell, resize: false });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function resizeDown(event, widget) {
    if (!editable) return;
    event.stopPropagation(); event.preventDefault();
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const cell = (rect.width - (columns - 1) * GAP) / columns;
    setDrag({ key: widget.key, x: event.clientX, y: event.clientY, ox: widget.x, oy: widget.y, ow: widget.w, oh: widget.h, cell, resize: true });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function move(event) {
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    const sx = drag.cell + GAP;
    const sy = ROW + GAP;
    let changed;
    if (drag.resize) {
      const width = Math.max(1, Math.min(columns - drag.ox, Math.round((drag.ow * sx + dx) / sx)));
      const height = Math.max(1, Math.round((drag.oh * sy + dy) / sy));
      changed = widgets.map((w) => w.key === drag.key ? { ...w, w: width, h: height } : w);
    } else {
      changed = widgets.map((w) => w.key === drag.key ? { ...w, x: Math.max(0, Math.min(columns - w.w, Math.round((drag.ox * sx + dx) / sx))), y: Math.max(0, Math.round((drag.oy * sy + dy) / sy)) } : w);
    }
    onChange(resolveCollisions(changed, drag.key));
  }

  function end() { setDrag(null); }

  return (
    <div ref={ref} className="grid gap-4 items-stretch" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gridAutoRows: `${ROW}px` }} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
      {widgets.map((widget) => (
        <div key={widget.key} style={{ gridColumn: `${widget.x + 1} / span ${Math.min(widget.w, columns - widget.x)}`, gridRow: `${widget.y + 1} / span ${Math.max(1, widget.h)}`, minHeight: `${Math.max(1, widget.h) * ROW}px` }} className={`relative min-w-0 ${editable ? "cursor-grab" : ""} ${drag?.key === widget.key ? "z-20 cursor-grabbing" : ""}`} onPointerDown={(e) => pointerDown(e, widget)}>
          <div className={`h-full rounded-xl ${drag?.key === widget.key ? "ring-2 ring-brass-500/70 shadow-2xl" : ""}`}>
            {renderWidget(widget.key)}
            {editable && <div data-resize="true" onPointerDown={(e) => resizeDown(e, widget)} className="absolute right-1 bottom-1 h-5 w-5 cursor-se-resize rounded-sm bg-brass-500/80 opacity-70 hover:opacity-100" aria-label="Resize widget" title="Resize widget" />}
          </div>
        </div>
      ))}
    </div>
  );
}
