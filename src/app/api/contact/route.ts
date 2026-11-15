import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiFailure, rateLimit, requestClient } from '@/lib/api-server';
import { topics } from '@/app/contact/topics';

// Public form: bounded fields, known topics and a per-connection limit, so it
// can't be used to flood the inbox or the database.
const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1).max(5000),
  category: z
    .string()
    .refine((value) => topics.some((topic) => topic.value === value))
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    await rateLimit('contact-client', requestClient(req), 5, 3600);
    const body = contactSchema.parse(await req.json());
    const contact = await db.contactMessage.create({
      data: {
        name: body.name,
        email: body.email,
        subject: body.subject || 'General Inquiry',
        message: body.message,
        category: body.category || 'general',
      },
    });
    return NextResponse.json({ success: true, id: contact.id });
  } catch (error) {
    return apiFailure(error);
  }
}
