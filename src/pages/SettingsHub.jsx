import SystemPreferences from "../components/SystemPreferences";

export default function SettingsHub() {
  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <header>
        <h2 className="text-2xl font-display font-semibold">System Settings</h2>
        <p className="text-sm text-parchment-300/70 mt-1">Configure how FocusOS behaves for you. Create Pages and configure how each Page behaves in the Page Builder.</p>
      </header>
      <SystemPreferences />
      <section className="card p-6 space-y-3">
        <h3 className="font-semibold text-lg">Pages & Page Builder</h3>
        <p className="text-sm text-parchment-300/70">Create pages, build their hierarchy, define fields and capabilities, and decide whether each page appears in the left sidebar or dashboard.</p>
        <a href="/workspace" className="inline-flex w-fit bg-ink-700 hover:bg-ink-600 rounded-lg px-4 py-2 text-sm">Open Page Builder</a>
      </section>
    </div>
  );
}
