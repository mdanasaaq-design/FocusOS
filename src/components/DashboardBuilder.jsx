import { useMemo } from "react";
import { DASHBOARD_WIDGETS, DASHBOARD_ANALYSIS_SOURCES, normalizeDashboard, createNodeDashboardWidget } from "../modules/dashboard";

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

export default function DashboardBuilder({ dashboard, onChange, nodes = [], trackers = [] }) {
  const current = normalizeDashboard(dashboard);
  const ordered = useMemo(() => [...current.widgets].sort((a, b) => a.order - b.order), [current.widgets]);

  function updateDashboard(patch) { onChange(normalizeDashboard({ ...current, ...patch })); }

  function updateWidget(id, patch) {
    updateDashboard({ widgets: ordered.map((widget) => (widget.id || widget.key) === id ? { ...widget, ...patch } : widget) });
  }

  function toggleWidget(id) {
    const existing = ordered.find((widget) => (widget.id || widget.key) === id);
    if (existing) return updateWidget(id, { enabled: !existing.enabled });
    const y = ordered.reduce((max, widget) => Math.max(max, widget.y + widget.h), 0);
    updateDashboard({ widgets: [...ordered, { key: id, enabled: true, order: ordered.length, x: 0, y, w: Math.min(6, current.columns), h: 3 }] });
  }

  function addNodeWidget(nodeId, capabilityKey) {
    const node = nodes.find((item) => item.id === nodeId);
    if (!node || !capabilityKey) return;
    const y = ordered.reduce((max, widget) => Math.max(max, widget.y + widget.h), 0);
    const widget = createNodeDashboardWidget({ nodeId, nodeName: node.name, capabilityKey, view: "summary", x: 0, y, w: Math.min(6, current.columns), h: 3 });
    updateDashboard({ widgets: [...ordered, { ...widget, order: ordered.length }] });
  }

  function moveWidget(id, direction) {
    const index = ordered.findIndex((widget) => (widget.id || widget.key) === id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= ordered.length) return;
    const widgets = [...ordered];
    [widgets[index], widgets[next]] = [widgets[next], widgets[index]];
    updateDashboard({ widgets: widgets.map((widget, i) => ({ ...widget, order: i })) });
  }

  function updateColumns(value) {
    const columns = clamp(Number(value) || 12, 1, 12);
    updateDashboard({ columns, widgets: ordered.map((widget) => ({ ...widget, w: clamp(widget.w, 1, columns), x: clamp(widget.x, 0, Math.max(0, columns - clamp(widget.w, 1, columns))) })) });
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs text-parchment-300 mb-1">Dashboard name</label>
        <input value={current.name} onChange={(event) => updateDashboard({ name: event.target.value })} placeholder="Dashboard" className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500" />
      </div>

      <div>
        <label className="block text-xs text-parchment-300 mb-1">Grid columns</label>
        <select value={current.columns} onChange={(event) => updateColumns(event.target.value)} className="bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none">
          {Array.from({ length: 12 }, (_, index) => index + 1).map((columns) => <option key={columns} value={columns}>{columns} columns</option>)}
        </select>
      </div>

      <div className="border border-ink-600 rounded-xl p-4 space-y-3">
        <div><p className="text-sm font-medium">Node dashboard binding</p><p className="text-[11px] text-parchment-300/60">Bind a capability from a specific Node to the Dashboard. This does not change the Node hierarchy.</p></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select id="dashboard-node" className="bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm">
            <option value="">Select a node</option>
            {nodes.filter((node) => !node.archived && node.presentation?.showOnDashboard !== false).sort((a,b) => (a.presentation?.dashboardOrder ?? 0) - (b.presentation?.dashboardOrder ?? 0) || a.name.localeCompare(b.name)).map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}
          </select>
          <select id="dashboard-capability" className="bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm">
            <option value="">Select capability</option>
            {Array.from(new Set(nodes.flatMap((node) => Array.isArray(node.capabilities) ? node.capabilities : []))).sort().map((key) => <option key={key} value={key}>{key}</option>)}
          </select>
        </div>
        <button type="button" onClick={() => { const n=document.getElementById("dashboard-node")?.value; const cap=document.getElementById("dashboard-capability")?.value; addNodeWidget(n, cap); }} className="px-4 py-2 rounded-lg bg-ink-700 hover:bg-ink-600 border border-ink-600 text-sm">Add Node widget</button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div><p className="text-sm font-medium">Widgets</p><p className="text-[11px] text-parchment-300/60">Configure visibility, order, position, size and presentation.</p></div>
          <select value="" onChange={(event) => event.target.value && toggleWidget(event.target.value)} className="bg-ink-700 border border-ink-600 rounded-lg px-2 py-1.5 text-xs">
            <option value="">Add widget…</option>
            {DASHBOARD_WIDGETS.filter((definition) => !ordered.some((widget) => widget.key === definition.key)).map((definition) => <option key={definition.key} value={definition.key}>{definition.label}</option>)}
          </select>
        </div>

        <div className="space-y-3">
          {ordered.map((widget, index) => {
            const definition = DASHBOARD_WIDGETS.find((item) => item.key === widget.key);
            const label = widget.type === "node-capability" ? `${widget.config?.nodeName || widget.nodeId} · ${widget.capabilityKey}` : definition?.label;
            if (!label) return null;
            const width = clamp(widget.w, 1, current.columns);
            const maxX = Math.max(0, current.columns - width);
            const id = widget.id || widget.key;
            return (
              <div key={id} className="border border-ink-600 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={widget.enabled} onChange={() => toggleWidget(id)} className="mt-1 h-4 w-4 accent-brass-500" />
                  <div className="flex-1"><p className="text-sm font-medium">{label}</p><p className="text-[11px] text-parchment-300/60">{definition?.description || "Node-bound capability presentation."}</p></div>
                  <button type="button" disabled={index === 0} onClick={() => moveWidget(id, -1)} className="px-2 py-1 rounded bg-ink-700 text-xs disabled:opacity-30">↑</button>
                  <button type="button" disabled={index === ordered.length - 1} onClick={() => moveWidget(id, 1)} className="px-2 py-1 rounded bg-ink-700 text-xs disabled:opacity-30">↓</button><button type="button" onClick={() => {
                    const clone = { ...widget, id: `${id}:copy:${Date.now()}`, key: widget.key, order: ordered.length, y: ordered.reduce((max, item) => Math.max(max, item.y + item.h), 0) };
                    updateDashboard({ widgets: [...ordered, clone] });
                  }} className="px-2 py-1 rounded bg-ink-700 text-xs">Duplicate</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label className="text-[11px] text-parchment-300/70">X<input type="number" min="0" max={maxX} value={clamp(widget.x,0,maxX)} onChange={(e)=>updateWidget(id,{x:clamp(Number(e.target.value)||0,0,maxX),w:width})} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-2 py-1.5 text-xs" /></label>
                  <label className="text-[11px] text-parchment-300/70">Y<input type="number" min="0" value={Math.max(0,widget.y)} onChange={(e)=>updateWidget(id,{y:Math.max(0,Number(e.target.value)||0)})} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-2 py-1.5 text-xs" /></label>
                  <label className="text-[11px] text-parchment-300/70">Width<input type="number" min="1" max={current.columns} value={width} onChange={(e)=>{const w=clamp(Number(e.target.value)||1,1,current.columns);updateWidget(id,{w,x:clamp(widget.x,0,current.columns-w)})}} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-2 py-1.5 text-xs" /></label>
                  <label className="text-[11px] text-parchment-300/70">Height<input type="number" min="1" value={Math.max(1,widget.h)} onChange={(e)=>updateWidget(id,{h:Math.max(1,Number(e.target.value)||1)})} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-2 py-1.5 text-xs" /></label>
                </div>
                {definition?.type === "analysis" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-lg border border-ink-700 bg-ink-800/30 p-3">
                    <label className="text-[11px] text-parchment-300/70">Data source
                      <select value={widget.config?.source || "habitCompletion"} onChange={(e)=>updateWidget(id,{config:{...widget.config,source:e.target.value}})} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-2 py-1.5 text-xs">
                        {DASHBOARD_ANALYSIS_SOURCES.map((source)=><option key={source.key} value={source.key}>{source.label}</option>)}
                      </select>
                    </label>
                    {widget.config?.source === "tracker" && (
                      <label className="text-[11px] text-parchment-300/70">Tracker
                        <select value={widget.config?.trackerId || ""} onChange={(e)=>updateWidget(id,{config:{...widget.config,trackerId:e.target.value}})} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-2 py-1.5 text-xs">
                          <option value="">Select tracker</option>
                          {trackers.map((tracker)=><option key={tracker.id} value={tracker.id}>{tracker.name}</option>)}
                        </select>
                      </label>
                    )}
                    {widget.config?.source === "tracker" && trackers.length === 0 && <p className="text-[11px] text-parchment-300/50 md:col-span-2">Add a tracker to a Page to use tracker data here.</p>}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-[11px] text-parchment-300/70"><input type="checkbox" checked={widget.config?.collapsed === true} onChange={(e)=>updateWidget(id,{config:{...widget.config,collapsed:e.target.checked}})} className="h-4 w-4 accent-brass-500" /> Collapsed</label>
                  <label className="text-[11px] text-parchment-300/70">View
                    <select value={widget.view || "default"} onChange={(e)=>updateWidget(id,{view:e.target.value})} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-2 py-1.5 text-xs">
                      <option value="default">Default</option><option value="summary">Summary</option><option value="compact">Compact</option><option value="progress">Progress</option>
                    </select>
                  </label>
                  <label className="text-[11px] text-parchment-300/70">Title override
                    <input value={widget.config?.title || ""} onChange={(e)=>updateWidget(id,{config:{...widget.config,title:e.target.value}})} placeholder="Optional" className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-2 py-1.5 text-xs" />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
