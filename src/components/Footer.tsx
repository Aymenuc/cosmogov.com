'use client';

import Link from 'next/link';
import { Rocket } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* 4-column grid: 1 col mobile, 2 col sm, 4 col lg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* CosmoGov Column */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cosmic-teal to-cosmic-violet flex items-center justify-center">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-bold text-lg">CosmoGov</span>
            </Link>
            <p className="text-cosmic-muted text-sm leading-relaxed">
              Interstellar Civic OS — where governance meets the cosmos.
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
            <div className="space-y-2.5">
              <Link href="/#governance" className="block text-sm text-cosmic-muted hover:text-white transition-colors">Governance</Link>
              <Link href="/#ai" className="block text-sm text-cosmic-muted hover:text-white transition-colors">AI Studio</Link>
              <Link href="/#games" className="block text-sm text-cosmic-muted hover:text-white transition-colors">Games</Link>
              <Link href="/#analytics" className="block text-sm text-cosmic-muted hover:text-white transition-colors">Analytics</Link>
              <Link href="/#pricing" className="block text-sm text-cosmic-muted hover:text-white transition-colors">Pricing</Link>
            </div>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Resources</h4>
            <div className="space-y-2.5">
              <Link href="/docs" className="block text-sm text-cosmic-muted hover:text-white transition-colors">Documentation</Link>
              <Link href="/docs/api" className="block text-sm text-cosmic-muted hover:text-white transition-colors">API Reference</Link>
              <Link href="/blog" className="block text-sm text-cosmic-muted hover:text-white transition-colors">Blog</Link>
              <Link href="/changelog" className="block text-sm text-cosmic-muted hover:text-white transition-colors">Changelog</Link>
              <Link href="/dashboard/chat" className="block text-sm text-cosmic-muted hover:text-white transition-colors">Community</Link>
            </div>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
            <div className="space-y-2.5">
              <Link href="/about" className="block text-sm text-cosmic-muted hover:text-white transition-colors">About</Link>
              <Link href="/careers" className="block text-sm text-cosmic-muted hover:text-white transition-colors">Careers</Link>
              <Link href="/privacy" className="block text-sm text-cosmic-muted hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="block text-sm text-cosmic-muted hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="block text-sm text-cosmic-muted hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-cosmic-muted">&copy; 2026 CosmoGov. All rights reserved.</p>
          <div className="flex items-center gap-5">
            {/* X (Twitter) */}
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-cosmic-muted hover:text-white transition-colors" aria-label="X (Twitter)">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            {/* GitHub */}
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-cosmic-muted hover:text-white transition-colors" aria-label="GitHub">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
            {/* Discord */}
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-cosmic-muted hover:text-white transition-colors" aria-label="Discord">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
