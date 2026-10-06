import { useEffect, useMemo, useState } from "react";

import { Plus, Archive, Save } from "lucide-react";
import { useAuth } from "../lib/auth";
import { subscribeProfile, setProfile, subscribeConfig, setConfig } from "../lib/data";
import { subscribeUserCapabilities, addUserCapability } from "../data/userCapabilities";
import { subscribePages, addPage, updatePage, archivePage, normalizePageConfig } from "../data/pages";
import { subscribeNodes } from "../data/nodes";
import { CAPABILITIES, USER_CAPABILITY_PREFIX } from "../modules/capabilities";
import { getDefaultDashboard, normalizeDashboard, normalizeDashboardLayouts } from "../modules/dashboard";
import { normalizePreferences } from "../lib/preferences";
import NodeFieldBuilder from "../components/NodeFieldBuilder";
import DashboardBuilder from "../components/DashboardBuilder";

const LANGUAGE_OPTIONS = [["en","English"],["ar","العربية"],["bn","বাংলা"],["de","Deutsch"],["es","Español"],["fa","فارسی"],["fr","Français"],["gu","ગુજરાતી"],["he","עברית"],["hi","हिन्दी"],["id","Bahasa Indonesia"],["it","Italiano"],["ja","日本語"],["kn","ಕನ್ನಡ"],["ko","한국어"],["ml","മലയാളം"],["mr","मराठी"],["ne","नेपाली"],["nl","Nederlands"],["pa","ਪੰਜਾਬੀ"],["pl","Polski"],["pt","Português"],["ro","Română"],["ru","Русский"],["si","සිංහල"],["sv","Svenska"],["ta","தமிழ்"],["te","తెలుగు"],["th","ไทย"],["tr","Türkçe"],["uk","Українська"],["ur","اردو"],["vi","Tiếng Việt"],["zh","中文"]];
const CALENDAR_OPTIONS = [["gregorian","Gregorian"],["hijri","Islamic Hijri"],["ummalqura","Islamic Umm al-Qura"],["persian","Persian"],["hebrew","Hebrew"],["buddhist","Buddhist"],["japanese","Japanese"],["indian","Indian National"],["chinese","Chinese"]];

