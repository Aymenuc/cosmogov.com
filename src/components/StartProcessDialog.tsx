"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Loader2, Route } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { GOVERNANCE_CATEGORIES } from "@/lib/categories";
export default function StartProcessDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState("city");
  const [category, setCategory] = useState("social");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/participation/processes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          scope,
          category,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.error || "The process could not be created. Please try again.",
        );
      if (!data.process?.id)
        throw new Error(
          "The process was created but its link is unavailable. Refresh the participation hub before trying again.",
        );
      onOpenChange(false);
      router.push(`/dashboard/participation/${data.process.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!saving) onOpenChange(value);
      }}
    >
      <DialogContent className="start-process-dialog">
        <div className="eyebrow">
          <Route size={14} /> FROM IDEA TO IMPLEMENTATION
        </div>
        <DialogTitle>Start something, together.</DialogTitle>
        <DialogDescription>
          Give your community a clear question and a process to work through it.
        </DialogDescription>
        <div className="process-journey">
          <span className="current">Inform</span>
          <span>Propose</span>
          <span>Discuss</span>
          <span>Vote</span>
          <span>Implement</span>
          <span>Evaluate</span>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-field">
            <label htmlFor="process-title">
              What will your community shape?
            </label>
            <input
              id="process-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. A more welcoming neighborhood park"
              required
              maxLength={180}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="process-description">Set the scene</label>
            <textarea
              id="process-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is the question? Who is affected? What can people influence?"
              rows={4}
              required
            />
          </div>
          <div className="process-form-row">
            <div className="auth-field">
              <label htmlFor="process-scope">Who is it for?</label>
              <select
                id="process-scope"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
              >
                <option value="city">A city</option>
                <option value="district">A neighborhood or district</option>
                <option value="organization">An organization</option>
                <option value="global">A wider network</option>
              </select>
            </div>
            <div className="auth-field">
              <label htmlFor="process-category">What’s the topic?</label>
              <select
                id="process-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {GOVERNANCE_CATEGORIES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="process-creation-note">
            This creates a public process in the Information phase. It won’t
            open a vote. You can develop the next stages from the process
            workspace.
          </p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="civic-button"
            disabled={saving || !title.trim() || !description.trim()}
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Creating your process…
              </>
            ) : (
              <>
                Create participation process <ArrowUpRight size={15} />
              </>
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
