import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { subscribeConfig } from "../lib/data";
import { applyPreferencesToDocument } from "../lib/preferences";

export function usePreferences() { const { user } = useAuth(); const [preferences, setPreferences] = useState({}); useEffect(() => { if (!user) return undefined; return subscribeConfig(user.uid, (config) => setPreferences(config?.preferences || {})); }, [user]); return preferences; }

export default function PreferenceRuntime() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    return subscribeConfig(user.uid, (config) => {
      applyPreferencesToDocument(config?.preferences);
    });
  }, [user]);

  return null;
}
