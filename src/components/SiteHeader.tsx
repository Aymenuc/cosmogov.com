"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Brand from "./Brand";
export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="site-container header-inner">
        <Brand />
        <nav
          aria-label="Main navigation"
          className={open ? "site-nav is-open" : "site-nav"}
        >
          <a href="/#platform" onClick={() => setOpen(false)}>
            Platform
          </a>
          <a href="/#how-it-works" onClick={() => setOpen(false)}>
            How it works
          </a>
          <a href="/#pricing" onClick={() => setOpen(false)}>
            Pricing
          </a>
          <Link href="/about" onClick={() => setOpen(false)}>
            Our mission
          </Link>
          <Link href="/auth/login" className="mobile-signin">
            Log in
          </Link>
        </nav>
        <div className="header-actions">
          <Link href="/auth/login" className="header-login">
            Log in
          </Link>
          <Link href="/auth/signup" className="civic-button small">
            Get started <ArrowUpRight size={15} />
          </Link>
        </div>
        <button
          className="nav-toggle"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
