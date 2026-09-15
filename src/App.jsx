import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { seedInitialData, subscribeProfile } from "./lib/data";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Timetables from "./pages/Timetables";
import Study from "./pages/Study";
import Pomodoro from "./pages/Pomodoro";
import Exercise from "./pages/Exercise";
import Habits from "./pages/Habits";
import Settings from "./pages/Settings";

function Gate({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(undefined);

  useEffect(() => {
    if (!user) return;
    seedInitialData(user.uid);
    // NOTE: Automatic Study migration was removed from startup per the
    // architecture foundation decision — see CLAUDE.md "Study/Work" and
    // PROJECT_STATUS.md. Any future subjects -> Study import must be an
    // explicit, user-triggered, non-destructive action, never automatic.
    const unsub = subscribeProfile(user.uid, setProfile);
    return unsub;
  }, [user]);

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950 text-parchment-300 text-sm">
        Loading…
      </div>
    );
  }
  if (user === null) return <Login />;

  if (profile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950 text-parchment-300 text-sm">
        Loading…
      </div>
    );
  }
  if (profile === null) return <ProfileSetup />;

  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Gate><Dashboard /></Gate>} />
      <Route path="/calendar" element={<Gate><Calendar /></Gate>} />
      <Route path="/timetables" element={<Gate><Timetables /></Gate>} />
      <Route path="/study" element={<Gate><Study /></Gate>} />
      <Route path="/pomodoro" element={<Gate><Pomodoro /></Gate>} />
      <Route path="/exercise" element={<Gate><Exercise /></Gate>} />
      <Route path="/habits" element={<Gate><Habits /></Gate>} />
      <Route path="/settings" element={<Gate><Settings /></Gate>} />
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
