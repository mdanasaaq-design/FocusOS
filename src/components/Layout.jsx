import { useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Sidebar from "./Sidebar";

const PAGE_LABELS = {
  "/": "Home",
  "/workspace": "Workspace",
  "/calendar": "Calendar",
  "/timetables": "Timetables",
  "/study": "Study / Work",
  "/pomodoro": "Pomodoro",
  "/exercise": "Exercise",
  "/habits": "Habits",
  "/tasks": "Tasks",
  "/settings": "Settings",
};

export default function Layout({ children }) {
  const location = useLocation();
  const pageLabel = PAGE_LABELS[location.pathname] ?? "FocusOS";

  return (
    <div className="flex h-screen overflow-hidden bg-ink-950">
      <Sidebar />

      <main className="flex-1 min-w-0 overflow-y-auto pt-14 md:pt-0">
        <div className="sticky top-0 z-20 hidden md:flex h-14 items-center border-b border-ink-700/60 bg-ink-950/90 px-6 backdrop-blur">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-parchment-100">FocusOS</span>
            <ChevronRight size={14} className="text-parchment-500" />
            <span className="text-parchment-300">{pageLabel}</span>
          </div>
        </div>

        <div className="min-h-full px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
