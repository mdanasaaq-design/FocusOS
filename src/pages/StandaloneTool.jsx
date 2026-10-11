import { Link, useParams } from "react-router-dom";
import PageCapabilityRuntime from "../components/PageCapabilityRuntime";
import { useAuth } from "../lib/auth";
import { getToolDefinition, getStandaloneToolKeys, normalizeToolViewConfig } from "../tools/registry.js";

export default function StandaloneTool() {
  const { toolKey } = useParams();
  const { user } = useAuth();
  const tool = getToolDefinition(toolKey);
  const available = getStandaloneToolKeys().includes(toolKey);

  if (!tool || !available) {
    return (
      <div className="p-8 space-y-3">
        <h1 className="text-xl font-semibold">Tool not found</h1>
        <p className="text-sm text-parchment-300/60">This tool is not available in the current registry.</p>
        <Link to="/tools" className="text-sm text-brass-400">Back to Tools</Link>
      </div>
    );
  }

  const capabilityConfig = {
    [toolKey]: normalizeToolViewConfig(toolKey, "standalone", {}),
  };

  return (
    <div className="p-6 md:p-8 space-y-5">
      <header>
        <Link to="/tools" className="text-xs text-brass-400">← All tools</Link>
        <h1 className="text-2xl font-display font-semibold mt-3">{tool.label}</h1>
        <p className="text-sm text-parchment-300/60 mt-2">{tool.description}</p>
        <p className="text-xs text-parchment-300/50 mt-2">
          Standalone view · records are shared with Page views · new records are not assigned to a Page by default.
        </p>
      </header>
      <PageCapabilityRuntime
        user={user}
        pageId={null}
        capabilities={[toolKey]}
        capabilityConfig={capabilityConfig}
        viewKey="standalone"
      />
    </div>
  );
}
