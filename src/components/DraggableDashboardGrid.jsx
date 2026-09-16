import { useRef, useState } from "react";

const GAP = 16;
const ROW = 84;

export default function DraggableDashboardGrid({ columns, widgets, renderWidget, onChange }) {
  const ref = useRef(null);
  const [drag, setDrag] = useState(null);

  function pointerDown(event, widget) {
    if (event.button !== 0 || event.target.closest("button")) return;
    event.preventDefault();
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const cell = (rect.width - (columns - 1) * GAP) / columns;
    setDrag({ key: widget.key, x: event.clientX, y: event.clientY, ox: widget.x, oy: widget.y, cell, id: event.pointerId });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function move(event) {
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    const sx = drag.cell + GAP;
    const sy = ROW + GAP;
    onChange(widgets.map((w) => w.key === drag.key ? {
      ...w,
      x: Math.max(0, Math.min(columns - w.w, Math.round((drag.ox * sx + dx) / sx))),
      y: Math.max(0, Math.round((drag.oy * sy + dy) / sy)),
    } : w));
  }

  function end() {
    if (!drag) return;
    setDrag(null);
  }

  return (
    <div ref={ref} className="grid gap-4 items-stretch" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gridAutoRows: `${ROW}px` }} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
      {widgets.map((widget) => (
        <div key={widget.key} style={{ gridColumn: `${widget.x + 1} / span ${Math.min(widget.w, columns - widget.x)}`, gridRow: `${widget.y + 1} / span ${Math.max(1, widget.h)}`, minHeight: `${Math.max(1, widget.h) * ROW}px` }} className={`relative min-w-0 ${drag?.key === widget.key ? "z-20 cursor-grabbing" : "cursor-grab"}`} onPointerDown={(e) => pointerDown(e, widget)}>
          <div className={`h-full rounded-xl ${drag?.key === widget.key ? "ring-2 ring-brass-500/70 shadow-2xl" : ""}`}>
            {renderWidget(widget.key)}
          </div>
        </div>
      ))}
    </div>
  );
}
