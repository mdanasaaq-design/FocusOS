import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-ink-950">
      <Sidebar />

      <main id="main-content" tabIndex="-1" className="flex-1 min-w-0 overflow-y-auto pt-14 pb-16 md:pt-0 md:pb-0">
        <div key={location.pathname} className="focusos-page-enter min-h-full px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
