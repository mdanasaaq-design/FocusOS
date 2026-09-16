import { useEffect, useMemo, useState } from "react";
import { Plus, ChevronDown, ChevronRight, Archive, FolderTree } from "lucide-react";
import { useAuth } from "../lib/auth";
import { addNode, archiveNode, subscribeNodes } from "../data/nodes";
import { childrenOf, rootNodes } from "../domain/nodeTree";

function NodeItem({ node, allNodes, onAddChild, onArchive }) {
  const [expanded, setExpanded] = useState(true);
  const children = childrenOf(allNodes, node.id);

  return (
    <div className="ml-5 border-l border-ink-700/70 pl-4">
      <div className="flex items-center gap-2 group py-1.5">
        {children.length > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="text-parchment-300 hover:text-parchment-100"
            aria-label={expanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
          >
            {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
        ) : (
          <span className="w-[15px]" />
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{node.name}</p>
        </div>

        <button
          type="button"
          onClick={() => onAddChild(node.id, node.name)}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-parchment-300 hover:bg-ink-700 hover:text-brass-400 transition-opacity"
          title={`Add child to ${node.name}`}
        >
          <Plus size={14} />
        </button>
        <button
          type="button"
          onClick={() => onArchive(node)}
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-parchment-300 hover:bg-ink-700 hover:text-clay-400 transition-opacity"
          title={`Archive ${node.name}`}
        >
          <Archive size={14} />
        </button>
      </div>

      {expanded && children.map((child) => (
        <NodeItem
          key={child.id}
          node={child}
          allNodes={allNodes}
          onAddChild={onAddChild}
          onArchive={onArchive}
        />
      ))}
    </div>
  );
}

export default function Workspace() {
  const { user } = useAuth();
  const [nodes, setNodes] = useState([]);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState(null);
  const [parentLabel, setParentLabel] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    return subscribeNodes(user.uid, "core", setNodes);
  }, [user]);

  const roots = useMemo(() => rootNodes(nodes), [nodes]);

  function openAddChild(nextParentId, nextParentLabel) {
    setParentId(nextParentId);
    setParentLabel(nextParentLabel);
    setName("");
    setError("");
    document.getElementById("workspace-node-name")?.focus();
  }

  function openAddRoot() {
    setParentId(null);
    setParentLabel("");
    setName("");
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
      await addNode(user.uid, { parentId, name: trimmed });
      setName("");
      setParentId(null);
      setParentLabel("");
    } catch (err) {
      setError(err.message || "Unable to create node.");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(node) {
    if (!user) return;
    await archiveNode(user.uid, node.id, true);
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-brass-500 mb-1">Universal workspace</p>
          <h2 className="text-2xl font-display font-semibold">Workspace</h2>
          <p className="text-sm text-parchment-300/70 mt-1">
            Build your own structure. Every item is a node, and nodes can contain unlimited children.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddRoot}
          className="inline-flex items-center gap-2 bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold rounded-lg px-4 py-2 text-sm"
        >
          <Plus size={16} />
          Add root
        </button>
      </header>

      <section className="card p-6">
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px]">
            <label htmlFor="workspace-node-name" className="block text-xs text-parchment-300 mb-1">
              {parentLabel ? `New child under ${parentLabel}` : "New root node"}
            </label>
            <input
              id="workspace-node-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Personal, Project, Health..."
              className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="inline-flex items-center gap-2 bg-ink-700 hover:bg-ink-600 disabled:opacity-40 disabled:cursor-not-allowed border border-ink-600 text-parchment-100 font-semibold rounded-lg px-4 py-2 text-sm"
          >
            <Plus size={16} />
            {saving ? "Adding…" : "Add node"}
          </button>
        </form>
        {error && <p className="text-sm text-clay-400 mt-3">{error}</p>}
      </section>

      <section className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <FolderTree size={18} className="text-brass-400" />
          <div>
            <h3 className="font-semibold">Your structure</h3>
            <p className="text-xs text-parchment-300/60 mt-0.5">
              {nodes.length} active node{nodes.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {roots.length === 0 ? (
          <div className="border border-dashed border-ink-600 rounded-xl p-10 text-center">
            <FolderTree size={28} className="mx-auto text-parchment-300/40 mb-3" />
            <p className="text-sm font-medium">Your workspace is empty.</p>
            <p className="text-xs text-parchment-300/60 mt-1">
              Start with a root node. You can nest anything underneath it later.
            </p>
            <button
              type="button"
              onClick={openAddRoot}
              className="mt-4 inline-flex items-center gap-2 text-sm text-brass-400 hover:text-brass-300"
            >
              <Plus size={15} />
              Create your first root
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {roots.map((root) => (
              <NodeItem
                key={root.id}
                node={root}
                allNodes={nodes}
                onAddChild={openAddChild}
                onArchive={handleArchive}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
