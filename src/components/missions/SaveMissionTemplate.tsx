"use client";
import { useState } from "react";
import { BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Mission } from "@/lib/missions/types";
export default function SaveMissionTemplate({
  mission,
  demo,
}: {
  mission: Mission;
  demo: boolean;
}) {
  const plan = mission.runs.find(
    (run) =>
      run.stage === "plan" &&
      run.acceptedAt &&
      run.inputRevision === mission.revision,
  );
  const form = mission.runs.find(
    (run) =>
      run.stage === "tool" &&
      run.acceptedAt &&
      run.inputRevision === mission.revision &&
      (!run.formState || ["published", "closed"].includes(run.formState)),
  );
  const [open, setOpen] = useState(false),
    [name, setName] = useState(mission.title),
    [scope, setScope] = useState("private"),
    [includePlan, setIncludePlan] = useState(false),
    [includeForm, setIncludeForm] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  return (
    <>
      <button
        className="mission-build-manual"
        disabled={!plan && !form}
        onClick={() => setOpen(true)}
        title={
          !plan && !form
            ? "Adopt a current plan or publish a form first."
            : undefined
        }
      >
        <BookOpen size={16} />
        Save a template
      </button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value);
        }}
      >
        <DialogContent className="mission-dialog">
          <DialogTitle>Pass a good starting point along.</DialogTitle>
          <DialogDescription>
            Only the selected plan and questions are copied. Responses,
            participants, completion evidence and source excerpts stay in this
            mission. Review the text for private details before sharing.
          </DialogDescription>
          {demo ? (
            <p>
              Templates are available in real missions. This example does not
              save shared content.
            </p>
          ) : (
            <>
              <form
                onSubmit={async (event) => {
                  event.preventDefault();
                  setBusy(true);
                  setError("");
                  try {
                    const response = await fetch("/api/mission-templates", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        missionId: mission.id,
                        name,
                        scope,
                        planRunId: includePlan ? plan?.id : null,
                        formRunId: includeForm ? form?.id : null,
                      }),
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error);
                    setNotice("Template saved. Find it in Mission Studio.");
                  } catch (error) {
                    setError(
                      error instanceof Error
                        ? error.message
                        : "Please try again.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label className="mission-field">
                  <span>Template name</span>
                  <input
                    required
                    maxLength={120}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
                <label className="mission-field">
                  <span>Who can use this template?</span>
                  <select
                    value={scope}
                    onChange={(event) => setScope(event.target.value)}
                  >
                    <option value="private">Only me</option>
                    <option
                      value="organization"
                      disabled={!mission.organizationId}
                    >
                      Current members of this community
                    </option>
                  </select>
                </label>
                {plan && (
                  <label className="mission-editor-required">
                    <input
                      type="checkbox"
                      checked={includePlan}
                      onChange={(event) => setIncludePlan(event.target.checked)}
                    />
                    Include the adopted plan
                  </label>
                )}
                {form && (
                  <label className="mission-editor-required">
                    <input
                      type="checkbox"
                      checked={includeForm}
                      onChange={(event) => setIncludeForm(event.target.checked)}
                    />
                    Include the published form
                  </label>
                )}
                {error && (
                  <p role="alert" className="form-error">
                    {error}
                  </p>
                )}
                {notice && (
                  <p role="status" className="mission-success">
                    {notice}
                  </p>
                )}
                <button
                  className="civic-button"
                  disabled={busy || (!includePlan && !includeForm)}
                >
                  {busy ? "Saving…" : "Save selected work as template"}
                </button>
              </form>
              <div className="mission-template-preview">
                {includePlan && (
                  <>
                    <h3>Plan text to copy</h3>
                    {plan?.output?.tasks.map((task, i) => (
                      <div key={i}>
                        <strong>{task.title}</strong>
                        <p>{task.detail}</p>
                      </div>
                    ))}
                  </>
                )}
                {includeForm && (
                  <>
                    <h3>Form text to copy</h3>
                    <p>
                      {form?.output?.tool?.title} ·{" "}
                      {form?.output?.tool?.description}
                    </p>
                    {form?.output?.tool?.fields.map((field) => (
                      <p key={field.id}>
                        {field.label}
                        {field.kind === "choice"
                          ? ` · ${field.options.join(" / ")}`
                          : ""}
                      </p>
                    ))}
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
