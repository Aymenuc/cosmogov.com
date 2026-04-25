'use client';

import { Badge } from '@/components/ui/badge';
import { Building2, Shield, CheckCircle2 } from 'lucide-react';

/**
 * OfficialResponseBadge — Shared component for displaying government response status.
 *
 * Used on:
 * - Initiative cards (citizen-facing)
 * - Binding proposal detail pages
 * - Gov Portal overview cards
 *
 * Props:
 * - responded: Whether the government has responded
 * - respondedBy: Name/role of the official who responded (optional)
 * - responseDate: Date of the response (optional)
 * - size: 'sm' | 'md' — controls badge size
 * - variant: 'badge' | 'card' — display as inline badge or as a card with response text
 * - responseText: The actual response text (for card variant)
 */

interface OfficialResponseBadgeProps {
  responded: boolean;
  respondedBy?: string | null;
  responseDate?: string | null;
  size?: 'sm' | 'md';
  variant?: 'badge' | 'card';
  responseText?: string | null;
}

export default function OfficialResponseBadge({
  responded,
  respondedBy,
  responseDate,
  size = 'sm',
  variant = 'badge',
  responseText,
}: OfficialResponseBadgeProps) {
  if (!responded) {
    if (variant === 'badge') {
      return (
        <Badge className="text-cosmic-amber bg-cosmic-amber/10 border-cosmic-amber/20 text-[10px] border">
          <Building2 className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} />
          Awaiting Response
        </Badge>
      );
    }
    return null;
  }

  if (variant === 'badge') {
    return (
      <Badge className="text-cosmic-teal bg-cosmic-teal/10 border-cosmic-teal/20 text-[10px] border">
        <Shield className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} mr-1`} />
        Gov Responded
        {responseDate && (
          <span className="ml-1 opacity-60">
            {new Date(responseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </Badge>
    );
  }

  // Card variant — shows the full response in a styled card
  return (
    <div className="glass-card p-3 rounded-xl bg-cosmic-teal/5 border border-cosmic-teal/15">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Badge className="text-cosmic-teal bg-cosmic-teal/10 border-cosmic-teal/20 text-[9px] border">
          <Shield className="w-2.5 h-2.5 mr-0.5" />
          Official Response
        </Badge>
        {respondedBy && (
          <span className="text-[10px] text-cosmic-muted">by {respondedBy}</span>
        )}
        {responseDate && (
          <span className="text-[10px] text-cosmic-muted/60">
            {new Date(responseDate).toLocaleDateString()}
          </span>
        )}
      </div>
      {responseText && (
        <p className="text-xs text-white/90 line-clamp-3 whitespace-pre-wrap">{responseText}</p>
      )}
    </div>
  );
}

/**
 * OfficialResponseCard — A more prominent card for government responses
 * on detail pages (binding proposals, initiative detail).
 */
export function OfficialResponseCard({
  responseText,
  respondedBy,
  responseDate,
  title = 'Government Response',
}: {
  responseText: string;
  respondedBy?: string | null;
  responseDate?: string | null;
  title?: string;
}) {
  return (
    <div className="glass-card rounded-2xl border-cosmic-teal/20 overflow-hidden">
      <div className="p-4 border-b border-cosmic-teal/10 bg-cosmic-teal/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cosmic-teal/10 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-cosmic-teal" />
          </div>
          <div>
            <h3 className="font-heading text-base font-semibold text-white">{title}</h3>
            <div className="flex items-center gap-2 text-xs text-cosmic-muted">
              {respondedBy && <span>Responded by {respondedBy}</span>}
              {responseDate && (
                <span>
                  {respondedBy && '·'} {new Date(responseDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="glass-card p-4 rounded-xl bg-cosmic-teal/5 border border-cosmic-teal/10">
          <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{responseText}</p>
        </div>
      </div>
    </div>
  );
}
