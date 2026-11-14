"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  Globe2,
  Landmark,
  Leaf,
  Loader2,
  ShieldCheck,
  Users,
  Vote,
} from "lucide-react";
import Brand from "./Brand";
import CommonsArt from "./CommonsArt";
export default function AuthExperience({
  signup = false,
}: {
  signup?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("user");
  const [govCode, setGovCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/${signup ? "signup" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email.trim(),
          password,
          role,
          govCode: role === "gov_official" ? govCode : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "We couldn’t sign you in. Please try again.");
        return;
      }
      const redirect = new URLSearchParams(window.location.search).get(
        "redirect",
      );
      const safeRedirect =
        redirect &&
        (redirect === "/dashboard" || redirect.startsWith("/dashboard/"))
          ? redirect
          : null;
      router.push(
        safeRedirect ||
          (data.role === "gov_official"
            ? "/dashboard/gov-portal"
            : "/dashboard"),
      );
      router.refresh();
    } catch {
      setError(
        "We couldn’t connect. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <main id="main-content" className="auth-page">
      <section className="auth-story">
        <Brand light />
        <div className="auth-story-content">
          <div className="eyebrow">A SHARED SPACE. A SHARED FUTURE.</div>
          <h1>
            Good things
            <br />
            start with <em>us.</em>
          </h1>
          <p>
            A community is more than a place.
            <br />
            It’s the people who choose to shape it.
          </p>
          <div className="auth-art" aria-hidden="true">
            <CommonsArt />
          </div>
          <div className="auth-promise">
            <Check size={15} />
            Every perspective has a place here.
          </div>
        </div>
        <span className="auth-story-footer">
          Better decisions. Made together.
        </span>
      </section>
      <section className="auth-form-side">
        <Link href="/" className="auth-back">
          <ArrowLeft size={14} />
          Back to Cosmogov
        </Link>
        <div className="auth-form-wrap">
          <div className="eyebrow">
            {signup ? "MAKE ROOM FOR YOUR VOICE" : "YOUR COMMUNITY IS WAITING"}
          </div>
          <h2>
            {signup
              ? "Your next chapter starts here."
              : "Good to have you back."}
          </h2>
          <p>
            {signup
              ? "Create an account. Find your people. Help shape what’s next."
              : "Sign in to pick up the conversation."}
          </p>
          {signup && (
            <fieldset className="auth-roles">
              <legend>I’m here as a</legend>
              <div>
                {[
                  {
                    id: "user",
                    label: "Community member",
                    icon: Users,
                    copy: "Contribute ideas and participate.",
                  },
                  {
                    id: "gov_official",
                    label: "Government official",
                    icon: Landmark,
                    copy: "Connect with your community.",
                  },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    aria-pressed={role === item.id}
                    onClick={() => setRole(item.id)}
                    className={role === item.id ? "selected" : ""}
                  >
                    <item.icon size={18} />
                    <strong>{item.label}</strong>
                    <span>{item.copy}</span>
                    {role === item.id && (
                      <Check size={13} className="role-check" />
                    )}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <form onSubmit={submit} className="auth-form">
            {signup && (
              <div className="auth-field">
                <label htmlFor="auth-name">Your name</label>
                <input
                  id="auth-name"
                  name="name"
                  autoComplete="name"
                  placeholder="How should we call you?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="auth-field">
              <label htmlFor="auth-email">Email address</label>
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="auth-password">Password</label>
              <div className="password-input">
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={signup ? "new-password" : "current-password"}
                  placeholder={
                    signup
                      ? "Create a password (at least 6 characters)"
                      : "Enter your password"
                  }
                  minLength={signup ? 6 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            {signup && role === "gov_official" && (
              <div className="auth-field">
                <label htmlFor="gov-code">Government verification code</label>
                <input
                  id="gov-code"
                  name="govCode"
                  autoComplete="off"
                  placeholder="Enter your administrator’s code"
                  value={govCode}
                  onChange={(e) => setGovCode(e.target.value)}
                  required
                />
                <small>
                  Your administrator provides this code to verify your official
                  account.
                </small>
              </div>
            )}
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <button type="submit" className="civic-button" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {signup ? "Creating your account…" : "Signing you in…"}
                </>
              ) : (
                <>
                  {signup
                    ? "Create your free account"
                    : "Sign in to your community"}
                  <ArrowUpRight size={17} />
                </>
              )}
            </button>
          </form>
          <p className="auth-switch">
            {signup ? "Already part of the conversation?" : "New to Cosmogov?"}{" "}
            <Link href={signup ? "/auth/login" : "/auth/signup"}>
              {signup ? "Sign in" : "Join the community"}
              <ArrowUpRight size={12} />
            </Link>
          </p>
          {signup && (
            <p className="auth-terms">
              By creating an account, you agree to our{" "}
              <Link href="/terms">Terms</Link> and{" "}
              <Link href="/privacy">Privacy Policy</Link>.
            </p>
          )}
          <div className="auth-form-note">
            <ShieldCheck size={14} />
            <span>A place for thoughtful participation.</span>
          </div>
        </div>
        <div className="auth-footer">
          <span>© {new Date().getFullYear()} Cosmogov</span>
          <Link href="/contact">
            Need a hand? <ArrowUpRight size={12} />
          </Link>
        </div>
      </section>
    </main>
  );
}
