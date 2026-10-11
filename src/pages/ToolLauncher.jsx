import { Link } from "react-router-dom";
import { TOOL_DEFINITIONS } from "../tools/registry.js";

export default function ToolLauncher() {
  const tools = TOOL_DEFINITIONS.filter((tool) => tool.surfaces.standalone === "implemented");

  return (
    <div className="p-6 md:p-8 space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-brass-400">Tool launcher</p>
        <h1 className="text-2xl font-display font-semibold mt-2">Tools</h1>
        <p className="text-sm text-parchment-300/60 mt-2 max-w-2xl">
          Open a tool independently. Tools use the same underlying records as Page views; launching a tool does not create a Page.
        </p>
      </header>

      <section aria-label="Available tools" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {tools.map((tool) => (
          <Link
            key={tool.key}
            to={`/tools/${tool.key}`}
            className="card p-4 block hover:border-brass-500/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500/70"
          >
            <h2 className="text-sm font-semibold">{tool.label}</h2>
            <p className="text-xs text-parchment-300/60 mt-2 leading-5">{tool.description}</p>
            <span className="inline-block mt-4 text-xs text-brass-400">Open tool →</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
