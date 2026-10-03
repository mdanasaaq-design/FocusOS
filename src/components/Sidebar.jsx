import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, Calendar, Settings, LayoutGrid, PanelLeftClose, PanelLeft, Menu, X, Search, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "../lib/auth";
import { subscribePages } from "../data/pages";
import Logo from "./Logo";

const LS_KEY = "aos_sidebar_collapsed";
const EXPANDED_KEY = "focusos_sidebar_expanded";

function PageTree({ pages, parentId = null, level = 0, collapsed, query, expanded, setExpanded, closeMobile }) {
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
          <NavLink to={`/page/${page.id}`} onClick={closeMobile} title={collapsed ? page.name : undefined} className={({ isActive }) => `flex-1 flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm min-w-0 ${collapsed ? "justify-center" : ""} ${isActive ? "bg-brass-500/15 text-brass-400" : "text-parchment-300 hover:bg-ink-800 hover:text-parchment-100"}`} style={{ marginLeft: collapsed ? 0 : level * 8 }}>
            <span className="shrink-0 text-base" style={{ color: page.color || "#428475" }}>{page.icon || "◆"}</span>
            {!collapsed && <span className="truncate">{page.name}</span>}
          </NavLink>
        </div>
        {children && isExpanded && !collapsed && <PageTree pages={pages} parentId={page.id} level={level + 1} collapsed={collapsed} query={query} expanded={expanded} setExpanded={setExpanded} closeMobile={closeMobile}/>}
      </div>
    );
  });
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(LS_KEY) === "1");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pages, setPages] = useState([]);
  const [query, setQuery] = useState("");
  const [pagesOpen, setPagesOpen] = useState(true);
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
    { key: "dashboard", label: "Dashboard", route: "/", icon: Home, end: true },
    { key: "pages", label: "Pages", route: "/workspace", icon: LayoutGrid },
    { key: "calendar", label: "Calendar", route: "/calendar", icon: Calendar },
  ];
  const visiblePages = useMemo(() => pages.filter((page) => page.config?.showInNavigation === true), [pages]);

  function closeMobile() { setMobileOpen(false); }

  return (
    <>
      <button onClick={() => setMobileOpen(true)} className="md:hidden fixed top-4 left-4 z-30 p-2 rounded-lg bg-ink-800 border border-ink-600 text-parchment-100" aria-label="Open menu"><Menu size={18}/></button>
      {mobileOpen && <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={closeMobile}/>}
      <aside className={`${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:static z-50 md:z-auto ${collapsed ? "w-16" : "w-64"} shrink-0 bg-ink-900 border-r border-ink-700/60 flex flex-col h-full transition-all duration-200`}>
        <div className={`h-14 shrink-0 border-b border-ink-700/60 flex items-center ${collapsed ? "justify-center" : "justify-between px-3"}`}>
          {!collapsed && <div className="flex items-center gap-2 min-w-0"><Logo size={25}/><span className="font-display font-semibold truncate">FocusOS</span></div>}
          <button onClick={() => setCollapsed((current) => !current)} className="hidden md:flex p-1.5 rounded-md text-parchment-300 hover:bg-ink-800" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <PanelLeft size={17}/> : <PanelLeftClose size={17}/>}</button>
          <button onClick={closeMobile} className="md:hidden p-1.5 text-parchment-300" aria-label="Close menu"><X size={17}/></button>
        </div>

        <div className="px-2.5 pt-3">
          <button onClick={() => { navigate("/workspace"); closeMobile(); }} className={`w-full flex items-center gap-2 rounded-lg bg-brass-500 text-ink-950 font-semibold text-sm px-3 py-2.5 ${collapsed ? "justify-center" : "justify-start"}`} title={collapsed ? "New Page" : undefined}><Plus size={16}/>{!collapsed && "New Page"}</button>
        </div>

        {!collapsed && (
          <div className="px-2.5 pt-3">
            <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-ink-800 border border-ink-700 text-parchment-300/60">
              <Search size={15}/><input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search Pages" placeholder="Search Pages" className="w-full bg-transparent outline-none text-xs text-parchment-100 placeholder:text-parchment-300/40"/>
            </div>
          </div>
        )}

        <nav className="flex-1 px-2.5 py-3 overflow-y-auto space-y-1">
          {!collapsed && <p className="px-2.5 pt-1 pb-1 text-[10px] uppercase tracking-wider text-parchment-300/35">FocusOS</p>}
          {fixedLinks.map((link) => { const Icon = link.icon; return <NavLink key={link.key} to={link.route} end={link.end} onClick={closeMobile} title={collapsed ? link.label : undefined} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${collapsed ? "justify-center" : ""} ${isActive ? "bg-brass-500/15 text-brass-400" : "text-parchment-300 hover:bg-ink-800 hover:text-parchment-100"}`}><Icon size={17}/>{!collapsed && <span>{link.label}</span>}</NavLink>; })}

          <div className="pt-4">
            {!collapsed && <button type="button" onClick={() => setPagesOpen((current) => !current)} className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-parchment-300/40 hover:text-parchment-200"><span>Pages</span>{pagesOpen ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}</button>}
            {(pagesOpen || collapsed) && <PageTree pages={visiblePages} collapsed={collapsed} query={query} expanded={expanded} setExpanded={setExpanded} closeMobile={closeMobile}/>}
            {!collapsed && visiblePages.length === 0 && !query && <p className="px-2.5 py-3 text-xs text-parchment-300/40">Create a Page to build your own workspace.</p>}
            {!collapsed && query && visiblePages.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).length === 0 && <p className="px-2.5 py-3 text-xs text-parchment-300/40">No Pages found.</p>}
          </div>
        </nav>

        <div className="px-2.5 py-3 border-t border-ink-700/60 space-y-1">
          <NavLink to="/settings" onClick={closeMobile} title={collapsed ? "Settings" : undefined} className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${collapsed ? "justify-center" : ""} ${isActive ? "bg-brass-500/15 text-brass-400" : "text-parchment-300 hover:bg-ink-800"}`}><Settings size={17}/>{!collapsed && "Settings"}</NavLink>
          <button onClick={logout} title={collapsed ? "Sign out" : undefined} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-parchment-300 hover:bg-ink-800 hover:text-clay-400 ${collapsed ? "justify-center" : ""}`}><X size={17}/>{!collapsed && "Sign out"}</button>
        </div>
      </aside>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-ink-700/70 bg-ink-900/95 backdrop-blur px-2 py-2 grid grid-cols-4 gap-1">
        <NavLink to="/" onClick={closeMobile} className="flex flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] text-parchment-300/70"><Home size={16}/><span>Home</span></NavLink>
        <NavLink to="/workspace" onClick={closeMobile} className="flex flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] text-parchment-300/70"><LayoutGrid size={16}/><span>Pages</span></NavLink>
        <NavLink to="/calendar" onClick={closeMobile} className="flex flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] text-parchment-300/70"><Calendar size={16}/><span>Calendar</span></NavLink>
        <NavLink to="/settings" onClick={closeMobile} className="flex flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] text-parchment-300/70"><Settings size={16}/><span>Settings</span></NavLink>
      </nav>
    </>
  );

}
