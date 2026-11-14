"use client";
import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  CircleHelp,
  Eye,
  Plus,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import StickerBadge from "@/components/stickers/StickerBadge";
import MissionToolForm from "./MissionToolForm";
import FormSettingsFields from "./FormSettingsFields";
import {
  defaultFormSettings,
  formReviewError,
  type FormSettings,
} from "@/lib/missions/forms";
import { toolSchema } from "@/lib/missions/validation";
import type { MissionTool } from "@/lib/missions/types";
import "@/app/portal.css";

export default function MissionFormEditor({
  initialTool,
  initialSettings = defaultFormSettings,
  basedOnAI = false,
  revisingPublished = false,
  onClose,
  onSave,
}: {
  initialTool: MissionTool | null;
  initialSettings?: FormSettings;
  basedOnAI?: boolean;
  revisingPublished?: boolean;
  onClose: () => void;
  onSave: (tool: MissionTool, settings: FormSettings) => Promise<void>;
}) {
  const [tool, setTool] = useState<MissionTool>(() =>
    initialTool
      ? structuredClone(initialTool)
      : {
          title: "",
          description: "",
          fields: [
            { id: "f1", label: "", kind: "text", options: [], required: true },
          ],
        },
  );
  const [settings, setSettings] = useState<FormSettings>(initialSettings);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [discard, setDiscard] = useState(false);
  const [dirty, setDirty] = useState(false);
  const change = (next: MissionTool) => {
    setTool(next);
    setDirty(true);
    setDiscard(false);
  };
  const updateField = (
    index: number,
    patch: Partial<MissionTool["fields"][number]>,
  ) =>
    change({
      ...tool,
      fields: tool.fields.map((field, i) =>
        i === index ? { ...field, ...patch } : field,
      ),
    });
  const move = (index: number, direction: number) => {
    const fields = [...tool.fields];
    [fields[index], fields[index + direction]] = [
      fields[index + direction],
      fields[index],
    ];
    change({ ...tool, fields });
  };
  const close = () => {
    if (busy) return;
    if (dirty) setDiscard(true);
    else onClose();
  };
  const preview = {
    ...tool,
    title: tool.title || "Your form’s title",
    description: tool.description || "A short invitation for your community.",
    fields: tool.fields.map((field, i) => ({
      ...field,
      label: field.label || `Question ${i + 1}`,
      options: field.options.filter((option) => option.trim()),
    })),
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        className="mission-form-editor"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <header className="mission-editor-header">
          <StickerBadge
            shape="scallop"
            tint="lilac"
            icon="form"
            earned
            size={70}
          />
          <div>
            <span className="eyebrow">MADE FOR YOUR PEOPLE</span>
            <DialogTitle>
              {initialTool
                ? "Make this form your own."
                : "A little form. A useful beginning."}
            </DialogTitle>
            <DialogDescription>
              Shape the questions, check the preview, then save a draft for
              review.
            </DialogDescription>
          </div>
        </header>
        <div className="mission-editor-body">
          <form
            id="mission-form-editor-fields"
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              const result = toolSchema.safeParse({
                ...tool,
                fields: tool.fields.map((field) => ({
                  ...field,
                  options:
                    field.kind === "choice"
                      ? field.options
                          .map((option) => option.trim())
                          .filter(Boolean)
                      : [],
                })),
              });
              if (!result.success) {
                setError(
                  "Give your form a title and introduction, label every question, and give each choice question 2 to 8 different options.",
                );
                return;
              }
              const reviewError = formReviewError(result.data, settings);
              if (reviewError) {
                setError(reviewError);
                return;
              }
              setBusy(true);
              try {
                await onSave(result.data, settings);
              } catch (error) {
                setError(
                  error instanceof Error
                    ? error.message
                    : "Your draft could not be saved. Your edits are still here; please try again.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <fieldset disabled={busy} className="mission-editor-fields">
              <legend className="sr-only">Form details and questions</legend>
              <label className="mission-field">
                <span>Form title</span>
                <input
                  autoComplete="off"
                  required
                  maxLength={160}
                  value={tool.title}
                  onChange={(event) =>
                    change({ ...tool, title: event.target.value })
                  }
                  placeholder="What could you bring?"
                />
              </label>
              <label className="mission-field">
                <span>A short invitation</span>
                <textarea
                  required
                  maxLength={500}
                  rows={3}
                  value={tool.description}
                  onChange={(event) =>
                    change({ ...tool, description: event.target.value })
                  }
                  placeholder="Tell people what this form is for."
                />
              </label>
              <div className="mission-editor-question-heading">
                <h3>Your questions</h3>
                <span>{tool.fields.length} of 6</span>
              </div>
              {tool.fields.map((field, index) => (
                <section
                  className="mission-editor-question"
                  key={field.id}
                  aria-label={`Question ${index + 1}`}
                >
                  <div className="mission-editor-question-toolbar">
                    <strong>Question {index + 1}</strong>
                    <div>
                      <button
                        type="button"
                        aria-label={`Move question ${index + 1} up`}
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUp size={17} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Move question ${index + 1} down`}
                        disabled={index === tool.fields.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDown size={17} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove question ${index + 1}`}
                        disabled={tool.fields.length === 1}
                        onClick={() =>
                          change({
                            ...tool,
                            fields: tool.fields.filter((_, i) => i !== index),
                          })
                        }
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                  <label className="mission-field">
                    <span>Question {index + 1} wording</span>
                    <input
                      required
                      maxLength={120}
                      value={field.label}
                      onChange={(event) =>
                        updateField(index, { label: event.target.value })
                      }
                      placeholder="How would you like to help?"
                    />
                  </label>
                  <label className="mission-field">
                    <span>Answer type for question {index + 1}</span>
                    <select
                      value={field.kind}
                      onChange={(event) =>
                        updateField(index, {
                          kind: event.target.value as "text" | "choice",
                          options:
                            event.target.value === "choice" ? ["", ""] : [],
                        })
                      }
                    >
                      <option value="text">Written answer</option>
                      <option value="choice">Choose one option</option>
                    </select>
                  </label>
                  {field.kind === "choice" && (
                    <label className="mission-field">
                      <span>Options for question {index + 1}</span>
                      <textarea
                        rows={4}
                        maxLength={807}
                        value={field.options.join("\n")}
                        onChange={(event) =>
                          updateField(index, {
                            options: event.target.value.split("\n"),
                          })
                        }
                        aria-describedby={`options-help-${field.id}`}
                      />
                      <small id={`options-help-${field.id}`}>
                        One option per line. Use 2 to 8 different options, up to
                        100 characters each.
                      </small>
                    </label>
                  )}
                  <label className="mission-editor-required">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(event) =>
                        updateField(index, { required: event.target.checked })
                      }
                    />
                    Required question {index + 1}
                  </label>
                </section>
              ))}
              <button
                type="button"
                className="civic-button outline mission-editor-add"
                disabled={tool.fields.length >= 6}
                onClick={() => {
                  const id = Array.from(
                    { length: 6 },
                    (_, i) => `f${i + 1}`,
                  ).find(
                    (id) => !tool.fields.some((field) => field.id === id),
                  )!;
                  change({
                    ...tool,
                    fields: [
                      ...tool.fields,
                      {
                        id,
                        label: "",
                        kind: "text",
                        options: [],
                        required: false,
                      },
                    ],
                  });
                }}
              >
                <Plus size={17} />
                Add a question
              </button>
              <FormSettingsFields
                tool={tool}
                value={settings}
                onChange={(value) => {
                  setSettings(value);
                  setDirty(true);
                  setDiscard(false);
                }}
              />
              <p className="mission-editor-question-note">
                Ask for practical offers and needs. Everyone’s name is already
                attached to their response, so leave out contact details and
                sensitive personal questions.
              </p>
            </fieldset>
          </form>
          <aside className="mission-editor-preview" aria-label="Form preview">
            <div className="mission-editor-preview-label">
              <Eye size={17} />
              <strong>Live preview</strong>
              <span>Draft</span>
            </div>
            <p>
              This is the layout people will see. Answers are collected only
              after you publish.
            </p>
            <MissionToolForm tool={preview} preview />
            <div className="mission-response-notice">
              <CircleHelp size={18} />
              <p>
                {revisingPublished
                  ? "This saves a new version. The published form and its existing answers stay intact."
                  : basedOnAI
                    ? "Your changes become a new draft. The original AI output and its references are preserved."
                    : "You’re building this form yourself. Saving it does not call AI or publish it."}
              </p>
            </div>
          </aside>
        </div>
        <footer className="mission-editor-footer">
          {error && (
            <p className="form-error" role="alert">
              <CircleHelp size={18} />
              {error}
            </p>
          )}
          {discard ? (
            <div className="mission-editor-discard" role="alert">
              <p>Discard your unsaved changes?</p>
              <button
                type="button"
                className="civic-button outline"
                onClick={() => setDiscard(false)}
              >
                Keep editing
              </button>
              <button
                type="button"
                className="civic-button outline"
                onClick={onClose}
              >
                Discard changes
              </button>
            </div>
          ) : (
            <div className="mission-editor-save">
              <span>
                <Check size={16} />
                You review it before anyone can respond.
              </span>
              <button
                type="button"
                className="civic-button outline"
                disabled={busy}
                onClick={close}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="mission-form-editor-fields"
                className="civic-button"
                disabled={busy}
              >
                {busy ? "Saving…" : "Save draft"}
                <ArrowUpRight size={16} />
              </button>
            </div>
          )}
        </footer>
      </DialogContent>
    </Dialog>
  );
}
