// Gregorian <-> Hijri conversion using the standard tabular (civil) Islamic
// calendar algorithm. This is an ARITHMETIC approximation, not based on
// actual moon sighting — real Hijri dates announced by local moon-sighting
// committees can differ by ±1 day. `adjustmentDays` (stored on the user's
// profile) lets the displayed date be nudged to match local convention
// without touching this calculation logic.

const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
  "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah",
];

function gregorianToJD(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return (
    d +
    Math.floor((153 * m2 + 2) / 5) +
    365 * y2 +
    Math.floor(y2 / 4) -
    Math.floor(y2 / 100) +
    Math.floor(y2 / 400) -
    32045
  );
}

function jdToHijri(jd) {
  const ISLAMIC_EPOCH = 1948440;
  let l = jd - ISLAMIC_EPOCH + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l =
    l -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { year, month, day };
}

/**
 * Convert a JS Date to a Hijri {year, month, day, monthName} object.
 * @param {Date} date
 * @param {number} adjustmentDays - optional ±1 (or more) day offset
 */
export function toHijri(date = new Date(), adjustmentDays = 0) {
  const d = new Date(date);
  d.setDate(d.getDate() + adjustmentDays);
  const jd = gregorianToJD(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const { year, month, day } = jdToHijri(jd);
  return {
    year,
    month, // 1-indexed
    day,
    monthName: HIJRI_MONTHS[month - 1] || "",
  };
}

export function formatHijri(date = new Date(), adjustmentDays = 0) {
  const h = toHijri(date, adjustmentDays);
  return `${h.day} ${h.monthName} ${h.year} AH`;
}

export { HIJRI_MONTHS };
