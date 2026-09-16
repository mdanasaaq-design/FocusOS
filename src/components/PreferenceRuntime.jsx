import { useEffect } from "react";
import { useAuth } from "../lib/auth";
import { subscribeConfig } from "../lib/data";
import { applyPreferencesToDocument } from "../lib/preferences";

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
