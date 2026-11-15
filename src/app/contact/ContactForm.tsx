"use client";

import { useState, type FormEvent } from "react";
import { topics } from "./topics";

export default function ContactForm({
  initialTopic,
  requestedPlan,
}: {
  initialTopic: string;
  requestedPlan?: string;
}) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    const fields = new FormData(event.currentTarget);
    const name = String(fields.get("name") ?? "").trim();
    const email = String(fields.get("email") ?? "").trim();
    const message = String(fields.get("message") ?? "").trim();
    if (!name || !email || !message) {
      setError("Enter your name, email, and message.");
      return;
    }

    const topic = topics.find(({ value }) => value === fields.get("topic")) ?? topics[0];
    const subject = topic.value === "sales" && requestedPlan
      ? topic.label + " — " + requestedPlan
      : topic.label;
    setError("");
    setSending(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, subject, category: topic.value }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error || "We couldn’t send your message. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("We couldn’t send your message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="public-form">
        <p role="status">We received your message.</p>
        <button type="button" className="civic-button outline" onClick={() => setSent(false)}>
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form method="post" className="public-form" onSubmit={submit} aria-busy={sending}>
      <label>
        Name
        <input name="name" autoComplete="name" required />
      </label>
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Topic
        <select name="topic" defaultValue={initialTopic}>
          {topics.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label>
        Message
        <textarea name="message" rows={7} required aria-describedby="contact-message-help" />
      </label>
      <p id="contact-message-help">Leave out passwords, card details and private participant information.</p>
      {error && <p role="alert">{error}</p>}
      <button type="submit" className="civic-button" disabled={sending}>
        {sending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
