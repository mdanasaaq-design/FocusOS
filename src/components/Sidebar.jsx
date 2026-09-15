import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  Home, Calendar, Clock, GraduationCap, Timer, Dumbbell,
  Flame, Settings, PanelLeftClose, PanelLeft, Menu, X,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import Logo from "./Logo";

const links = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/timetables", label: "Timetables", icon: Clock },
  { to: "/study", label: "Study / Work", icon: GraduationCap },
  { to: "/pomodoro", label: "Pomodoro", icon: Timer },
  { to: "/exercise", label: "Exercise", icon: Dumbbell },
  { to: "/habits", label: "Habits", icon: Flame },
  { to: "/settings", label: "Settings", icon: Settings },
];

const LS_KEY = "aos_sidebar_collapsed";

export default function Sidebar() {
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(LS_KEY) === "1"
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(LS_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const width = collapsed ? "w-16" : "w-60";

  return (
    <>
      {/* Mobile menu trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-30 p-2 rounded-lg bg-ink-800 border border-ink-600 text-parchment-100"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 fixed md:static z-50 md:z-auto
          ${width} shrink-0 bg-ink-900 border-r border-ink-700/60
          flex flex-col h-full transition-all duration-200
        `}
      >
        <div
          className={`border-b border-ink-700/60 flex ${
            collapsed
              ? "flex-col items-center gap-2 py-4"
              : "flex-row items-center justify-between px-4 py-5"
          }`}
        >
          {collapsed ? (
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="hidden md:flex p-1.5 rounded-md text-parchment-300 hover:bg-ink-800 hover:text-parchment-100"
              aria-label="Expand sidebar"
            >
              <PanelLeft size={16} />
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <Logo size={26} className="shrink-0" />
                <h1 className="text-base font-display font-semibold text-parchment-100 truncate">
                  FocusOS
                </h1>
              </div>
              <button
                onClick={() => setCollapsed((c) => !c)}
                className="hidden md:flex p-1.5 rounded-md text-parchment-300 hover:bg-ink-800 hover:text-parchment-100"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose size={16} />
              </button>
            </>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-md text-parchment-300"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? l.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  collapsed ? "justify-center" : ""
                } ${
                  isActive
                    ? "bg-brass-500/15 text-brass-400"
                    : "text-parchment-300 hover:bg-ink-800 hover:text-parchment-100"
                }`
              }
            >
              <l.icon size={17} className="shrink-0" />
              {!collapsed && <span>{l.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="px-2.5 py-4 border-t border-ink-700/60">
          <button
            onClick={logout}
            title={collapsed ? "Sign out" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-parchment-300 hover:bg-ink-800 hover:text-clay-400 transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <X size={17} className="shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
