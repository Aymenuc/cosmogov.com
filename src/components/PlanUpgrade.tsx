"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, CreditCard, Loader2 } from "lucide-react";
import { PLANS, PLAN_ORDER, type PlanId } from "@/lib/plans";

/**
 * Plan choice in Settings. Card upgrades appear only when payments are
 * switched on; otherwise every path leads to a person, never a dead button.
 */
export default function PlanUpgrade({ current, upgraded }: { current: PlanId; upgraded?: boolean }) {
  const [cardPayments, setCardPayments] = useState<boolean | null>(null);
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [busy, setBusy] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/billing/status")
      .then((r) => (r.ok ? r.json() : { cardPayments: false }))
      .then((d) => alive && setCardPayments(Boolean(d.cardPayments)))
      .catch(() => alive && setCardPayments(false));
    return () => {
      alive = false;
    };
  }, []);

  async function go(path: "/api/billing/checkout" | "/api/billing/portal") {
    setError("");
    setBusy(path.endsWith("checkout") ? "checkout" : "portal");
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setError(data.error || "That didn't work. Please try again.");
    } catch {
      setError("That didn't work. Please check your connection and try again.");
    }
    setBusy(null);
  }

  return (
    <section className="plan-upgrade" aria-labelledby="plan-upgrade-title">
      <div className="plan-upgrade-head">
        <h2 id="plan-upgrade-title">
          <CreditCard size={16} aria-hidden="true" /> Plans and billing
        </h2>
        <div className="billing-switch" aria-label="Billing period">
          <button className={period === "monthly" ? "active" : ""} aria-pressed={period === "monthly"} onClick={() => setPeriod("monthly")}>
            Monthly
          </button>
          <button className={period === "yearly" ? "active" : ""} aria-pressed={period === "yearly"} onClick={() => setPeriod("yearly")}>
            Yearly <span>Save 20%</span>
          </button>
        </div>
      </div>

      {upgraded && (
        <p role="status" className="plan-upgrade-note">
          Thank you. Your payment went through; your plan updates within a minute.
        </p>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}

      <div className="plan-upgrade-grid">
        {PLAN_ORDER.map((id) => {
          const plan = PLANS[id];
          const price = period === "yearly" ? plan.yearlyPerMonth : plan.monthly;
          const isCurrent = id === current;
          return (
            <article key={id} className={`plan-card${isCurrent ? " current" : ""}${id === "pro" ? " featured" : ""}`}>
              <header>
                <h3>{plan.name}</h3>
                {isCurrent && <span className="plan-badge">Your plan</span>}
              </header>
              <p className="plan-desc">{plan.desc}</p>
              <p className="plan-price">
                ${price}
                <small>{price ? " / month" : ""}</small>
              </p>
              {price > 0 && period === "yearly" && <p className="plan-small">Billed yearly · ${price * 12}/year</p>}
              <ul>
                {plan.features.map((f) => (
                  <li key={f}>
                    <Check size={14} aria-hidden="true" /> {f}
                  </li>
                ))}
              </ul>
              <div className="plan-action">
                {id === "community" ? (
                  isCurrent ? <span className="plan-small">Free, always.</span> : null
                ) : id === "pro" ? (
                  isCurrent ? (
                    <button className="civic-button outline" onClick={() => go("/api/billing/portal")} disabled={busy !== null}>
                      {busy === "portal" ? <Loader2 size={15} className="animate-spin" /> : null} Manage billing
                    </button>
                  ) : current === "community" && cardPayments ? (
                    <button className="civic-button" onClick={() => go("/api/billing/checkout")} disabled={busy !== null}>
                      {busy === "checkout" ? <Loader2 size={15} className="animate-spin" /> : null} Upgrade to Pro
                    </button>
                  ) : current === "community" ? (
                    <Link className="civic-button" href="/contact?topic=sales&plan=Pro">
                      Talk to us about Pro <ArrowUpRight size={15} aria-hidden="true" />
                    </Link>
                  ) : null
                ) : isCurrent ? (
                  <Link className="civic-button outline" href="/contact?topic=sales&plan=Government">
                    Invoices and changes <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                ) : (
                  <Link className="civic-button outline" href="/contact?topic=sales&plan=Government">
                    Talk to us <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <p className="plan-small">
        {cardPayments
          ? "Card payments are handled by Stripe; Cosmogov never sees your card number. Cancel any time from Manage billing."
          : "Upgrades are arranged with a person for now. Government is invoiced."}{" "}
        Prices in US dollars, before any local tax.
      </p>
    </section>
  );
}
