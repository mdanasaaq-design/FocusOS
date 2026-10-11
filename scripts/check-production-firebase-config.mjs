import { existsSync, readFileSync } from "node:fs";

const envFile = existsSync(".env") ? readFileSync(".env", "utf8") : "";
const fileValues = {};

for (const rawLine of envFile.split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || line.startsWith("#")) continue;
  const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (!match) continue;
  let value = match[2].trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  fileValues[match[1]] = value;
}

const getValue = (name) => process.env[name] ?? fileValues[name] ?? "";
const required = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];
const missing = required.filter((name) => !getValue(name).trim());

if (missing.length) {
  console.error("Production deployment blocked. Missing Firebase Web configuration:");
  for (const name of missing) console.error(`  - ${name}`);
  console.error("Copy the values for the FocusOS Web app from Firebase Console into .env, then retry.");
  process.exit(1);
}

const apiKey = getValue("VITE_FIREBASE_API_KEY").trim();
if (!apiKey.startsWith("AIzaSy") || /^(demo|your|replace|placeholder)/i.test(apiKey)) {
  console.error("Production deployment blocked: VITE_FIREBASE_API_KEY does not look like a real Google API key.");
  console.error("Use the Web API key from Firebase Console for project focusos-7cd08. Do not use emulator/demo values.");
  process.exit(1);
}

if (getValue("VITE_FIREBASE_PROJECT_ID").trim() !== "focusos-7cd08") {
  console.error("Production deployment blocked: VITE_FIREBASE_PROJECT_ID must be focusos-7cd08.");
  process.exit(1);
}

if (getValue("VITE_FIREBASE_EMULATORS").trim().toLowerCase() === "true") {
  console.error("Production deployment blocked: VITE_FIREBASE_EMULATORS must not be true.");
  process.exit(1);
}

console.log("Firebase deployment configuration preflight passed for focusos-7cd08.");
console.log("The live smoke test will still verify that Firebase accepts the API key.");
