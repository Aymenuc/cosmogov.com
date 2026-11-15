"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PublicPage from "@/components/PublicPage";

/** Lands from the confirmation email and confirms the address. */
export default function VerifyPage() {
  const [state, setState] = useState<"working" | "done" | "error">("working");
  const [message, setMessage] = useState("");
  // A link works once; never send it twice (React may run effects twice in development).
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = new URLSearchParams(window.location.search).get("token") || "";
    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (r.ok) setState("done");
        else {
          setMessage(data.error || "This link didn't work.");
          setState("error");
        }
      })
      .catch(() => {
        setMessage("We couldn't reach Cosmogov. Please try again.");
        setState("error");
      });
  }, []);

  return (
    <PublicPage title="Confirm your email">
      <div className="public-reading" role="status">
        {state === "working" && <p>Confirming your email…</p>}
        {state === "done" && (
          <>
            <p>Thank you, your email is confirmed. You can now vote, sign and use AI help.</p>
            <p>
              <Link className="civic-button" href="/dashboard">
                Open your civic desk
              </Link>
            </p>
          </>
        )}
        {state === "error" && (
          <>
            <p>{message}</p>
            <p>
              <Link className="civic-button outline" href="/dashboard">
                Go to your civic desk to send a new link
              </Link>
            </p>
          </>
        )}
      </div>
    </PublicPage>
  );
}
