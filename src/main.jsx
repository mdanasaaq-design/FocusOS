import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <main className="min-h-screen flex items-center justify-center bg-ink-950 px-6 text-parchment-100">
    <p role="status" className="text-sm text-parchment-300">Starting FocusOS…</p>
  </main>
);

import("./App.jsx")
  .then(({ default: App }) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  })
  .catch((error) => {
    console.error("FocusOS startup failed", error);
    root.render(
      <main className="min-h-screen flex items-center justify-center bg-ink-950 px-6 py-10 text-parchment-100">
        <section role="alert" className="w-full max-w-lg rounded-2xl border border-ink-700 bg-ink-900 p-6">
          <p className="text-xs uppercase tracking-wider text-clay-400">Startup error</p>
          <h1 className="mt-2 text-xl font-semibold">FocusOS could not start.</h1>
          <p className="mt-3 text-sm leading-6 text-parchment-300">
            The application failed while loading its startup modules. Check the Firebase Web app configuration,
            especially the API key, and verify that the latest production build was created with the correct
            VITE_FIREBASE_* environment values.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-lg bg-brass-500 px-4 py-2 text-sm font-semibold text-ink-950"
          >
            Reload FocusOS
          </button>
        </section>
      </main>
    );
  });
