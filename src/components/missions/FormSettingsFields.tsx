"use client";
import { ShieldCheck, CircleHelp } from "lucide-react";
import { sensitiveQuestions, type FormSettings } from "@/lib/missions/forms";
import type { MissionTool } from "@/lib/missions/types";
export default function FormSettingsFields({
  tool,
  value,
  onChange,
}: {
  tool: MissionTool;
  value: FormSettings;
  onChange: (value: FormSettings) => void;
}) {
  const flags = sensitiveQuestions(tool);
  return (
    <section className="mission-form-settings">
      <h3>
        <ShieldCheck size={18} />
        Answer visibility and retention
      </h3>
      <label className="mission-field">
        <span>Who can see answers?</span>
        <select
          value={value.responseVisibility}
          onChange={(event) =>
            onChange({
              ...value,
              responseVisibility: event.target
                .value as FormSettings["responseVisibility"],
            })
          }
        >
          <option value="organizers">Organizers and the respondent</option>
          <option value="members">Everyone with access to this mission</option>
        </select>
      </label>
      <label className="mission-field">
        <span>Answer availability</span>
        <select
          value={value.retentionDays}
          onChange={(event) =>
            onChange({
              ...value,
              retentionDays: Number(
                event.target.value,
              ) as FormSettings["retentionDays"],
            })
          }
        >
          <option value={30}>30 days after the last save</option>
          <option value={90}>90 days after the last save</option>
          <option value={365}>365 days after the last save</option>
        </select>
        <small>
          Respondents see these terms before submitting and can remove their
          answers earlier. Published versions keep the same terms.
        </small>
      </label>
      {flags.length > 0 && (
        <div className="mission-questions">
          <h4>
            <CircleHelp size={18} />
            Review possible personal questions
          </h4>
          <ul>
            {flags.map((flag) => (
              <li key={flag}>{flag}</li>
            ))}
          </ul>
          <p>
            The check can miss sensitive questions. Remove unnecessary personal
            requests. Flagged forms must use organizer-only answers.
          </p>
          <label className="mission-field">
            <span>Why are these questions necessary?</span>
            <textarea
              minLength={20}
              maxLength={1000}
              rows={3}
              value={value.sensitiveReason}
              onChange={(event) =>
                onChange({ ...value, sensitiveReason: event.target.value })
              }
            />
            <small>
              Explain the need and basis for collecting this information. Do not
              include anyone’s personal information here.
            </small>
          </label>
        </div>
      )}
    </section>
  );
}
