"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, Check, Users } from "lucide-react";
import { answerNotice } from "@/lib/missions/forms";
import type { MissionTool } from "@/lib/missions/types";
export default function MissionToolForm({
  tool,
  preview = false,
  closed = false,
  responseVisibility = "members",
  retentionDays = null,
  initialOfferToHelp = false,
  initialValues,
  busy = false,
  onSubmit,
}: {
  tool: MissionTool;
  preview?: boolean;
  closed?: boolean;
  responseVisibility?: "organizers" | "members";
  retentionDays?: number | null;
  initialOfferToHelp?: boolean;
  initialValues?: Record<string, string>;
  busy?: boolean;
  onSubmit?: (
    values: Record<string, string>,
    offerToHelp: boolean,
  ) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>(
    initialValues || {},
  );
  const [offerToHelp, setOfferToHelp] = useState(initialOfferToHelp);
  const [saved, setSaved] = useState(false);
  const savedValues = JSON.stringify(initialValues || {});
  useEffect(() => {
    setValues(JSON.parse(savedValues));
    setSaved(false);
  }, [savedValues]);
  useEffect(() => setOfferToHelp(initialOfferToHelp), [initialOfferToHelp]);
  return (
    <form
      className="mission-generated-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!preview && !closed && onSubmit) {
          setSaved(false);
          try {
            await onSubmit(values, offerToHelp);
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
              disabled={preview || busy || closed}
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
              disabled={preview || busy || closed}
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
          <div className="mission-response-notice">
            <Users size={18} aria-hidden="true" />
            <p>
              <strong>
                {responseVisibility === "members"
                  ? "Shared with your mission."
                  : "Visible to organizers and you."}
              </strong>{" "}
              {answerNotice(responseVisibility, retentionDays).text}
            </p>
          </div>
          {closed ? (
            <p className="mission-small" role="status">
              This form is closed to answers. Your saved response can still be
              removed.
            </p>
          ) : (
            <label className="mission-offer-optin">
              <input
                type="checkbox"
                checked={offerToHelp}
                onChange={(event) => setOfferToHelp(event.target.checked)}
                disabled={busy}
              />
              <span>
                Suggest tasks I could help with from this answer. Organizers and
                I can see suggestions; I choose whether to accept.
              </span>
            </label>
          )}
          <button className="civic-button" disabled={busy || closed}>
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
