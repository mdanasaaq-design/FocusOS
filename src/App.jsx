import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { subscribeProfile } from "./lib/data";
import Layout from "./components/Layout";
import PreferenceRuntime from "./components/PreferenceRuntime";
import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import NodeDetail from "./pages/NodeDetail";
import Calendar from "./pages/Calendar";
import Timetables from "./pages/Timetables";
import Study from "./pages/Study";
import Pomodoro from "./pages/Pomodoro";
import Exercise from "./pages/Exercise";
import Habits from "./pages/Habits";
import Settings from "./pages/Settings";
import SettingsHub from "./pages/SettingsHub";
import UserPage from "./pages/UserPage";

function Gate({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(undefined);

  useEffect(() => {
    if (!user) {
      setProfile(undefined);
      return;
    }

    setProfile(undefined);
    const unsub = subscribeProfile(user.uid, setProfile);
    return unsub;
  }, [user]);

  if (user === undefined) return <div className="min-h-screen flex items-center justify-center bg-ink-950 text-parchment-300 text-sm">Loading…</div>;
  if (user === null) return <Login />;
  if (profile === undefined) return <div className="min-h-screen flex items-center justify-center bg-ink-950 text-parchment-300 text-sm">Loading…</div>;
  if (profile === null) return <ProfileSetup />;

  return <Layout><PreferenceRuntime />{children}</Layout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Gate><Dashboard /></Gate>} />
      <Route path="/workspace" element={<Navigate to="/settings" replace />} />
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
