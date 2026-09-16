import { useEffect, useMemo, useState } from "react";
import { getNodeFieldValues, setNodeFieldValues } from "../data/nodeValues";
import { subscribeUserCapabilities, userCapabilityKey } from "../data/userCapabilities";

function CapabilityFieldInput({ field, value, onChange }) {
  const common = "w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-brass-500";

  if (field.type === "checkbox") {
    return <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4" /> {field.name}</label>;
  }

  if (field.type === "select") {
    return <select value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={common}><option value="">Select an option</option>{(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}</select>;
  }

  if (field.type === "tags") {
    return <input value={Array.isArray(value) ? value.join(", ") : value ?? ""} onChange={(event) => onChange(event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))} placeholder="tag1, tag2, tag3" className={common} />;
  }

  if (field.type === "file") {
    return <p className="text-xs text-parchment-300/60 border border-dashed border-ink-600 rounded-lg px-3 py-3">File storage will be connected in a later step.</p>;
  }

  const inputType = field.type === "number" || field.type === "percentage" ? "number" : ["date", "time", "url"].includes(field.type) ? field.type : "text";
  return <input type={inputType} value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={common} />;
}

/**
 * Renders the fields belonging to custom capabilities attached to a node.
 * Capability values intentionally use the same dated node-value document as
 * native node fields, so the history remains centralized and persistent.
 */
export default function NodeCapabilityDataEditor({ node, user, dateKey }) {
  const [capabilities, setCapabilities] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const assignedCustomKeys = useMemo(
    () => (Array.isArray(node.capabilities) ? node.capabilities.filter((key) => key.startsWith("custom:")) : []),
    [node.capabilities]
  );

  useEffect(() => {
    if (!user) return () => {};
    return subscribeUserCapabilities(user.uid, (all) => {
      const allowed = new Set(assignedCustomKeys);
      setCapabilities(all.filter((capability) => allowed.has(userCapabilityKey(capability.id))));
    });
  }, [user, assignedCustomKeys]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getNodeFieldValues(user.uid, node.id, dateKey)
      .then((nextValues) => { if (active) setValues(nextValues); })
      .catch((error) => { if (active) setMessage(error.message || "Unable to load capability data."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user, node.id, dateKey]);

  function updateValue(capabilityId, fieldId, value) {
    const valueKey = `${capabilityId}.${fieldId}`;
    setValues((current) => ({ ...current, [valueKey]: value }));
    setMessage("");
  }

  async function saveValues() {
    setSaving(true);
    setMessage("");
    try {
      await setNodeFieldValues(user.uid, node.id, values, dateKey);
      setMessage("Capability data saved ✓");
    } catch (error) {
      setMessage(error.message || "Unable to save capability data.");
    } finally {
      setSaving(false);
    }
  }

  if (assignedCustomKeys.length === 0) return null;

  return (
    <section className="mt-6 pt-6 border-t border-ink-700">
      <div className="mb-4">
        <p className="text-xs text-brass-500">Custom capabilities</p>
        <p className="text-xs text-parchment-300/60 mt-1">These fields come from capabilities you created and attached to this node.</p>
      </div>

      {loading ? <p className="text-sm text-parchment-300/60">Loading capability data…</p> : capabilities.length === 0 ? (
        <p className="text-sm text-parchment-300/60">Attached custom capabilities are unavailable or archived.</p>
      ) : (
        <div className="space-y-5">
          {capabilities.map((capability) => (
            <div key={capability.id} className="rounded-xl border border-ink-600 p-4 space-y-4">
              <div><p className="text-sm font-semibold">{capability.name}</p>{capability.description && <p className="text-xs text-parchment-300/60 mt-1">{capability.description}</p>}</div>
              {(capability.fields || []).map((field) => {
                const valueKey = `${capability.id}.${field.id}`;
                return <div key={valueKey}>
                  {field.type === "checkbox" ? <CapabilityFieldInput field={field} value={values[valueKey]} onChange={(value) => updateValue(capability.id, field.id, value)} /> : <><label className="block text-xs text-parchment-300 mb-1">{field.name}{field.required ? " *" : ""}</label><CapabilityFieldInput field={field} value={values[valueKey]} onChange={(value) => updateValue(capability.id, field.id, value)} />{field.unit && <p className="text-[11px] text-parchment-300/50 mt-1">Unit: {field.unit}</p>}</>}
                </div>;
              })}
            </div>
          ))}
          <div className="flex items-center justify-between gap-3">
            <p className={`text-sm ${message.includes("✓") ? "text-emerald-400" : "text-clay-400"}`}>{message}</p>
            <button type="button" onClick={saveValues} disabled={saving} className="px-4 py-2 rounded-lg bg-brass-500 hover:bg-brass-400 text-ink-950 font-semibold text-sm">{saving ? "Saving…" : "Save capability data"}</button>
          </div>
        </div>
      )}
    </section>
  );
}
