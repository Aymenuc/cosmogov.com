import { NextResponse } from 'next/server';
import { ApiError, apiFailure, apiUser, rateLimit } from '@/lib/api-server';
import { issueVerification } from '@/lib/email-verification';

/** Sends a fresh confirmation link to the signed-in person. */
export async function POST() {
  try {
    const user = await apiUser();
    if (user.emailVerifiedAt) throw new ApiError(409, 'Your email is already confirmed.');
    await rateLimit('verify-resend', user.id, 3, 3600);
    const sent = await issueVerification(user);
    if (!sent.success) throw new ApiError(503, 'We could not send the email just now. Please try again later.');
    return NextResponse.json({ sent: true });
  } catch (error) {
    return apiFailure(error);
  }
}
