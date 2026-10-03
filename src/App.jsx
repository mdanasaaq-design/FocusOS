import React, { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { subscribeProfile } from "./lib/data";
import { purgeExpiredTrash } from "./data/pages";
import Layout from "./components/Layout";
import PreferenceRuntime from "./components/PreferenceRuntime";

const Login = lazy(() => import("./pages/Login"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NodeDetail = lazy(() => import("./pages/NodeDetail"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Workspace = lazy(() => import("./pages/Workspace"));
const Timetables = lazy(() => import("./pages/Timetables"));
const Study = lazy(() => import("./pages/Study"));
const Pomodoro = lazy(() => import("./pages/Pomodoro"));
const Exercise = lazy(() => import("./pages/Exercise"));
const Habits = lazy(() => import("./pages/Habits"));
const Settings = lazy(() => import("./pages/Settings"));
const SettingsHub = lazy(() => import("./pages/SettingsHub"));
const UserPage = lazy(() => import("./pages/UserPage"));

const PageLoading = () => <div className="min-h-screen flex items-center justify-center bg-ink-950 text-parchment-300 text-sm">Loading…</div>;

class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return <div className="min-h-screen flex items-center justify-center bg-ink-950 px-4"><div className="max-w-lg w-full card p-6"><p className="text-xs uppercase tracking-wider text-clay-400">FocusOS recovered from an error</p><h1 className="text-xl font-semibold mt-2">This screen could not be loaded.</h1><p className="text-sm text-parchment-300/60 mt-2">Your data was not intentionally changed. Check your settings or reload the page.</p><button type="button" onClick={() => window.location.reload()} className="mt-5 px-4 py-2 rounded-lg bg-brass-500 text-ink-950 font-semibold text-sm">Reload FocusOS</button></div></div>;
  }
}

function Gate({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(undefined);

  useEffect(() => {
    if (!user) return undefined;
    setProfile(undefined);
    purgeExpiredTrash(user.uid).catch((error) => console.error("Trash cleanup failed", error));
    return subscribeProfile(user.uid, setProfile);
  }, [user]);

  if (user === undefined) return <PageLoading />;
  if (user === null) return <Suspense fallback={<PageLoading />}><Login /></Suspense>;
  if (profile === undefined) return <PageLoading />;
  if (profile === null) return <Suspense fallback={<PageLoading />}><ProfileSetup /></Suspense>;

  return <Layout><PreferenceRuntime />{children}</Layout>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/" element={<Gate><Dashboard /></Gate>} />
        <Route path="/pages" element={<Gate><Workspace /></Gate>} />
        <Route path="/workspace" element={<Navigate to="/pages" replace />} />
        <Route path="/page/:pageId/:viewKey" element={<Gate><UserPage /></Gate>} />
        <Route path="/page/:pageId" element={<Gate><UserPage /></Gate>} />
        <Route path="/pages/node/:nodeId" element={<Gate><NodeDetail /></Gate>} />
        <Route path="/workspace/node/:nodeId" element={<Navigate to="/pages" replace />} />
        <Route path="/calendar" element={<Gate><Calendar /></Gate>} />
        <Route path="/timetables" element={<Gate><Timetables /></Gate>} />
        <Route path="/study" element={<Gate><Study /></Gate>} />
        <Route path="/pomodoro" element={<Gate><Pomodoro /></Gate>} />
        <Route path="/exercise" element={<Gate><Exercise /></Gate>} />
        <Route path="/habits" element={<Gate><Habits /></Gate>} />
        <Route path="/settings" element={<Gate><SettingsHub /></Gate>} />
        <Route path="/settings/legacy" element={<Gate><Settings /></Gate>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AppErrorBoundary><AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider></AppErrorBoundary>
  );
}
