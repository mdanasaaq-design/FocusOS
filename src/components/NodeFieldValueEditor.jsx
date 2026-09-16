import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { getNodeFieldValues, setNodeFieldValues } from "../data/nodeValues";

function todayKey() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function normalizeInputValue(field, value) {
  if (field.type === "checkbox") return value === true;
  if (field.type === "number" || field.type === "percentage") return value === "" ? "" : Number(value);
  return value ?? "";
}

function FieldInput({ field, value, onChange }) {
  const common = "mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm text-parchment-100 outline-none focus:border-brass-500";

  if (field.type === "checkbox") {
    return <label className="mt-2 inline-flex items-center gap-2 text-sm text-parchment-200"><input type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} className="accent-brass-500" /> Completed</label>;
  }

  if (field.type === "select") {
    return <select value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={common}><option value="">Select…</option>{(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}</select>;
  }

  if (field.type === "tags") {
    return <input value={Array.isArray(value) ? value.join(", ") : value ?? ""} onChange={(event) => onChange(event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))} placeholder="tag1, tag2" className={common} />;
  }

  const type = ["date", "time", "number"].includes(field.type) ? field.type : "text";
  return <div className="flex gap-2"><input type={type} value={value ?? ""} onChange={(event) => onChange(normalizeInputValue(field, event.target.value))} className={common} />{field.unit && <span className="self-end pb-2 text-xs text-parchment-300/60">{field.unit}</span>}</div>;
}

export default function NodeFieldValueEditor({ node, user }) {
  const [dateKey, setDateKey] = useState(todayKey);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setSaved(false);
    setError("");
    getNodeFieldValues(user.uid, node.id, dateKey)
      .then((nextValues) => { if (active) setValues(nextValues); })
      .catch((err) => { if (active) setError(err.message || "Unable to load values."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [dateKey, node.id, user.uid]);

  function changeValue(fieldId, value) {
    setValues((current) => ({ ...current, [fieldId]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      await setNodeFieldValues(user.uid, node.id, values, dateKey);
      setSaved(true);
    } catch (err) {
      setError(err.message || "Unable to save values.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-ink-700 bg-ink-900/50 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div><p className="text-xs text-brass-500">Node data</p><h4 className="text-sm font-semibold">Record values for {node.name}</h4></div>
        <label className="text-xs text-parchment-300">Date<input type="date" value={dateKey} onChange={(event) => setDateKey(event.target.value)} className="mt-1 bg-ink-700 border border-ink-600 rounded-md px-2 py-1.5 text-xs" /></label>
      </div>
      {loading ? <p className="text-xs text-parchment-300/60">Loading values…</p> : node.fields?.length ? (
        <div className="space-y-3">
          {node.fields.map((field) => <label key={field.id} className="block text-xs text-parchment-300">{field.name}{field.required && <span className="text-clay-400"> *</span>}<FieldInput field={field} value={values[field.id]} onChange={(value) => changeValue(field.id, value)} /></label>)}
          <div className="flex items-center justify-end gap-3 pt-2"><span className="text-xs text-emerald-400">{saved ? "Saved ✓" : error}</span><button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-brass-500 hover:bg-brass-400 disabled:opacity-50 text-ink-950 font-semibold px-3 py-2 text-xs"><Save size={14} />{saving ? "Saving…" : "Save values"}</button></div>
        </div>
      ) : <p className="text-xs text-parchment-300/60">This node has no custom fields yet. Configure fields first.</p>}
    </div>
  );
}
