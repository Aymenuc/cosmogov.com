"use client";

import { useState } from "react";
import { MailCheck } from "lucide-react";

/** Shown until the account's email is confirmed. */
export default function VerifyEmailBanner({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function resend() {
    setState("sending");
    try {
      const res = await fetch("/api/auth/verify/resend", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setState("sent");
      else {
        setMessage(data.error || "We couldn't send it. Please try again later.");
        setState("error");
      }
    } catch {
      setMessage("We couldn't reach Cosmogov. Please try again.");
      setState("error");
    }
  }

  return (
    <div className="verify-banner" role="status">
      <MailCheck size={18} aria-hidden="true" />
      <p>
        <strong>Confirm your email to vote, sign and use AI help.</strong>{" "}
        {state === "sent"
          ? `A new link is on its way to ${email}.`
          : state === "error"
            ? message
            : `We sent a link to ${email}.`}
      </p>
      {state !== "sent" && (
        <button type="button" className="civic-button outline" onClick={resend} disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Send a new link"}
        </button>
      )}
    </div>
  );
}
