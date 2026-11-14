"use client";
import { useState } from "react";
export default function SessionControls() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <section className="mission-panel">
      <h2>Signed-in sessions</h2>
      <p>
        Sign out on every device, including this one. Your saved work stays in
        your account.
      </p>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <button
        className="civic-button outline"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const response = await fetch("/api/auth/sessions/revoke", {
              method: "POST",
            });
            if (!response.ok)
              throw new Error("Could not sign out. Please try again.");
            window.location.assign("/auth/login");
          } catch (error) {
            setError(
              error instanceof Error ? error.message : "Please try again.",
            );
            setBusy(false);
          }
        }}
      >
        {busy ? "Signing out…" : "Sign out everywhere"}
      </button>
    </section>
  );
}
