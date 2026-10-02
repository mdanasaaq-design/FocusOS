// FocusOS — user preferences
// Preferences are stored inside users/{uid}/config/main so the system remains
// user-owned, portable, and independent from any specific life category.

export const DEFAULT_PREFERENCES = {
  language: "en",
  locale: "en-IN",
  direction: "ltr",
  calendar: { primary: "gregorian", secondary: "hijri", showSecondary: true },
  dateFormat: "long",
  timeFormat: "12h",
  timeZone: "Asia/Kolkata",
  weekStartsOn: 0,
  greeting: {
    enabled: true,
    mode: "time",
    text: "Hello",
    includeName: true,
    prefixEnabled: true,
    prefixText: "Assalamualaikum warahmatullahi wabarakatuh",
    timeMessages: { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening", night: "Good night" },
  },
  clock: { enabled: true, showSeconds: false },
  accessibility: { scale: "normal", highContrast: false, reducedMotion: false, largeTargets: false, density: "comfortable" },
};

const clone = (value) => JSON.parse(JSON.stringify(value));

export function normalizePreferences(preferences = {}) {
  const source = preferences && typeof preferences === "object" ? preferences : {};
  const calendar = source.calendar && typeof source.calendar === "object" ? source.calendar : {};
  const greeting = source.greeting && typeof source.greeting === "object" ? source.greeting : {};
  const timeMessages = greeting.timeMessages && typeof greeting.timeMessages === "object" ? greeting.timeMessages : {};
  const clock = source.clock && typeof source.clock === "object" ? source.clock : {};
  const accessibility = source.accessibility && typeof source.accessibility === "object" ? source.accessibility : {};
  const next = {
    ...clone(DEFAULT_PREFERENCES), ...source,
    calendar: { ...DEFAULT_PREFERENCES.calendar, ...calendar },
    greeting: { ...DEFAULT_PREFERENCES.greeting, ...greeting, timeMessages: { ...DEFAULT_PREFERENCES.greeting.timeMessages, ...timeMessages } },
    clock: { ...DEFAULT_PREFERENCES.clock, ...clock },
    accessibility: { ...DEFAULT_PREFERENCES.accessibility, ...accessibility },
  };
  if (!["ltr", "rtl"].includes(next.direction)) next.direction = "ltr";
  if (!["12h", "24h"].includes(next.timeFormat)) next.timeFormat = "12h";
  if (![0, 1].includes(Number(next.weekStartsOn))) next.weekStartsOn = 0;
  if (!["en", "ur", "hi", "ar", "te", "bn"].includes(next.language)) next.language = "en";
  if (["ur", "ar"].includes(next.language)) next.direction = "rtl";
  else if (next.direction === "rtl") next.direction = "ltr";
  if (!["normal", "large", "extra-large"].includes(next.accessibility.scale)) next.accessibility.scale = "normal";
  if (!["comfortable", "compact", "spacious"].includes(next.accessibility.density)) next.accessibility.density = "comfortable";
  if (!["gregorian", "hijri"].includes(next.calendar.primary)) next.calendar.primary = "gregorian";
  if (!["gregorian", "hijri", "none"].includes(next.calendar.secondary)) next.calendar.secondary = "hijri";
  next.calendar.showSecondary = next.calendar.secondary !== "none" && next.calendar.showSecondary !== false;
  if (!["custom", "time"].includes(next.greeting.mode)) next.greeting.mode = "time";
  next.greeting.enabled = next.greeting.enabled !== false;
  next.greeting.includeName = next.greeting.includeName !== false;
  next.greeting.prefixEnabled = next.greeting.prefixEnabled !== false;
  next.greeting.text = typeof next.greeting.text === "string" && next.greeting.text.trim() ? next.greeting.text.trim() : DEFAULT_PREFERENCES.greeting.text;
  next.greeting.prefixText = typeof next.greeting.prefixText === "string" && next.greeting.prefixText.trim() ? next.greeting.prefixText.trim() : DEFAULT_PREFERENCES.greeting.prefixText;
  for (const key of ["morning", "afternoon", "evening", "night"]) {
    if (typeof next.greeting.timeMessages[key] !== "string" || !next.greeting.timeMessages[key].trim()) next.greeting.timeMessages[key] = DEFAULT_PREFERENCES.greeting.timeMessages[key];
  }
  next.clock.enabled = next.clock.enabled !== false;
  next.clock.showSeconds = next.clock.showSeconds === true;
  return next;
}

export function getDateTimeLocale(preferences) { return normalizePreferences(preferences).locale || "en-IN"; }

export function formatConfiguredDate(date, preferences, options = {}) {
  const normalized = normalizePreferences(preferences);
  return new Intl.DateTimeFormat(normalized.locale || "en-IN", { ...options, timeZone: options.timeZone || normalized.timeZone }).format(date);
}

export function formatConfiguredTime(date, preferences, options = {}) {
  const normalized = normalizePreferences(preferences);
  return new Intl.DateTimeFormat(normalized.locale || "en-IN", { hour: "numeric", minute: "2-digit", hour12: normalized.timeFormat === "12h", ...options, timeZone: options.timeZone || normalized.timeZone }).format(date);
}

export function getConfiguredTimeGreeting(date = new Date(), preferences) {
  const normalized = normalizePreferences(preferences);
  if (normalized.greeting.mode === "custom") return normalized.greeting.text;
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: normalized.timeZone }).format(date));
  let timeGreeting = normalized.greeting.timeMessages.night;
  if (hour >= 5 && hour < 12) timeGreeting = normalized.greeting.timeMessages.morning;
  else if (hour >= 12 && hour < 17) timeGreeting = normalized.greeting.timeMessages.afternoon;
  else if (hour >= 17 && hour < 21) timeGreeting = normalized.greeting.timeMessages.evening;
  return normalized.greeting.prefixEnabled && normalized.greeting.prefixText ? `${normalized.greeting.prefixText}, ${timeGreeting}` : timeGreeting;
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
