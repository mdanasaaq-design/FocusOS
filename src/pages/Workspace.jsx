import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ChevronDown, ChevronRight, Archive, FolderTree, Pencil, Check, X, SlidersHorizontal, Database, Palette, ExternalLink } from "lucide-react";
import { useAuth } from "../lib/auth";
import { addNode, archiveNode, subscribeNodes, updateNode, reparentNode } from "../data/nodes";
import { getNodeFieldValues, setNodeFieldValues } from "../data/nodeValues";
import { childrenOf, rootNodes } from "../domain/nodeTree";
import NodeFieldBuilder from "../components/NodeFieldBuilder";
import NodeCapabilityDataEditor from "../components/NodeCapabilityDataEditor";

function NodeItem({ node, allNodes, onAddChild, onRename, onArchive, onEditFields, onEditIdentity, onEnterData, onMove }) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(node.name);
  const [error, setError] = useState("");
  const [moving, setMoving] = useState(false);
  const [moveParentId, setMoveParentId] = useState(node.parentId || "");
  const children = childrenOf(allNodes, node.id);

  function startRename() {
    setDraftName(node.name);
    setError("");
    setEditing(true);
  }

  async function saveRename() {
    const nextName = draftName.trim();
    if (!nextName) {
      setError("Name cannot be empty.");
      return;
    }
    if (nextName === node.name) {
      setEditing(false);
      return;
    }
    try {
      await onRename(node.id, nextName);
      setEditing(false);
    } catch (err) {
      setError(err.message || "Unable to rename node.");
    }
  }

  function cancelRename() {
    setDraftName(node.name);
    setError("");
    setEditing(false);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") saveRename();
    if (event.key === "Escape") cancelRename();
  }

  return (
    <div className="ml-5 border-l border-ink-700/70 pl-4">
      <div className="flex items-start gap-2 group py-1.5">
        {children.length > 0 ? (
          <button type="button" onClick={() => setExpanded((value) => !value)} className="text-parchment-300 hover:text-parchment-100 mt-1" aria-label={expanded ? `Collapse ${node.name}` : `Expand ${node.name}`}>
            {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
        ) : <span className="w-[15px] mt-1" />}

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <input value={draftName} onChange={(event) => setDraftName(event.target.value)} onKeyDown={handleKeyDown} autoFocus className="min-w-0 flex-1 bg-ink-800 border border-brass-500 rounded-md px-2 py-1 text-sm outline-none" aria-label={`Rename ${node.name}`} />
              <button type="button" onClick={saveRename} className="p-1.5 rounded-md text-emerald-400 hover:bg-ink-700" title="Save name"><Check size={14} /></button>
              <button type="button" onClick={cancelRename} className="p-1.5 rounded-md text-parchment-300 hover:bg-ink-700" title="Cancel rename"><X size={14} /></button>
            </div>
          ) : <p className="text-sm font-medium truncate py-1 flex items-center gap-2"><span style={{ color: node.color || "#428475" }}>{node.icon || "◆"}</span>{node.name}</p>}
          {node.description && !editing && <p className="text-[11px] text-parchment-300/50 truncate">{node.description}</p>}
          {error && <p className="text-xs text-clay-400 mt-1">{error}</p>}
        </div>

        {!editing && (
          <>
            <Link to={`/workspace/node/${node.id}`} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-parchment-300 hover:bg-ink-700 hover:text-brass-400 transition-opacity" title={`Open ${node.name}`}><ExternalLink size={14} /></Link><button type="button" onClick={() => onEnterData(node)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-parchment-300 hover:bg-ink-700 hover:text-brass-400 transition-opacity" title={`Enter data for ${node.name}`}><Database size={14} /></button>
            <button type="button" onClick={() => onAddChild(node.id, node.name)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-parchment-300 hover:bg-ink-700 hover:text-brass-400 transition-opacity" title={`Add child to ${node.name}`}><Plus size={14} /></button>
            <button type="button" onClick={startRename} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-parchment-300 hover:bg-ink-700 hover:text-brass-400 transition-opacity" title={`Rename ${node.name}`}><Pencil size={14} /></button>
            <button type="button" onClick={() => onEditIdentity(node)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-parchment-300 hover:bg-ink-700 hover:text-brass-400 transition-opacity" title={`Edit identity for ${node.name}`}><Palette size={14} /></button>
            <button type="button" onClick={() => onEditFields(node)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-parchment-300 hover:bg-ink-700 hover:text-brass-400 transition-opacity" title={`Configure fields for ${node.name}`}><SlidersHorizontal size={14} /></button>
            <button type="button" onClick={() => { setMoveParentId(node.parentId || ""); setMoving(true); setError(""); }} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-parchment-300 hover:bg-ink-700 hover:text-brass-400 transition-opacity" title={`Move ${node.name}`}><FolderTree size={14} /></button>
            <button type="button" onClick={() => onArchive(node)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-parchment-300 hover:bg-ink-700 hover:text-clay-400 transition-opacity" title={`Archive ${node.name}`}><Archive size={14} /></button>
          </>
        )}
      </div>

      {moving && (
        <div className="ml-6 mb-2 rounded-lg border border-brass-500/30 bg-ink-800/60 p-3">
          <div className="flex flex-wrap items-end gap-2">
            <label className="flex-1 min-w-[220px] text-xs text-parchment-300">
              Move under
              <select value={moveParentId} onChange={(event) => setMoveParentId(event.target.value)} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm">
                <option value="">Root</option>
                {allNodes
                  .filter((candidate) => candidate.id !== node.id && !(Array.isArray(candidate.path) && candidate.path.includes(node.id)))
                  .sort((a, b) => (a.path?.length || 0) - (b.path?.length || 0) || a.name.localeCompare(b.name))
                  .map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {`${candidate.path?.length ? "↳ ".repeat(Math.min(candidate.path.length, 3)) : ""}${candidate.name}`}
                    </option>
                  ))}
              </select>
            </label>
            <button type="button" onClick={async () => {
              try {
                await onMove(node.id, moveParentId || null);
                setMoving(false);
              } catch (err) {
                setError(err.message || "Unable to move node.");
              }
            }} className="px-3 py-2 rounded-lg bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold text-sm">Move</button>
            <button type="button" onClick={() => setMoving(false)} className="px-3 py-2 rounded-lg border border-ink-600 text-sm">Cancel</button>
          </div>
        </div>
      )}

      {expanded && children.map((child) => (
        <NodeItem key={child.id} node={child} allNodes={allNodes} onAddChild={onAddChild} onRename={onRename} onArchive={onArchive} onEditFields={onEditFields} onEditIdentity={onEditIdentity} onEnterData={onEnterData} onMove={onMove} />
      ))}
    </div>
  );
}

function todayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function FieldInput({ field, value, onChange }) {
  const common = "w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500";

  if (field.type === "checkbox") {
    return <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4" /> {field.name}</label>;
  }

  if (field.type === "select") {
    return (
      <select value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={common}>
        <option value="">Select an option</option>
        {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    );
  }

  if (field.type === "tags") {
    return <input value={Array.isArray(value) ? value.join(", ") : value ?? ""} onChange={(event) => onChange(event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))} placeholder="tag1, tag2, tag3" className={common} />;
  }

  if (field.type === "file") {
    return <p className="text-xs text-parchment-300/60 border border-dashed border-ink-600 rounded-lg px-3 py-3">File storage will be connected in a later step.</p>;
  }

  const inputType = field.type === "number" || field.type === "percentage" ? "number" : ["date", "time", "url"].includes(field.type) ? field.type : "text";
  return <input type={inputType} value={value ?? ""} onChange={(event) => onChange(event.target.value)} placeholder={field.type === "duration" ? "e.g. 90 minutes" : ""} className={common} />;
}

function NodeDataEditor({ node, user, onClose }) {
  const [dateKey, setDateKey] = useState(todayKey);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const fields = Array.isArray(node.fields) ? node.fields : [];

  useEffect(() => {
    let active = true;
    setLoading(true);
    setMessage("");
    getNodeFieldValues(user.uid, node.id, dateKey)
      .then((nextValues) => { if (active) setValues(nextValues); })
      .catch((err) => { if (active) setMessage(err.message || "Unable to load saved data."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user, node.id, dateKey]);

  function updateValue(fieldId, value) {
    setValues((current) => ({ ...current, [fieldId]: value }));
    setMessage("");
  }

  async function saveValues(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await setNodeFieldValues(user.uid, node.id, values, dateKey);
      setMessage("Data saved ✓");
    } catch (err) {
      setMessage(err.message || "Unable to save data.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card p-6 border border-brass-500/40">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <p className="text-xs text-brass-500">Node data</p>
          <h3 className="font-semibold">Enter data for {node.name}</h3>
          <p className="text-xs text-parchment-300/60 mt-1">Values are stored separately from the node definition and preserved by date.</p>
        </div>
        <button type="button" onClick={onClose} className="p-1.5 rounded-md text-parchment-300 hover:bg-ink-700" title="Close"><X size={16} /></button>
      </div>

      <div className="mb-5 max-w-xs">
        <label htmlFor="node-data-date" className="block text-xs text-parchment-300 mb-1">Date</label>
        <input id="node-data-date" type="date" value={dateKey} onChange={(event) => setDateKey(event.target.value)} className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500" />
      </div>

      {fields.length === 0 ? (
        <div className="border border-dashed border-ink-600 rounded-xl p-8 text-center">
          <Database size={24} className="mx-auto text-parchment-300/40 mb-3" />
          <p className="text-sm font-medium">This node has no custom fields.</p>
          <p className="text-xs text-parchment-300/60 mt-1">Configure fields first, then you can enter data here.</p>
        </div>
      ) : loading ? (
        <p className="text-sm text-parchment-300/60">Loading saved data…</p>
      ) : (
        <form onSubmit={saveValues} className="space-y-4">
          {fields.map((field) => (
            <div key={field.id}>
              {field.type === "checkbox" ? (
                <FieldInput field={field} value={values[field.id]} onChange={(value) => updateValue(field.id, value)} />
              ) : (
                <>
                  <label htmlFor={`field-${field.id}`} className="block text-xs text-parchment-300 mb-1">{field.name}{field.required ? " *" : ""}</label>
                  <FieldInput field={field} value={values[field.id]} onChange={(value) => updateValue(field.id, value)} />
                  {field.unit && <p className="text-[11px] text-parchment-300/50 mt-1">Unit: {field.unit}</p>}
                </>
              )}
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-ink-700">
            <p className={`text-sm ${message.includes("✓") ? "text-emerald-400" : "text-clay-400"}`}>{message}</p>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold text-sm">{saving ? "Saving…" : "Save data"}</button>
          </div>
        </form>
      )}

      <NodeCapabilityDataEditor node={node} user={user} dateKey={dateKey} />
    </section>
  );
}

export default function Workspace() {
  const { user } = useAuth();
  const [nodes, setNodes] = useState([]);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState(null);
  const [parentLabel, setParentLabel] = useState("");
  const [fields, setFields] = useState([]);
  const [editingFieldsNode, setEditingFieldsNode] = useState(null);
  const [editingIdentityNode, setEditingIdentityNode] = useState(null);
  const [identityDraft, setIdentityDraft] = useState({ description: "", icon: "◆", color: "#428475" });
  const [presentationDraft, setPresentationDraft] = useState({ showInNavigation: false, showOnDashboard: false, collapsedByDefault: false, navigationOrder: 0, dashboardOrder: 0 });
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [dataNode, setDataNode] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingFields, setSavingFields] = useState(false);

  useEffect(() => {
    if (!user) return;
    return subscribeNodes(user.uid, "core", setNodes);
  }, [user]);

  const roots = useMemo(() => rootNodes(nodes), [nodes]);

  function openAddChild(nextParentId, nextParentLabel) {
    setParentId(nextParentId);
    setParentLabel(nextParentLabel);
    setName("");
    setFields([]);
    setError("");
    document.getElementById("workspace-node-name")?.focus();
  }

  function openAddRoot() {
    setParentId(null);
    setParentLabel("");
    setName("");
    setFields([]);
    setError("");
    document.getElementById("workspace-node-name")?.focus();
  }

  async function handleAdd(event) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !user) return;
    setSaving(true);
    setError("");
    try {
      await addNode(user.uid, { parentId, name: trimmed, fields });
      setName("");
      setParentId(null);
      setParentLabel("");
      setFields([]);
    } catch (err) {
      setError(err.message || "Unable to create node.");
    } finally {
      setSaving(false);
    }
  }

  async function handleMove(nodeId, nextParentId) {
    if (!user) return;
    await reparentNode(user.uid, nodeId, nextParentId);
  }

  async function handleRename(nodeId, nextName) {
    if (!user) return;
    await updateNode(user.uid, nodeId, { name: nextName });
  }

  async function handleArchive(node) {
    if (!user) return;
    const confirmed = window.confirm(`Archive “${node.name}”? Its history will be preserved, but it will no longer appear in your active workspace.`);
    if (!confirmed) return;
    try {
      await archiveNode(user.uid, node.id, true);
      if (dataNode?.id === node.id) setDataNode(null);
    } catch (err) {
      setError(err.message || "Unable to archive node.");
    }
  }

  function openIdentityEditor(node) {
    setEditingIdentityNode(node);
    setIdentityDraft({
      description: node.description || "",
      icon: node.icon || "◆",
      color: node.color || "#428475",
    });
    setError("");
  }

  function closeIdentityEditor() {
    setEditingIdentityNode(null);
    setIdentityDraft({ description: "", icon: "◆", color: "#428475" });\n    setPresentationDraft({ showInNavigation: false, showOnDashboard: false, collapsedByDefault: false, navigationOrder: 0, dashboardOrder: 0 });
  }

  async function saveIdentity() {
    if (!user || !editingIdentityNode) return;
    setSavingIdentity(true);
    setError("");
    try {
      await updateNode(user.uid, editingIdentityNode.id, { ...identityDraft, presentation: presentationDraft });
      closeIdentityEditor();
    } catch (err) {
      setError(err.message || "Unable to save node identity.");
    } finally {
      setSavingIdentity(false);
    }
  }

  function openFieldEditor(node) {
    setEditingFieldsNode(node);
    setFields(Array.isArray(node.fields) ? node.fields : []);
    setError("");
  }

  function closeFieldEditor() {
    setEditingFieldsNode(null);
    setFields([]);
  }

  async function saveFields() {
    if (!user || !editingFieldsNode) return;
    setSavingFields(true);
    setError("");
    try {
      await updateNode(user.uid, editingFieldsNode.id, { fields });
      closeFieldEditor();
    } catch (err) {
      setError(err.message || "Unable to save custom fields.");
    } finally {
      setSavingFields(false);
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-brass-500 mb-1">Universal workspace</p>
          <h2 className="text-2xl font-display font-semibold">Workspace</h2>
          <p className="text-sm text-parchment-300/70 mt-1">Build your own structure. Every item is a node, and nodes can contain unlimited children.</p>
        </div>
        <button type="button" onClick={openAddRoot} className="inline-flex items-center gap-2 bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold rounded-lg px-4 py-2 text-sm"><Plus size={16} /> Add root page</button>
      </header>

      <section className="card p-6">
        <form onSubmit={handleAdd} className="space-y-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[240px]">
              <label htmlFor="workspace-node-name" className="block text-xs text-parchment-300 mb-1">{parentLabel ? `New child page under ${parentLabel}` : "New root page"}</label>
              <input id="workspace-node-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Page name..." className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500" />
            </div>
            <button type="submit" disabled={saving || !name.trim()} className="inline-flex items-center gap-2 bg-ink-700 hover:bg-ink-600 disabled:opacity-40 disabled:cursor-not-allowed border border-ink-600 text-parchment-100 font-semibold rounded-lg px-4 py-2 text-sm"><Plus size={16} /> {saving ? "Creating…" : "Create page"}</button>
          </div>

          <div className="border-t border-ink-700 pt-5">
            <h3 className="text-sm font-semibold mb-1">Page data fields</h3>
            <p className="text-xs text-parchment-300/60 mb-4">Define the information this page can store. You can change these fields later.</p>
            <NodeFieldBuilder fields={fields} onChange={setFields} />
          </div>
        </form>
        {error && <p className="text-sm text-clay-400 mt-3">{error}</p>}
      </section>

      {dataNode && user && <NodeDataEditor node={dataNode} user={user} onClose={() => setDataNode(null)} />}

            {editingIdentityNode && (
        <section className="card p-6 border border-brass-500/40">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <p className="text-xs text-brass-500">Node identity</p>
              <h3 className="font-semibold">Configure {editingIdentityNode.name}</h3>
              <p className="text-xs text-parchment-300/60 mt-1">Define how this node identifies itself. These properties do not change its hierarchy.</p>
            </div>
            <button type="button" onClick={closeIdentityEditor} className="p-1.5 rounded-md text-parchment-300 hover:bg-ink-700" title="Close"><X size={16} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr] gap-4 items-start">
            <label className="text-xs text-parchment-300">
              Icon
              <input value={identityDraft.icon} onChange={(event) => setIdentityDraft((current) => ({ ...current, icon: event.target.value.slice(0, 4) }))} placeholder="◆" className="mt-1 w-20 bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-lg text-center outline-none focus:border-brass-500" />
            </label>
            <label className="text-xs text-parchment-300">
              Color
              <div className="mt-1 flex items-center gap-2">
                <input type="color" value={identityDraft.color} onChange={(event) => setIdentityDraft((current) => ({ ...current, color: event.target.value }))} className="h-10 w-14 bg-transparent border-0" />
                <input value={identityDraft.color} onChange={(event) => setIdentityDraft((current) => ({ ...current, color: event.target.value }))} className="flex-1 bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500" />
              </div>
            </label>
            <label className="text-xs text-parchment-300">
              Description
              <textarea value={identityDraft.description} onChange={(event) => setIdentityDraft((current) => ({ ...current, description: event.target.value }))} placeholder="What is this node for?" rows={3} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500 resize-y" />
            </label>
          </div>

          <div className="mt-5 pt-5 border-t border-ink-700 space-y-4">\n            <div><p className="text-sm font-semibold">Page visibility & placement</p><p className="text-[11px] text-parchment-300/60">A page only appears in the left sidebar when you explicitly allow it.</p></div>\n            <label className="flex items-center justify-between gap-4 text-sm"><span><span className="block">Show in left sidebar</span><span className="block text-[11px] text-parchment-300/50">Open this page directly from navigation.</span></span><input type="checkbox" checked={presentationDraft.showInNavigation === true} onChange={(event) => setPresentationDraft((current) => ({ ...current, showInNavigation: event.target.checked }))} className="h-4 w-4 accent-brass-500" /></label>\n            <label className="flex items-center justify-between gap-4 text-sm"><span><span className="block">Allow dashboard presentation</span><span className="block text-[11px] text-parchment-300/50">Make this page available for dashboard widgets.</span></span><input type="checkbox" checked={presentationDraft.showOnDashboard === true} onChange={(event) => setPresentationDraft((current) => ({ ...current, showOnDashboard: event.target.checked }))} className="h-4 w-4 accent-brass-500" /></label>\n            <label className="flex items-center justify-between gap-4 text-sm"><span>Collapsed by default in hierarchy</span><input type="checkbox" checked={presentationDraft.collapsedByDefault === true} onChange={(event) => setPresentationDraft((current) => ({ ...current, collapsedByDefault: event.target.checked }))} className="h-4 w-4 accent-brass-500" /></label>\n            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><label className="text-xs text-parchment-300">Sidebar order<input type="number" min="0" value={presentationDraft.navigationOrder ?? 0} onChange={(event) => setPresentationDraft((current) => ({ ...current, navigationOrder: Math.max(0, Number(event.target.value) || 0) }))} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm" /></label><label className="text-xs text-parchment-300">Dashboard order<input type="number" min="0" value={presentationDraft.dashboardOrder ?? 0} onChange={(event) => setPresentationDraft((current) => ({ ...current, dashboardOrder: Math.max(0, Number(event.target.value) || 0) }))} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm" /></label></div>\n          </div>\n\n          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-ink-700">
            <button type="button" onClick={closeIdentityEditor} className="px-4 py-2 rounded-lg border border-ink-600 text-sm">Cancel</button>
            <button type="button" onClick={saveIdentity} disabled={savingIdentity} className="px-4 py-2 rounded-lg bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold text-sm">{savingIdentity ? "Saving…" : "Save identity"}</button>
          </div>
        </section>
      )}

      {editingFieldsNode && (
        <section className="card p-6 border border-brass-500/40">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs text-brass-500">Node builder</p>
              <h3 className="font-semibold">Data fields for {editingFieldsNode.name}</h3>
              <p className="text-xs text-parchment-300/60 mt-1">These fields define what information this page can hold.</p>
            </div>
            <button type="button" onClick={closeFieldEditor} className="p-1.5 rounded-md text-parchment-300 hover:bg-ink-700" title="Close"><X size={16} /></button>
          </div>
          <NodeFieldBuilder fields={fields} onChange={setFields} />
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-ink-700">
            <button type="button" onClick={closeFieldEditor} className="px-4 py-2 rounded-lg border border-ink-600 text-sm">Cancel</button>
            <button type="button" onClick={saveFields} disabled={savingFields} className="px-4 py-2 rounded-lg bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold text-sm">{savingFields ? "Saving…" : "Save fields"}</button>
          </div>
        </section>
      )}

      <section className="card p-6">
        <div className="flex items-center gap-2 mb-5"><FolderTree size={18} className="text-brass-400" /><div><h3 className="font-semibold">Your page hierarchy</h3><p className="text-xs text-parchment-300/60 mt-0.5">{nodes.length} active page{nodes.length === 1 ? "" : "s"}</p></div></div>
        {roots.length === 0 ? (
          <div className="border border-dashed border-ink-600 rounded-xl p-10 text-center"><FolderTree size={28} className="mx-auto text-parchment-300/40 mb-3" /><p className="text-sm font-medium">No pages yet.</p><p className="text-xs text-parchment-300/60 mt-1">Create a page, then nest other pages underneath it. Each page can later be configured with fields, capabilities and visibility.</p><button type="button" onClick={openAddRoot} className="mt-4 inline-flex items-center gap-2 text-sm text-brass-400 hover:text-brass-300"><Plus size={15} /> Create your first page</button></div>
        ) : (
          <div className="space-y-1">{roots.map((root) => <NodeItem key={root.id} node={root} allNodes={nodes} onAddChild={openAddChild} onRename={handleRename} onArchive={handleArchive} onEditFields={openFieldEditor} onEditIdentity={openIdentityEditor} onEnterData={setDataNode} onMove={handleMove} />)}</div>
        )}
      </section>
    </div>
  );
}
