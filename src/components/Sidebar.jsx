import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, Calendar, Settings, LayoutGrid, PanelLeftClose, PanelLeft, Menu, X, Search, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "../lib/auth";
import { subscribePages } from "../data/pages";
import Logo from "./Logo";
import { usePreferences } from "./PreferenceRuntime";
import { t } from "../lib/i18n";

const LS_KEY = "aos_sidebar_collapsed";
const EXPANDED_KEY = "focusos_sidebar_expanded";

function PageTree({ pages, parentId = null, level = 0, collapsed, query, expanded, setExpanded, closeMobile, matchedIds }) {
  const items = pages.filter((page) => (page.parentId || null) === parentId && page.config?.showInNavigation !== false)
    .filter((page) => !query || page.name.toLowerCase().includes(query.toLowerCase()));
  return items.map((page) => {
    const children = pages.some((item) => (item.parentId || null) === page.id);
    const isExpanded = expanded[page.id] !== false;
    return (
      <div key={page.id}>
        <div className="flex items-center gap-1">
          {children && !collapsed ? (
            <button type="button" onClick={() => setExpanded((current) => ({ ...current, [page.id]: !isExpanded }))} className="p-1 rounded text-parchment-300/60 hover:bg-ink-800" aria-label={isExpanded ? "Collapse page" : "Expand page"}>
              {isExpanded ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}
            </button>
          ) : <span className={collapsed ? "w-0" : "w-6"} />}
          <NavLink to={`/page/${page.id}`} onClick={closeMobile} title={collapsed ? page.name : undefined} className={({ isActive }) => `flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm min-w-0 ${collapsed ? "justify-center" : ""} ${isActive ? "bg-brass-500/15 text-brass-400" : "text-parchment-300 hover:bg-ink-800 hover:text-parchment-100"}`} style={{ marginLeft: collapsed ? 0 : level * 12 }}>
            <span className="shrink-0 text-base" style={{ color: page.color || "#428475" }}>{page.icon || "◆"}</span>
            {!collapsed && <span className="truncate">{page.name}</span>}
          </NavLink>
        </div>
        {children && isExpanded && !collapsed && <PageTree pages={pages} parentId={page.id} level={level + 1} collapsed={collapsed} query={query} expanded={expanded} setExpanded={setExpanded} closeMobile={closeMobile} matchedIds={matchedIds}/>}
      </div>
    );
  });
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const preferences = usePreferences();
  const tr = (key) => t(preferences.language, key);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(LS_KEY) === "1");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pages, setPages] = useState([]);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(() => {
    try { return JSON.parse(localStorage.getItem(EXPANDED_KEY) || "{}"); } catch { return {}; }
  });

  useEffect(() => {
    if (!user) { setPages([]); return undefined; }
    return subscribePages(user.uid, setPages);
  }, [user]);

  useEffect(() => { localStorage.setItem(LS_KEY, collapsed ? "1" : "0"); }, [collapsed]);
  useEffect(() => { localStorage.setItem(EXPANDED_KEY, JSON.stringify(expanded)); }, [expanded]);

  const fixedLinks = [
    { key: "dashboard", label: tr("dashboard"), route: "/", icon: Home, end: true },
    { key: "pages", label: tr("pages"), route: "/pages", icon: LayoutGrid },
    { key: "calendar", label: tr("calendar"), route: "/calendar", icon: Calendar },
  ];
  const visiblePages = useMemo(() => pages.filter((page) => page.config?.showInNavigation === true && !page.archived && !page.trashedAt), [pages]);
  const matchedIds = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return new Set(visiblePages.map((page) => page.id));
    const ids = new Set();
    const byId = new Map(visiblePages.map((page) => [page.id, page]));
    visiblePages.forEach((page) => {
      if (!page.name.toLowerCase().includes(normalized)) return;
      let current = page;
      while (current) {
        ids.add(current.id);
        current = current.parentId ? byId.get(current.parentId) : null;
      }
    });
    return ids;
  }, [query, visiblePages]);

  function closeMobile() { setMobileOpen(false); }

  return (
    <>
      <button onClick={() => setMobileOpen(true)} className="md:hidden fixed top-4 left-4 z-30 p-2 rounded-lg bg-ink-800 border border-ink-600 text-parchment-100" aria-label="Open menu"><Menu size={18}/></button>
      {mobileOpen && <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={closeMobile}/>}
      <aside className={`${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:static z-50 md:z-auto ${collapsed ? "w-16" : "w-64"} shrink-0 bg-ink-900 border-r border-ink-700/60 flex flex-col h-full transition-all duration-200`}>
        <div className={`h-14 shrink-0 border-b border-ink-700/60 flex items-center ${collapsed ? "justify-center" : "justify-between px-3"}`}>
          <div className="flex items-center min-w-0"><Logo size={25}/></div>
          <button onClick={() => setCollapsed((current) => !current)} className="hidden md:flex p-1.5 rounded-md text-parchment-300 hover:bg-ink-800" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <PanelLeft size={17}/> : <PanelLeftClose size={17}/>}</button>
          <button onClick={closeMobile} className="md:hidden p-1.5 text-parchment-300" aria-label="Close menu"><X size={17}/></button>
        </div>

        <div className="px-2.5 pt-3">
          <button onClick={() => { navigate("/pages"); closeMobile(); }} className={`w-full flex items-center gap-2 rounded-lg bg-brass-500 text-ink-950 font-semibold text-sm px-3 py-2.5 ${collapsed ? "justify-center" : "justify-start"}`} title={collapsed ? "New Page" : undefined}><Plus size={16}/>{!collapsed && "New Page"}</button>
        </div>

        {!collapsed && (
          <div className="px-2.5 pt-3">
            <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-ink-800 border border-ink-700 text-parchment-300/60">
              <Search size={15}/><input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search Pages" placeholder="Search Pages" className="w-full bg-transparent outline-none text-xs text-parchment-100 placeholder:text-parchment-300/40"/>
            </div>
          </div>
        )}

        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:top-2 focus:left-2 focus:bg-brass-500 focus:text-ink-950 focus:px-3 focus:py-2 focus:rounded-lg">Skip to content</a>
        <nav className="flex-1 px-2.5 py-3 overflow-y-auto space-y-1">
          {fixedLinks.map((link) => { const Icon = link.icon; return <NavLink key={link.key} to={link.route} end={link.end} onClick={closeMobile} title={collapsed ? link.label : undefined} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${collapsed ? "justify-center" : ""} ${isActive ? "bg-brass-500/15 text-brass-400" : "text-parchment-300 hover:bg-ink-800 hover:text-parchment-100"}`}><Icon size={17}/>{!collapsed && <span>{link.label}</span>}</NavLink>; })}
          <div className="pt-1 space-y-1">
            <PageTree pages={visiblePages} collapsed={collapsed} query={query} expanded={expanded} setExpanded={setExpanded} closeMobile={closeMobile} matchedIds={matchedIds}/>
            {!collapsed && visiblePages.length === 0 && !query && <p className="px-3 py-2 text-xs text-parchment-300/40">Create a Page to add it here.</p>}
            {!collapsed && query && matchedIds.size === 0 && <p className="px-3 py-2 text-xs text-parchment-300/40">No Pages found.</p>}
          </div>

        </nav>

        <div className="px-2.5 py-3 border-t border-ink-700/60 space-y-1">
          <NavLink to="/settings" onClick={closeMobile} title={collapsed ? "Settings" : undefined} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${collapsed ? "justify-center" : ""} ${isActive ? "bg-brass-500/15 text-brass-400" : "text-parchment-300 hover:bg-ink-800"}`}><Settings size={17}/>{!collapsed && tr("settings")}</NavLink>
          <button onClick={logout} title={collapsed ? "Sign out" : undefined} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-parchment-300 hover:bg-ink-800 hover:text-clay-400 ${collapsed ? "justify-center" : ""}`}><X size={17}/>{!collapsed && "Sign out"}</button>
        </div>
      </aside>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-ink-700/70 bg-ink-900/95 backdrop-blur px-2 py-2 grid grid-cols-4 gap-1">
        <NavLink to="/" onClick={closeMobile} className={({ isActive }) => `flex flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] ${isActive ? "text-brass-400 bg-brass-500/10" : "text-parchment-300/70"}`}><Home size={16}/><span>{tr("dashboard")}</span></NavLink>
        <NavLink to="/pages" onClick={closeMobile} className="flex flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] text-parchment-300/70"><LayoutGrid size={16}/><span>{tr("pages")}</span></NavLink>
        <NavLink to="/calendar" onClick={closeMobile} className="flex flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] text-parchment-300/70"><Calendar size={16}/><span>{tr("calendar")}</span></NavLink>
        <NavLink to="/settings" onClick={closeMobile} className="flex flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] text-parchment-300/70"><Settings size={16}/><span>{tr("settings")}</span></NavLink>
      </nav>
    </>
  );

}
