import { NextResponse } from 'next/server';
import { cardPaymentsEnabled } from '@/lib/billing';

export const dynamic = 'force-dynamic';

/** Whether card upgrades are available. Says nothing else. */
export async function GET() {
  return NextResponse.json({ cardPayments: cardPaymentsEnabled() });
}
