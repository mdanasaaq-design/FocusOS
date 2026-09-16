// FocusOS — user preferences
// Preferences are stored inside users/{uid}/config/main so the system remains
// user-owned, portable, and independent from any specific life category.

export const DEFAULT_PREFERENCES = {
  language: "en",
  locale: "en-IN",
  direction: "ltr",
  calendar: {
    primary: "gregorian",
    secondary: "hijri",
    showSecondary: true,
  },
  dateFormat: "long",
  timeFormat: "12h",
  timeZone: "Asia/Kolkata",
  weekStartsOn: 0,
  greeting: {
    enabled: true,
    text: "Assalamualaikum warahmatullahi wabarkatahu",
    includeName: true,
  },
  accessibility: {
    scale: "normal",
    highContrast: false,
    reducedMotion: false,
    largeTargets: false,
    density: "comfortable",
  },
};

const clone = (value) => JSON.parse(JSON.stringify(value));

export function normalizePreferences(preferences = {}) {
  const source = preferences && typeof preferences === "object" ? preferences : {};
  const calendar = source.calendar && typeof source.calendar === "object" ? source.calendar : {};
  const greeting = source.greeting && typeof source.greeting === "object" ? source.greeting : {};
  const accessibility = source.accessibility && typeof source.accessibility === "object" ? source.accessibility : {};

  const next = {
    ...clone(DEFAULT_PREFERENCES),
    ...source,
    calendar: { ...DEFAULT_PREFERENCES.calendar, ...calendar },
    greeting: { ...DEFAULT_PREFERENCES.greeting, ...greeting },
    accessibility: { ...DEFAULT_PREFERENCES.accessibility, ...accessibility },
  };

  if (!["ltr", "rtl"].includes(next.direction)) next.direction = "ltr";
  if (!["12h", "24h"].includes(next.timeFormat)) next.timeFormat = "12h";
  if (![0, 1].includes(Number(next.weekStartsOn))) next.weekStartsOn = 0;
  if (!["normal", "large", "extra-large"].includes(next.accessibility.scale)) next.accessibility.scale = "normal";
  if (!["comfortable", "compact", "spacious"].includes(next.accessibility.density)) next.accessibility.density = "comfortable";
  if (!["gregorian", "hijri"].includes(next.calendar.primary)) next.calendar.primary = "gregorian";
  if (!["gregorian", "hijri", "none"].includes(next.calendar.secondary)) next.calendar.secondary = "hijri";
  next.calendar.showSecondary = next.calendar.secondary !== "none" && next.calendar.showSecondary !== false;
  next.greeting.enabled = next.greeting.enabled !== false;
  next.greeting.includeName = next.greeting.includeName !== false;
  next.greeting.text = typeof next.greeting.text === "string" && next.greeting.text.trim()
    ? next.greeting.text.trim()
    : DEFAULT_PREFERENCES.greeting.text;
  return next;
}

export function getDateTimeLocale(preferences) {
  return normalizePreferences(preferences).locale || "en-IN";
}

export function formatConfiguredDate(date, preferences, options = {}) {
  const normalized = normalizePreferences(preferences);
  return new Intl.DateTimeFormat(normalized.locale || "en-IN", {
    ...options,
    timeZone: options.timeZone || normalized.timeZone,
  }).format(date);
}

export function formatConfiguredTime(date, preferences, options = {}) {
  const normalized = normalizePreferences(preferences);
  return new Intl.DateTimeFormat(normalized.locale || "en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: normalized.timeFormat === "12h",
    ...options,
    timeZone: options.timeZone || normalized.timeZone,
  }).format(date);
}

export function applyPreferencesToDocument(preferences) {
  const normalized = normalizePreferences(preferences);
  const root = document.documentElement;
  root.lang = normalized.language || "en";
  root.dir = normalized.direction;
  root.dataset.uiScale = normalized.accessibility.scale;
  root.dataset.density = normalized.accessibility.density;
  root.classList.toggle("high-contrast", normalized.accessibility.highContrast);
  root.classList.toggle("reduced-motion", normalized.accessibility.reducedMotion);
  root.classList.toggle("large-targets", normalized.accessibility.largeTargets);
}
