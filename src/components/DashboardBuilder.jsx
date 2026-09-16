import { useMemo } from "react";
import { DASHBOARD_WIDGETS, normalizeDashboard } from "../modules/dashboard";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default function DashboardBuilder({ dashboard, onChange }) {
  const current = normalizeDashboard(dashboard);
  const ordered = useMemo(() => [...current.widgets].sort((a, b) => a.order - b.order), [current.widgets]);

  function updateDashboard(patch) {
    onChange(normalizeDashboard({ ...current, ...patch }));
  }

  function updateWidget(key, patch) {
    updateDashboard({
      widgets: ordered.map((widget) => widget.key === key ? { ...widget, ...patch } : widget),
    });
  }

  function toggleWidget(key) {
    const existing = ordered.find((widget) => widget.key === key);
    if (existing) {
      updateWidget(key, { enabled: !existing.enabled });
      return;
    }
    const y = ordered.reduce((max, widget) => Math.max(max, widget.y + widget.h), 0);
    updateDashboard({
      widgets: [...ordered, { key, enabled: true, order: ordered.length, x: 0, y, w: Math.min(6, current.columns), h: 3 }],
    });
  }

  function moveWidget(key, direction) {
    const index = ordered.findIndex((widget) => widget.key === key);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= ordered.length) return;
    const widgets = [...ordered];
    [widgets[index], widgets[next]] = [widgets[next], widgets[index]];
    updateDashboard({ widgets: widgets.map((widget, i) => ({ ...widget, order: i })) });
  }

  function updateColumns(value) {
    const columns = clamp(Number(value) || 12, 1, 12);
    updateDashboard({
      columns,
      widgets: ordered.map((widget) => ({
        ...widget,
        w: clamp(widget.w, 1, columns),
        x: clamp(widget.x, 0, Math.max(0, columns - clamp(widget.w, 1, columns))),
      })),
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs text-parchment-300 mb-1">Dashboard name</label>
        <input
          value={current.name}
          onChange={(event) => updateDashboard({ name: event.target.value })}
          placeholder="Dashboard"
          className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500"
        />
      </div>

      <div>
        <label className="block text-xs text-parchment-300 mb-1">Grid columns</label>
        <select
          value={current.columns}
          onChange={(event) => updateColumns(event.target.value)}
          className="bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none"
        >
          {Array.from({ length: 12 }, (_, index) => index + 1).map((columns) => (
            <option key={columns} value={columns}>{columns} columns</option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-medium">Widgets</p>
            <p className="text-[11px] text-parchment-300/60">Configure visibility, order, position and size.</p>
          </div>
          <select
            value=""
            onChange={(event) => event.target.value && toggleWidget(event.target.value)}
            className="bg-ink-700 border border-ink-600 rounded-lg px-2 py-1.5 text-xs"
          >
            <option value="">Add widget…</option>
            {DASHBOARD_WIDGETS.filter((definition) => !ordered.some((widget) => widget.key === definition.key)).map((definition) => (
              <option key={definition.key} value={definition.key}>{definition.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {ordered.map((widget, index) => {
            const definition = DASHBOARD_WIDGETS.find((item) => item.key === widget.key);
            if (!definition) return null;
            const width = clamp(widget.w, 1, current.columns);
            const maxX = Math.max(0, current.columns - width);
            return (
              <div key={widget.key} className="border border-ink-600 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={widget.enabled} onChange={() => toggleWidget(widget.key)} className="mt-1 h-4 w-4 accent-brass-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{definition.label}</p>
                    <p className="text-[11px] text-parchment-300/60">{definition.description}</p>
                  </div>
                  <button type="button" disabled={index === 0} onClick={() => moveWidget(widget.key, -1)} className="px-2 py-1 rounded bg-ink-700 text-xs disabled:opacity-30">↑</button>
                  <button type="button" disabled={index === ordered.length - 1} onClick={() => moveWidget(widget.key, 1)} className="px-2 py-1 rounded bg-ink-700 text-xs disabled:opacity-30">↓</button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label className="text-[11px] text-parchment-300/70">X<input type="number" min="0" max={maxX} value={clamp(widget.x, 0, maxX)} onChange={(event) => updateWidget(widget.key, { x: clamp(Number(event.target.value) || 0, 0, maxX), w: width })} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-2 py-1.5 text-xs text-parchment-100" /></label>
                  <label className="text-[11px] text-parchment-300/70">Y<input type="number" min="0" value={Math.max(0, widget.y)} onChange={(event) => updateWidget(widget.key, { y: Math.max(0, Number(event.target.value) || 0) })} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-2 py-1.5 text-xs text-parchment-100" /></label>
                  <label className="text-[11px] text-parchment-300/70">Width<input type="number" min="1" max={current.columns} value={width} onChange={(event) => { const w = clamp(Number(event.target.value) || 1, 1, current.columns); updateWidget(widget.key, { w, x: clamp(widget.x, 0, current.columns - w) }); }} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-2 py-1.5 text-xs text-parchment-100" /></label>
                  <label className="text-[11px] text-parchment-300/70">Height<input type="number" min="1" value={Math.max(1, widget.h)} onChange={(event) => updateWidget(widget.key, { h: Math.max(1, Number(event.target.value) || 1) })} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-2 py-1.5 text-xs text-parchment-100" /></label>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
