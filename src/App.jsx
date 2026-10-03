import { lazy, Suspense, useEffect, useState } from "react";
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
        <Route path="/workspace" element={<Gate><Workspace /></Gate>} />
        <Route path="/page/:pageId/:viewKey" element={<Gate><UserPage /></Gate>} />
        <Route path="/page/:pageId" element={<Gate><UserPage /></Gate>} />
        <Route path="/workspace/node/:nodeId" element={<Gate><NodeDetail /></Gate>} />
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
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
