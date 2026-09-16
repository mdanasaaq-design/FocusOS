import SystemPreferences from "../components/SystemPreferences";

export default function SettingsHub() {
  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <header>
        <h2 className="text-2xl font-display font-semibold">System Settings</h2>
        <p className="text-sm text-parchment-300/70 mt-1">Configure how FocusOS behaves for you. Your workspace structure remains in Workspace.</p>
      </header>
      <SystemPreferences />
      <section className="card p-6 space-y-3">
        <h3 className="font-semibold text-lg">Advanced configuration</h3>
        <p className="text-sm text-parchment-300/70">Dashboard, capabilities, node configuration and navigation controls remain available in the existing Settings workspace while the universal settings model is rolled out.</p>
        <a href="/settings/legacy" className="inline-flex w-fit bg-ink-700 hover:bg-ink-600 rounded-lg px-4 py-2 text-sm">Open workspace configuration</a>
      </section>
    </div>
  );
}
