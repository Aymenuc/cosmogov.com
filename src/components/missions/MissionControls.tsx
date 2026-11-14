"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
export default function MissionControls({
  id,
  title,
  demo,
}: {
  id: string;
  title: string;
  demo: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false),
    [confirmation, setConfirmation] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <>
      <button className="mission-build-manual" onClick={() => setOpen(true)}>
        <Settings2 size={16} />
        Mission settings
      </button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value);
        }}
      >
        <DialogContent className="mission-dialog">
          <DialogTitle>Delete this mission?</DialogTitle>
          <DialogDescription>
            This permanently removes the mission, its contributions, AI outputs,
            tasks, history and form responses. Download any response exports
            first.
          </DialogDescription>
          {demo ? (
            <p>
              This example stays only in this page. Reload it to start again.
            </p>
          ) : (
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                setBusy(true);
                setError("");
                try {
                  const response = await fetch(`/api/missions/${id}`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ confirmation }),
                  });
                  const data = await response.json();
                  if (!response.ok) throw new Error(data.error);
                  router.push("/dashboard/missions");
                } catch (error) {
                  setError(
                    error instanceof Error
                      ? error.message
                      : "Deletion failed. Please try again.",
                  );
                  setBusy(false);
                }
              }}
            >
              <label className="mission-field">
                <span>Type the mission title to confirm</span>
                <strong>{title}</strong>
                <input
                  autoComplete="off"
                  required
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                />
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <button
                className="civic-button outline"
                disabled={busy || confirmation !== title}
              >
                <Trash2 size={16} />
                {busy ? "Deleting…" : "Delete mission permanently"}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
