import Link from "next/link";
import { ArrowUp, ArrowUpRight } from "lucide-react";
import Brand from "./Brand";

const groups = [
  {
    title: "Platform",
    links: [
      ["Participation", "/#platform"],
      ["How it works", "/#how-it-works"],
      ["Pricing", "/#pricing"],
      ["My communities", "/dashboard/organizations"],
    ],
  },
  {
    title: "Resources",
    links: [
      ["Documentation", "/docs"],
      ["API reference", "/docs/api"],
      ["Journal", "/blog"],
      ["Changelog", "/changelog"],
    ],
  },
  {
    title: "Cosmogov",
    links: [
      ["Our mission", "/about"],
      ["Careers", "/careers"],
      ["Get in touch", "/contact"],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="footer-main">
          <div className="footer-brand">
            <Brand />
            <p>A shared space for a better kind of governance.</p>
          </div>
          <nav className="footer-nav" aria-label="Footer navigation">
            {groups.map(({ title, links }) => (
              <div className="footer-group" key={title}>
                <h2>{title}</h2>
                <ul>
                  {links.map(([label, href]) => {
                    const FooterLink = href === "/blog" ? "a" : Link;

                    return (
                      <li key={href}>
                        <FooterLink href={href}>
                          {label}
                          <ArrowUpRight size={14} aria-hidden="true" />
                        </FooterLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Cosmogov</span>
          <div>
            <Link href="/trust">Security, privacy and AI</Link>
            <Link href="/privacy">Privacy policy</Link>
            <Link href="/terms">Terms of use</Link>
            <a href="#main-content">Back to top <ArrowUp size={14} aria-hidden="true" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