export default function Settings() {
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [adjustment, setAdjustment] = useState(0);
  const [language, setLanguage] = useState("en");
  const [locale, setLocale] = useState("en-IN");
  const [newCalendarName, setNewCalendarName] = useState("");
  const [preferences, setPreferences] = useState(normalizePreferences());
  const [dashboard, setDashboard] = useState(getDefaultDashboard);
  const [dashboardLayouts, setDashboardLayouts] = useState([getDefaultDashboard()]);
  const [activeDashboardId, setActiveDashboardId] = useState("dashboard");

  const [pages, setPages] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState("");
  const [pageName, setPageName] = useState("");
  const [newPageName, setNewPageName] = useState("");
  const [pageDescription, setPageDescription] = useState("");
  const [pageIcon, setPageIcon] = useState("◆");
  const [pageColor, setPageColor] = useState("#428475");
  const [pageConfig, setPageConfig] = useState(normalizePageConfig());
  const [pageSaving, setPageSaving] = useState(false);
  const [pageSaved, setPageSaved] = useState(false);
  const [pageError, setPageError] = useState("");

  const [userCapabilities, setUserCapabilities] = useState([]);
  const [capabilityName, setCapabilityName] = useState("");
  const [capabilityDescription, setCapabilityDescription] = useState("");
  const [capabilityFields, setCapabilityFields] = useState([]);
  const [capabilitySaving, setCapabilitySaving] = useState(false);
  const [capabilitySaved, setCapabilitySaved] = useState(false);
  const [capabilityError, setCapabilityError] = useState("");

  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!user) return;
    const unsubProfile = subscribeProfile(user.uid, (profile) => {
      if (profile) {
        setName(profile.name || "");
        setAdjustment(profile.hijriAdjustmentDays || 0);
      }
    });
    const unsubConfig = subscribeConfig(user.uid, (config) => {
      const layoutState = normalizeDashboardLayouts(config || {});
      setDashboardLayouts(layoutState.layouts);
      const prefs = normalizePreferences(config?.preferences);
      setPreferences(prefs);
      setLanguage(prefs.language);
      setLocale(prefs.locale);
      setActiveDashboardId(layoutState.activeDashboardId);
      setDashboard(layoutState.layouts.find((layout) => layout.id === layoutState.activeDashboardId) || layoutState.layouts[0]);
    });
    const unsubPages = subscribePages(user.uid, (nextPages) => setPages(nextPages));
    const unsubCapabilities = subscribeUserCapabilities(user.uid, setUserCapabilities);
    const unsubNodes = subscribeNodes(user.uid, "core", setNodes);
    return () => { unsubProfile(); unsubConfig(); unsubPages(); unsubCapabilities(); unsubNodes(); };
  }, [user]);

  useEffect(() => {
    if (!selectedPageId && pages[0]) setSelectedPageId(pages[0].id);
  }, [pages, selectedPageId]);

  const detectedLanguage = typeof navigator !== "undefined" ? (navigator.language || "en").split("-")[0] : "en";
  const detectedLocale = typeof navigator !== "undefined" ? (navigator.language || "en-IN") : "en-IN";
  const detectedTimeZone = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "Asia/Kolkata";

  const selectedPage = useMemo(() => pages.find((page) => page.id === selectedPageId) || null, [pages, selectedPageId]);

  useEffect(() => {
    if (!selectedPage) return;
    setPageName(selectedPage.name || "");
    setPageDescription(selectedPage.description || "");
    setPageIcon(selectedPage.icon || "◆");
    setPageColor(selectedPage.color || "#428475");
    setPageConfig(normalizePageConfig(selectedPage.config));
    setPageSaved(false);
    setPageError("");
  }, [selectedPageId, selectedPage]);

  async function createNewPage(event) {
    event.preventDefault();
    setPageError("");
    try {
      const ref = await addPage(user.uid, { name: newPageName });
      setSelectedPageId(ref.id);
      setNewPageName("");
    } catch (error) {
      setPageError(error.message || "Unable to create Page.");
    }
  }

  async function savePage() {
    if (!selectedPage) return;
    setPageSaving(true);
    setPageSaved(false);
    setPageError("");
    try {
      await updatePage(user.uid, selectedPage.id, {
        name: pageName.trim(),
        description: pageDescription.trim(),
        icon: pageIcon,
        color: pageColor,
        config: normalizePageConfig(pageConfig),
      });
      setPageSaved(true);
      setTimeout(() => setPageSaved(false), 2000);
    } catch (error) {
      setPageError(error.message || "Unable to save Page.");
    } finally {
      setPageSaving(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaved(false);
    setSaveError("");
    try {
      await setProfile(user.uid, { name: name.trim(), hijriAdjustmentDays: Number(adjustment) });
      const normalizedDashboard = normalizeDashboard(dashboard);
      const nextLayouts = dashboardLayouts.map((layout) => layout.id === normalizedDashboard.id ? normalizedDashboard : layout);
      await setConfig(user.uid, {
        dashboard: normalizedDashboard,
        dashboardLayouts: nextLayouts,
        activeDashboardId,
        preferences: normalizePreferences({ ...preferences, language, locale }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      setSaveError(error.message || "Unable to save settings.");
    }
  }

  async function createCapability(event) {
    event.preventDefault();
    setCapabilitySaving(true);
    setCapabilityError("");
    try {
      await addUserCapability(user.uid, { name: capabilityName, description: capabilityDescription, fields: capabilityFields });
      setCapabilityName("");
      setCapabilityDescription("");
      setCapabilityFields([]);
      setCapabilitySaved(true);
      setTimeout(() => setCapabilitySaved(false), 2000);
    } catch (error) {
      setCapabilityError(error.message || "Unable to create capability.");
    } finally {
      setCapabilitySaving(false);
    }
  }

  const allCapabilities = [
    ...CAPABILITIES.map((item) => ({ key: item.key, label: item.label, description: item.description })),
    ...userCapabilities.map((item) => ({ key: `${USER_CAPABILITY_PREFIX}${item.id}`, label: item.name, description: item.description || "User-created capability." })),
  ];

  function togglePageCapability(key) {
    setPageConfig((current) => ({
      ...current,
      capabilities: current.capabilities.includes(key)
        ? current.capabilities.filter((item) => item !== key)
        : [...current.capabilities, key],
    }));
  }

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <header>
        <h2 className="text-2xl font-display font-semibold">Settings</h2>
        <p className="text-sm text-parchment-300/70 mt-1">Configure the system and build the Pages you want to use.</p>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        <section className="card p-6 space-y-5">
          <div><h3 className="font-semibold text-lg">Personal preferences</h3><p className="text-xs text-parchment-300/70 mt-1">These preferences belong only to your account.</p></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><label className="block text-xs text-parchment-300 mb-1">Language<select value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm">{LANGUAGE_OPTIONS.map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select><span className="block text-[11px] text-parchment-300/50 mt-1">Default: device language when supported; otherwise English.</span></label><label className="block text-xs text-parchment-300 mb-1">Regional format<select value={locale} onChange={(e) => setLocale(e.target.value)} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm"><option value="en-IN">India · English</option><option value="en-US">United States · English</option><option value="en-GB">United Kingdom · English</option><option value="ur-PK">Pakistan · Urdu</option><option value="ar-SA">Saudi Arabia · Arabic</option><option value="hi-IN">India · Hindi</option><option value="te-IN">India · Telugu</option><option value="bn-BD">Bangladesh · Bengali</option></select></label></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><label className="block text-xs text-parchment-300 mb-1">Time zone<select value={preferences.timeZone} onChange={(e) => setPreferences((current) => ({ ...current, timeZone: e.target.value }))} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm"><option value={detectedTimeZone}>Device · {detectedTimeZone}</option><option value="Asia/Kolkata">Asia/Kolkata · India</option><option value="Asia/Dubai">Asia/Dubai · UAE</option><option value="Asia/Riyadh">Asia/Riyadh · Saudi Arabia</option><option value="Europe/London">Europe/London · UK</option><option value="America/New_York">America/New_York · US Eastern</option><option value="America/Los_Angeles">America/Los_Angeles · US Pacific</option><option value="Asia/Tokyo">Asia/Tokyo · Japan</option><option value="Australia/Sydney">Australia/Sydney · Australia</option></select><span className="block text-[11px] text-parchment-300/50 mt-1">Uses the device time zone by default; you can override it.</span></label><div className="rounded-lg border border-ink-700 bg-ink-800/30 px-3 py-3 text-xs text-parchment-300/70 flex items-center justify-between gap-3"><span>Detected device<br/><span className="text-[11px] text-parchment-300/40">{detectedLanguage} · {detectedLocale} · {detectedTimeZone}</span></span><button type="button" onClick={() => { setLanguage(detectedLanguage); setLocale(detectedLocale); setPreferences((current) => ({ ...current, timeZone: detectedTimeZone })); }} className="px-3 py-2 rounded-lg border border-ink-600 text-xs">Use device</button></div></div><div><label className="block text-xs text-parchment-300 mb-1">Display name</label><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your display name" className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500" /></div>
          <div><label className="block text-xs text-parchment-300 mb-1">Hijri date adjustment</label><select value={adjustment} onChange={(event) => setAdjustment(event.target.value)} className="bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none"><option value={-2}>-2 days</option><option value={-1}>-1 day</option><option value={0}>No adjustment</option><option value={1}>+1 day</option><option value={2}>+2 days</option></select></div>
        </section>

        <section className="card p-6 space-y-5">
          <div><h3 className="font-semibold text-lg">Display & greeting</h3><p className="text-xs text-parchment-300/70 mt-1">Control how the Dashboard presents time and your greeting.</p></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-xs text-parchment-300">Clock style<select value={preferences.clock.style || "digital"} onChange={(e)=>setPreferences((cur)=>({...cur,clock:{...cur.clock,style:e.target.value}}))} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm"><option value="digital">Digital</option><option value="analog">Analog</option><option value="minimal">Minimal</option><option value="flip">Flip-style</option><option value="binary">Binary-style</option></select></label><label className="block text-xs text-parchment-300">Time format<select value={preferences.timeFormat} onChange={(event) => setPreferences((current) => ({ ...current, timeFormat: event.target.value }))} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm"><option value="24h">24-hour · 01:24:45</option><option value="12h">12-hour · 01:24:45 PM</option></select></label>
            <label className="flex items-center justify-between gap-4 rounded-lg border border-ink-700 bg-ink-800/30 px-3 py-3 text-sm"><span><span className="block">Show seconds</span><span className="block text-[11px] text-parchment-300/50">Keep the live clock precise to the second.</span></span><input type="checkbox" checked={preferences.clock.showSeconds === true} onChange={(event) => setPreferences((current) => ({ ...current, clock: { ...current.clock, showSeconds: event.target.checked } }))} className="h-4 w-4 accent-brass-500" /></label>
          </div>
          <label className="flex items-center justify-between gap-4 rounded-lg border border-ink-700 bg-ink-800/30 px-3 py-3 text-sm"><span><span className="block">Show greeting</span><span className="block text-[11px] text-parchment-300/50">Keep the greeting at the top of the Dashboard.</span></span><input type="checkbox" checked={preferences.greeting.enabled !== false} onChange={(event) => setPreferences((current) => ({ ...current, greeting: { ...current.greeting, enabled: event.target.checked } }))} className="h-4 w-4 accent-brass-500" /></label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-xs text-parchment-300">Greeting prefix<input value={preferences.greeting.prefixText} onChange={(event) => setPreferences((current) => ({ ...current, greeting: { ...current.greeting, prefixText: event.target.value, prefixEnabled: event.target.value.trim().length > 0 } }))} placeholder="Assalamualaikum warahmatullahi wabarakatuhu" className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm" /><span className="block text-[11px] text-parchment-300/50 mt-1">Leave empty to hide the prefix.</span></label>
            <label className="block text-xs text-parchment-300">Greeting name<select value={preferences.greeting.includeName ? "yes" : "no"} onChange={(event) => setPreferences((current) => ({ ...current, greeting: { ...current.greeting, includeName: event.target.value === "yes" } }))} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm"><option value="yes">Include display name</option><option value="no">Do not include name</option></select></label>
          </div>
        </section>

        <section className="card p-6 space-y-4">
          <div><h3 className="font-semibold text-lg">Pages</h3><p className="text-xs text-parchment-300/70 mt-1">Pages are user-created areas of FocusOS. A new Page starts empty; you decide exactly what it contains.</p></div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
            <input value={newPageName} onChange={(event) => setNewPageName(event.target.value)} placeholder="New Page name" className="bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm" />
            <select value={pageIcon} onChange={(event) => setPageIcon(event.target.value)} className="w-20 bg-ink-700 border border-ink-600 rounded-lg px-2 py-2 text-center text-lg" aria-label="Page icon">{["◆","⌂","✓","◷","★","♡","☀","✦","✧","●","○","◇","△","⬟","⬢","☁","⚡","☕","📚","💼","🏠","🎯","💪","📝","📅","💡","🔧","🎨","🎵","💰","🌱","🚀","🧠","❤️","⭐","🔥","🏆","🎓","🕌","🌙","🎮"].map((icon) => <option key={icon} value={icon}>{icon}</option>)}</select>
            <button type="button" onClick={createNewPage} disabled={!newPageName.trim()} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brass-500 text-ink-950 font-semibold text-sm"><Plus size={15}/> Create Page</button>
          </div>

          {pages.length === 0 ? (
            <div className="border border-dashed border-ink-600 rounded-xl p-6 text-center text-sm text-parchment-300/60">No user Pages yet. Create one above.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5">
              <div className="space-y-1">
                {pages.map((page) => <button key={page.id} type="button" onClick={() => setSelectedPageId(page.id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selectedPageId === page.id ? "bg-brass-500/15 text-brass-400" : "text-parchment-300 hover:bg-ink-800"}`}><span className="mr-2" style={{color: page.color}}>{page.icon}</span>{page.name}</button>)}
              </div>

              {selectedPage && (
                <div className="space-y-5 border-l border-ink-700 pl-5">
                  <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-3">
                    <input value={pageIcon} onChange={(event) => setPageIcon(event.target.value.slice(0,4))} className="w-20 bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-center" />
                    <input value={pageName} onChange={(event) => setPageName(event.target.value)} className="bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm" />
                    <input type="color" value={pageColor} onChange={(event) => setPageColor(event.target.value)} className="h-10 w-14 bg-transparent border-0" />
                  </div>
                  <textarea value={pageDescription} onChange={(event) => setPageDescription(event.target.value)} rows={2} placeholder="Optional Page description" className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm" />

                  <div className="border-t border-ink-700 pt-5 space-y-4">
                    <div><p className="text-sm font-semibold">What should this Page contain?</p><p className="text-xs text-parchment-300/55 mt-1">Nothing appears unless you enable it here.</p></div>
                    <NodeFieldBuilder fields={pageConfig.fields} onChange={(fields) => setPageConfig((current) => ({ ...current, fields }))} />
                    <label className="flex items-center justify-between gap-4 text-sm"><span><span className="block">Show child content</span><span className="block text-[11px] text-parchment-300/50">Allow this Page to contain child items.</span></span><input type="checkbox" checked={pageConfig.showChildren === true} onChange={(e) => setPageConfig((current) => ({ ...current, showChildren: e.target.checked }))} className="h-4 w-4 accent-brass-500"/></label>
                  </div>

                  <div className="border-t border-ink-700 pt-5 space-y-3">
                    <div><p className="text-sm font-semibold">Capabilities</p><p className="text-xs text-parchment-300/55 mt-1">Attach only the behaviors you want this Page to have.</p></div>
                    {allCapabilities.map((capability) => <label key={capability.key} className="flex items-center justify-between gap-4 border-b border-ink-700/60 pb-3 last:border-0"><div><p className="text-sm">{capability.label}</p><p className="text-[11px] text-parchment-300/50">{capability.description}</p></div><input type="checkbox" checked={pageConfig.capabilities.includes(capability.key)} onChange={() => togglePageCapability(capability.key)} className="h-4 w-4 accent-brass-500"/></label>)}
                  </div>

                  <div className="border-t border-ink-700 pt-5 space-y-4">
                    <div><p className="text-sm font-semibold">Visibility & navigation</p><p className="text-xs text-parchment-300/55 mt-1">Control where this Page appears. Pinning a Page to the Dashboard also promotes it to primary navigation.</p></div>
                    <label className="flex items-center justify-between gap-4 text-sm"><span><span className="block">Primary navigation</span><span className="block text-[11px] text-parchment-300/50">Show alongside Dashboard, Pages and Calendar.</span></span><input type="checkbox" checked={pageConfig.showInNavigation === true} onChange={(e) => setPageConfig((current) => ({ ...current, showInNavigation: e.target.checked }))} className="h-4 w-4 accent-brass-500"/></label>
                    <label className="flex items-center justify-between gap-4 text-sm"><span><span className="block">Pin to Dashboard</span><span className="block text-[11px] text-parchment-300/50">Pinning adds this Page to Dashboard and primary navigation. Unpinning removes the automatic navigation promotion.</span></span><input type="checkbox" checked={pageConfig.showOnDashboard === true} onChange={(e) => setPageConfig((current) => ({ ...current, showOnDashboard: e.target.checked, showInNavigation: e.target.checked ? true : (current.navigationPromotedByDashboard ? false : current.showInNavigation), navigationPromotedByDashboard: e.target.checked ? true : false }))} className="h-4 w-4 accent-brass-500"/></label>
                    <label className="text-xs text-parchment-300 block">Sidebar order<input type="number" min="0" value={pageConfig.navigationOrder} onChange={(e) => setPageConfig((current) => ({ ...current, navigationOrder: Math.max(0, Number(e.target.value) || 0) }))} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm"/></label>
                  </div>

                  <div className="flex items-center gap-3">
                    <button type="button" onClick={savePage} disabled={pageSaving} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brass-500 text-ink-950 font-semibold text-sm"><Save size={15}/>{pageSaving ? "Saving…" : pageSaved ? "Saved ✓" : "Save Page"}</button>
                    <button type="button" onClick={() => archivePage(user.uid, selectedPage.id, true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-ink-600 text-sm text-clay-400"><Archive size={15}/> Archive</button>
                  </div>
                  {pageError && <p className="text-sm text-red-400">{pageError}</p>}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="card p-6 space-y-4">
          <div><h3 className="font-semibold text-lg">Dashboard</h3><p className="text-xs text-parchment-300/70 mt-1">Dashboard is fixed, but its contents are completely configurable.</p></div>
          <div className="flex flex-wrap gap-2 items-end">
            <label className="text-xs text-parchment-300 flex-1 min-w-[220px]">Layout<select value={activeDashboardId} onChange={(event) => { const nextId = event.target.value; const next = dashboardLayouts.find((layout) => layout.id === nextId); if (next) { setActiveDashboardId(nextId); setDashboard(next); } }} className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm">{dashboardLayouts.map((layout) => <option key={layout.id} value={layout.id}>{layout.name}</option>)}</select></label>
            <button type="button" onClick={() => { const id = `dashboard-${Date.now()}`; const copy = normalizeDashboard({ ...dashboard, id, name: `${dashboard.name} Copy` }); setDashboardLayouts((current) => [...current, copy]); setActiveDashboardId(id); setDashboard(copy); }} className="px-3 py-2 rounded-lg bg-ink-700 border border-ink-600 text-xs">Duplicate layout</button>
          </div>
          <DashboardBuilder dashboard={dashboard} onChange={setDashboard} nodes={nodes} pages={pages} trackers={pages.flatMap((page) => (page.config?.trackers || []).map((tracker) => ({ ...tracker, pageId: page.id, pageName: page.name })))} />
        </section>

        <section className="card p-6 space-y-5">
          <div><h3 className="font-semibold text-lg">Create your own capability</h3><p className="text-xs text-parchment-300/70 mt-1">Build reusable behavior without hard-coding a product category.</p></div>
          <input value={capabilityName} onChange={(event) => setCapabilityName(event.target.value)} placeholder="Capability name" className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm" />
          <textarea value={capabilityDescription} onChange={(event) => setCapabilityDescription(event.target.value)} placeholder="What should this capability do?" rows={2} className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm" />
          <NodeFieldBuilder fields={capabilityFields} onChange={setCapabilityFields} />
          <button type="button" onClick={createCapability} disabled={capabilitySaving || !capabilityName.trim()} className="bg-brass-500 text-ink-950 font-semibold rounded-lg px-4 py-2 text-sm">{capabilitySaved ? "Created ✓" : capabilitySaving ? "Creating…" : "Create capability"}</button>
          {capabilityError && <p className="text-sm text-red-400">{capabilityError}</p>}
        </section>

        <button type="submit" className="bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold rounded-lg px-4 py-2 text-sm">{saved ? "Saved ✓" : "Save personal settings"}</button>
        {saveError && <p className="text-sm text-red-400">{saveError}</p>}
      </form>
    </div>
  );
}
