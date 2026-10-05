import { useRef, useState } from "react";

const GAP = 16;
const ROW = 84;

function normalizeLayout(widgets, columns) {
  return widgets.map((widget, index) => {
    const w = Math.max(1, Math.min(columns, Number(widget.w) || 1));
    const h = Math.max(1, Number(widget.h) || 1);
    return {
      ...widget,
      x: Math.max(0, Math.min(columns - w, Number(widget.x) || 0)),
      y: Math.max(0, Number(widget.y) || 0),
      w,
      h,
      order: Number.isFinite(widget.order) ? widget.order : index,
    };
  });
}

export default function DraggableDashboardGrid({ columns, widgets, renderWidget, onChange = () => {}, editable = false }) {
  const displayWidgets = normalizeLayout(widgets, columns);
  const ref = useRef(null);
  const [drag, setDrag] = useState(null);

  function pointerDown(event, widget) {
    if (!editable || event.button !== 0 || event.target.closest("button") || event.target.dataset.resize) return;
    event.preventDefault();
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const cell = (rect.width - (columns - 1) * GAP) / columns;
    setDrag({ key: widget.id || widget.key, x: event.clientX, y: event.clientY, ox: widget.x, oy: widget.y, ow: widget.w, oh: widget.h, cell, resize: false });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function resizeDown(event, widget) {
    if (!editable) return;
    event.stopPropagation(); event.preventDefault();
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const cell = (rect.width - (columns - 1) * GAP) / columns;
    setDrag({ key: widget.id || widget.key, x: event.clientX, y: event.clientY, ox: widget.x, oy: widget.y, ow: widget.w, oh: widget.h, cell, resize: true });
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
      changed = widgets.map((w) => (w.id || w.key) === drag.key ? { ...w, w: width, h: height } : w);
    } else {
      changed = widgets.map((w) => (w.id || w.key) === drag.key ? { ...w, x: Math.max(0, Math.min(columns - w.w, Math.round((drag.ox * sx + dx) / sx))), y: Math.max(0, Math.round((drag.oy * sy + dy) / sy)) } : w);
    }
    onChange(normalizeLayout(changed, columns));
  }

  function end() { setDrag(null); }

  return (
    <>
      <style>{`@media (max-width: 767px) { .focusos-dashboard-grid { grid-template-columns: minmax(0, 1fr) !important; } .focusos-dashboard-grid-item { grid-column: 1 / -1 !important; grid-row: auto !important; min-height: 0 !important; overflow: visible !important; } .focusos-dashboard-grid-item [data-resize="true"] { display: none; } }`}</style>
      <div ref={ref} className="focusos-dashboard-grid grid gap-4 items-stretch" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gridAutoRows: `${ROW}px` }} onPointerMove={move} onPointerUp={end} onPointerCancel={end} onPointerLeave={(event) => { if (drag && event.buttons === 0) end(); }}>
        {displayWidgets.map((widget) => (
          <div key={widget.id || widget.key} className={`focusos-dashboard-grid-item relative min-w-0 ${editable ? "cursor-grab" : ""} ${drag?.key === (widget.id || widget.key) ? "z-20 cursor-grabbing focusos-dragging" : ""}`} style={editable
              ? { gridColumn: `${widget.x + 1} / span ${Math.min(widget.w, columns - widget.x)}`, gridRow: `${widget.y + 1} / span ${widget.config?.collapsed ? 1 : Math.max(1, widget.h)}`, minHeight: `${widget.config?.collapsed ? ROW : Math.max(1, widget.h) * ROW}px`, overflow: "visible", touchAction: "none" }
              : { gridColumn: `span ${Math.min(Math.max(1, widget.w), columns)}`, gridRow: `span ${Math.max(1, Math.min(5, Number(widget.h) || 3))}`, minHeight: 0, overflow: "visible" }} onPointerDown={(e) => pointerDown(e, widget)}>
            <div className={`h-full rounded-xl ${drag?.key === widget.key ? "ring-2 ring-brass-500/70 shadow-2xl" : ""}`}>
              {renderWidget(widget)}
              {editable && <div data-resize="true" onPointerDown={(e) => resizeDown(e, widget)} className="absolute right-1 bottom-1 h-5 w-5 cursor-se-resize rounded-sm bg-brass-500/80 opacity-70 hover:opacity-100" aria-label="Resize widget" title="Resize widget" />}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
