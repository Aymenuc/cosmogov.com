import type { HelperType } from '@/lib/helper-languages';
import { HELPER_INFO } from './helper-info';

/** A helper's face: its tint and icon in an ink-outlined sticker circle. */
export default function HelperBadge({ type, size = 44 }: { type: HelperType; size?: number }) {
  const info = HELPER_INFO[type];
  const Icon = info.icon;
  return (
    <span className="helper-badge" style={{ width: size, height: size, background: info.bg }} aria-hidden="true">
      <Icon size={Math.round(size * 0.46)} strokeWidth={2.2} />
    </span>
  );
}

export function isHelperType(value: string | null | undefined): value is HelperType {
  return Boolean(value && value in HELPER_INFO);
}
