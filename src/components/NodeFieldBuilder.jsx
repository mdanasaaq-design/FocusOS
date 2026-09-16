import { Plus, Trash2 } from "lucide-react";
import { FIELD_TYPES } from "../data/nodeValidation";

const TYPE_LABELS = {
  text: "Text",
  number: "Number",
  checkbox: "Checkbox",
  date: "Date",
  time: "Time",
  duration: "Duration",
  percentage: "Percentage",
  select: "Select",
  tags: "Tags",
  url: "URL",
  file: "File",
};

function createField(index) {
  return {
    id: `field_${Date.now()}_${index}`,
    name: "",
    type: "text",
    required: false,
    options: [],
    unit: "",
  };
}

export default function NodeFieldBuilder({ fields, onChange }) {
  function updateField(index, patch) {
    onChange(fields.map((field, fieldIndex) => (
      fieldIndex === index ? { ...field, ...patch } : field
    )));
  }

  function addField() {
    onChange([...fields, createField(fields.length + 1)]);
  }

  function removeField(index) {
    onChange(fields.filter((_, fieldIndex) => fieldIndex !== index));
  }

  function updateOptions(index, value) {
    updateField(index, {
      options: value.split("\n").map((option) => option.trim()).filter(Boolean),
    });
  }

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <p className="text-xs text-parchment-300/60 border border-dashed border-ink-600 rounded-lg p-4">
          No custom fields yet. Add fields to define the data this node stores.
        </p>
      )}

      {fields.map((field, index) => (
        <div key={field.id} className="rounded-lg border border-ink-600 bg-ink-800/60 p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-brass-400 font-semibold">Field {index + 1}</span>
            <button
              type="button"
              onClick={() => removeField(index)}
              className="p-1.5 rounded-md text-parchment-300/60 hover:text-clay-400 hover:bg-ink-700"
              title="Remove field"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-xs text-parchment-300">
              Field name
              <input
                value={field.name}
                onChange={(event) => updateField(index, { name: event.target.value })}
                placeholder="e.g. Amount"
                className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm text-parchment-100 outline-none focus:border-brass-500"
              />
            </label>

            <label className="text-xs text-parchment-300">
              Type
              <select
                value={field.type}
                onChange={(event) => updateField(index, {
                  type: event.target.value,
                  options: event.target.value === "select" ? field.options : [],
                  unit: event.target.value === "number" || event.target.value === "duration" ? field.unit : "",
                })}
                className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm text-parchment-100 outline-none focus:border-brass-500"
              >
                {FIELD_TYPES.map((type) => (
                  <option key={type} value={type}>{TYPE_LABELS[type]}</option>
                ))}
              </select>
            </label>
          </div>

          {(field.type === "number" || field.type === "duration" || field.type === "percentage") && (
            <label className="block text-xs text-parchment-300">
              Unit (optional)
              <input
                value={field.unit || ""}
                onChange={(event) => updateField(index, { unit: event.target.value })}
                placeholder={field.type === "percentage" ? "%" : "e.g. kg, litres, minutes"}
                className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm text-parchment-100 outline-none focus:border-brass-500"
              />
            </label>
          )}

          {field.type === "select" && (
            <label className="block text-xs text-parchment-300">
              Options (one per line)
              <textarea
                value={(field.options || []).join("\n")}
                onChange={(event) => updateOptions(index, event.target.value)}
                placeholder={"Low\nMedium\nHigh"}
                rows={3}
                className="mt-1 w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-sm text-parchment-100 outline-none focus:border-brass-500 resize-y"
              />
            </label>
          )}

          <label className="inline-flex items-center gap-2 text-xs text-parchment-300 cursor-pointer">
            <input
              type="checkbox"
              checked={field.required === true}
              onChange={(event) => updateField(index, { required: event.target.checked })}
              className="accent-brass-500"
            />
            Required field
          </label>
        </div>
      ))}

      <button
        type="button"
        onClick={addField}
        className="inline-flex items-center gap-2 text-sm text-brass-400 hover:text-brass-300"
      >
        <Plus size={15} />
        Add custom field
      </button>
    </div>
  );
}
