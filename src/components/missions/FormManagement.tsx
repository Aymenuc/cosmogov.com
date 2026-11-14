"use client";
import { Download, Lock, EyeOff, RotateCcw } from "lucide-react";
export default function FormManagement({
  id,
  runId,
  state,
  busy,
  demo,
  onChange,
  onError,
}: {
  id: string;
  runId: string;
  state: string;
  busy: boolean;
  demo: boolean;
  onChange: (action: "close" | "unpublish" | "reopen") => void;
  onError: (message: string) => void;
}) {
  return (
    <div className="mission-form-management">
      {state === "published" ? (
        <button
          className="civic-button outline"
          disabled={busy}
          onClick={() => onChange("close")}
        >
          <Lock size={15} />
          Close answers
        </button>
      ) : (
        <button
          className="civic-button outline"
          disabled={busy}
          onClick={() => onChange("reopen")}
        >
          <RotateCcw size={15} />
          Reopen form
        </button>
      )}
      {state !== "unpublished" && (
        <button
          className="civic-button outline"
          disabled={busy}
          onClick={() => onChange("unpublish")}
        >
          <EyeOff size={15} />
          Unpublish
        </button>
      )}
      <button
        className="civic-button outline"
        disabled={busy || demo}
        onClick={async () => {
          try {
            const response = await fetch(
              `/api/missions/${id}/tools/${runId}/export`,
            );
            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error);
            }
            const url = URL.createObjectURL(await response.blob());
            const link = document.createElement("a");
            link.href = url;
            link.download = "mission-responses.csv";
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          } catch (error) {
            onError(
              error instanceof Error
                ? error.message
                : "Export failed. Please try again.",
            );
          }
        }}
      >
        <Download size={15} />
        Export answers
      </button>
    </div>
  );
}
