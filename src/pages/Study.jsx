import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Archive, RotateCcw, FolderTree } from "lucide-react";
import { useAuth } from "../lib/auth";
import { addNode, archiveNode, reparentNode, subscribeNodes } from "../data/nodes";
import { childrenOf } from "../domain/nodeTree";

function Tree({ nodes, parentId, selectedId, onSelect, level = 0 }) {
  return childrenOf(nodes, parentId).map((node) => {
    const children = childrenOf(nodes, node.id);
    return <div key={node.id}>
      <button type="button" onClick={() => onSelect(node.id)} className={"w-full text-left flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-ink-800 " + (selectedId === node.id ? "bg-brass-500/10 text-brass-400" : "text-parchment-300")} style={{paddingLeft: 12 + level * 18}}>
        <span style={{color: node.color || "#428475"}}>{node.icon || "◆"}</span><span className="truncate">{node.name}</span>
      </button>
      {children.length > 0 && <Tree nodes={nodes} parentId={node.id} selectedId={selectedId} onSelect={onSelect} level={level + 1}/>}
    </div>;
  });
}

export default function Study() {
  const { user } = useAuth();
  const [nodes, setNodes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState("");
  useEffect(() => user ? subscribeNodes(user.uid, "study", setNodes, { includeArchived: true }) : undefined, [user]);
  const active = useMemo(() => nodes.filter(n => !n.archived), [nodes]);
  const selected = nodes.find(n => n.id === selectedId) || null;
  async function createNode(e) {
    e.preventDefault(); if (!name.trim()) return; setError("");
    try { const ref = await addNode(user.uid, { moduleKey: "study", parentId: parentId || null, name: name.trim(), tracking: { type: "derived", period: "daily" } }); setName(""); setSelectedId(ref.id); }
    catch (err) { setError(err.message || "Unable to create node."); }
  }
  async function moveSelected(nextParent) {
    try { await reparentNode(user.uid, selected.id, nextParent || null); }
    catch (err) { setError(err.message || "Unable to move node."); }
  }
  return <div className="space-y-5 max-w-6xl mx-auto">
    {error && <div role="alert" className="card px-4 py-3 text-sm text-clay-300">{error}</div>}
    <header><p className="text-xs uppercase tracking-widest text-brass-500">Universal hierarchy</p><h1 className="text-2xl font-display font-semibold mt-1">Study / Work</h1><p className="text-sm text-parchment-300/60 mt-1">Build any depth: College → Semester → Subject → Unit → Topic → Resource.</p></header>
    <div className="grid lg:grid-cols-[1fr_320px] gap-5">
      <section className="card p-4"><div className="flex items-center justify-between mb-3"><h2 className="font-semibold flex items-center gap-2"><FolderTree size={16}/> Study tree</h2><span className="text-xs text-parchment-300/50">{active.length} active nodes</span></div><div className="rounded-xl border border-ink-700 p-2"><Tree nodes={active} parentId={null} selectedId={selectedId} onSelect={setSelectedId}/></div></section>
      <aside className="space-y-5">
        <form onSubmit={createNode} className="card p-5 space-y-3"><h2 className="font-semibold flex items-center gap-2"><Plus size={16}/> Add node</h2><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Neural Networks" className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm"/><select value={parentId} onChange={e=>setParentId(e.target.value)} className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm"><option value="">Root</option>{active.map(n=><option key={n.id} value={n.id}>{n.name}</option>)}</select><button className="w-full bg-brass-500 text-ink-950 font-semibold rounded-lg px-3 py-2 text-sm">Create</button></form>
        {selected && <section className="card p-5 space-y-4"><div><p className="text-xs text-brass-500 uppercase">Selected</p><h2 className="font-semibold mt-1">{selected.name}</h2><p className="text-xs text-parchment-300/50 mt-1">{selected.path?.length || 0} ancestors</p></div><div className="flex gap-2"><Link to={"/pages/node/"+selected.id} className="flex-1 text-center border border-ink-600 rounded-lg px-3 py-2 text-xs">Open node</Link><button onClick={()=>archiveNode(user.uid, selected.id, !selected.archived)} className="border border-ink-600 rounded-lg px-3 py-2 text-xs">{selected.archived ? <RotateCcw size={14}/> : <Archive size={14}/>}</button></div><select value={selected.parentId || ""} onChange={e=>moveSelected(e.target.value)} className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-xs"><option value="">Move to root</option>{active.filter(n=>n.id!==selected.id && !(selected.path||[]).includes(n.id)).map(n=><option key={n.id} value={n.id}>{n.name}</option>)}</select></section>}
      </aside>
    </div>
  </div>;
}
