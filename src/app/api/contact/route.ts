import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message, category } = await req.json();
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }
    const contact = await db.contactMessage.create({
      data: {
        name,
        email,
        subject: subject || 'General Inquiry',
        message,
        category: category || 'general',
      },
    });
    return NextResponse.json({ success: true, id: contact.id });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
