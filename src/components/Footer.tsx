import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Brand from "./Brand";
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-container">
        <div className="footer-main">
          <div>
            <Brand />
            <p>
              A shared space for
              <br />a better kind of governance.
            </p>
          </div>
          {[
            {
              title: "Platform",
              links: [
                ["Participation", "/#platform"],
                ["How it works", "/#how-it-works"],
                ["Pricing", "/#pricing"],
                ["Explore communities", "/dashboard/organizations"],
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
          ].map((col) => (
            <div key={col.title}>
              <h3>{col.title}</h3>
              {col.links.map(([label, href]) => (
                <Link key={href} href={href}>
                  {label}
                  <ArrowUpRight size={12} />
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Cosmogov. Made for our shared future.
          </span>
          <div>
            <Link href="/privacy">Privacy policy</Link>
            <Link href="/terms">Terms of use</Link>
            <Link href="/#main-content">Back to top ↑</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
