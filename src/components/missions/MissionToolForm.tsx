"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import type { MissionTool } from "@/lib/missions/types";
export default function MissionToolForm({
  tool,
  preview = false,
  initialValues,
  busy = false,
  onSubmit,
}: {
  tool: MissionTool;
  preview?: boolean;
  initialValues?: Record<string, string>;
  busy?: boolean;
  onSubmit?: (values: Record<string, string>) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>(
    initialValues || {},
  );
  const [saved, setSaved] = useState(false);
  const savedValues = JSON.stringify(initialValues || {});
  useEffect(() => {
    setValues(JSON.parse(savedValues));
    setSaved(false);
  }, [savedValues]);
  return (
    <form
      className="mission-generated-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!preview && onSubmit) {
          setSaved(false);
          try {
            await onSubmit(values);
            setSaved(true);
          } catch {
            /* Parent displays the request error; preserve form values. */
          }
        }
      }}
    >
      <div className="eyebrow">
        {preview ? "TOOL PREVIEW" : "BUILT FOR THIS MISSION"}
      </div>
      <h3>{tool.title}</h3>
      <p>{tool.description}</p>
      {tool.fields.map((field) => (
        <label key={field.id} className="mission-field">
          <span>
            {field.label}
            {field.required && <span aria-hidden="true"> *</span>}
          </span>
          {field.kind === "choice" ? (
            <select
              required={field.required}
              disabled={preview || busy}
              value={values[field.id] || ""}
              onChange={(e) => {
                setSaved(false);
                setValues((v) => ({ ...v, [field.id]: e.target.value }));
              }}
            >
              <option value="">Choose an option</option>
              {field.options.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          ) : (
            <textarea
              rows={2}
              maxLength={500}
              required={field.required}
              disabled={preview || busy}
              value={values[field.id] || ""}
              onChange={(e) => {
                setSaved(false);
                setValues((v) => ({ ...v, [field.id]: e.target.value }));
              }}
            />
          )}
        </label>
      ))}
      {!preview && (
        <>
          <p className="mission-small">
            Your name and response are visible to people with access to this
            mission.
          </p>
          <button className="civic-button" disabled={busy}>
            {busy
              ? "Saving…"
              : initialValues
                ? "Update my response"
                : "Add my response"}
            <ArrowUpRight size={16} />
          </button>
          {saved && (
            <p role="status" className="mission-success">
              <Check size={14} />
              Your response is saved.
            </p>
          )}
        </>
      )}
    </form>
  );
}
