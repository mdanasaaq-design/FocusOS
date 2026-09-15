import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Calendar,
  Clock,
  GraduationCap,
  Timer,
  Dumbbell,
  Flame,
  ListTodo,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { subscribeConfig } from "../lib/data";
import { MODULES } from "../modules/registry";
import Logo from "./Logo";

const ICONS = {
  home: Home,
  calendar: Calendar,
  timetables: Clock,
  study: GraduationCap,
  pomodoro: Timer,
  exercise: Dumbbell,
  habits: Flame,
  tasks: ListTodo,
  settings: Settings,
};

const DEFAULT_ENABLED_MODULES = MODULES
  .filter((module) => module.alwaysOn || module.key === "home")
  .map((module) => module.key);

const LS_KEY = "aos_sidebar_collapsed";

export default function Sidebar() {
  const { user, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(LS_KEY) === "1"
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [enabledModules, setEnabledModules] = useState(
    DEFAULT_ENABLED_MODULES
  );

  useEffect(() => {
    if (!user) return;

    return subscribeConfig(user.uid, (config) => {
      if (Array.isArray(config?.enabledModules)) {
        setEnabledModules(config.enabledModules);
      } else {
        setEnabledModules(DEFAULT_ENABLED_MODULES);
      }
    });
  }, [user]);

  useEffect(() => {
    localStorage.setItem(LS_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const visibleLinks = MODULES
    .filter((module) => enabledModules.includes(module.key))
    .map((module) => ({
      ...module,
      icon: ICONS[module.key],
      end: module.route === "/",
    }))
    .filter((module) => module.icon);

  const width = collapsed ? "w-16" : "w-60";

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-30 p-2 rounded-lg bg-ink-800 border border-ink-600 text-parchment-100"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

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
              onClick={() => setCollapsed((current) => !current)}
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
                onClick={() => setCollapsed((current) => !current)}
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
          {visibleLinks.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.key}
                to={link.route}
                end={link.end}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? link.label : undefined}
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
                <Icon size={17} className="shrink-0" />
                {!collapsed && <span>{link.label}</span>}
              </NavLink>
            );
          })}
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