import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';

    const where: Record<string, unknown> = {};

    if (status && status !== 'all') where.status = status;
    if (category && category !== 'all') where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const orderBy: Record<string, string> =
      sort === 'most_responded' ? { responseCount: 'desc' } :
      sort === 'closing_soon' ? { closesAt: 'asc' } :
      { createdAt: 'desc' };

    const surveys = await db.survey.findMany({
      where,
      orderBy,
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        questions: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, type: true, text: true, required: true },
        },
        _count: { select: { responses: true } },
      },
    });

    const activeSurveys = await db.survey.count({ where: { status: 'active' } });
    const totalResponses = await db.surveyResponse.count();

    // Calculate average completion rate across all surveys
    const allSurveys = await db.survey.findMany({
      select: { questionCount: true, responseCount: true },
    });
    const avgCompletionRate = allSurveys.length > 0
      ? Math.round(
          allSurveys.reduce((sum, s) => {
            const rate = s.questionCount > 0 ? (s.responseCount / s.questionCount) * 100 : 0;
            return sum + Math.min(rate, 100);
          }, 0) / allSurveys.length
        )
      : 0;

    return NextResponse.json({
      surveys,
      stats: {
        activeSurveys,
        totalResponses,
        avgCompletionRate,
      },
    });
  } catch (error) {
    console.error('Error fetching surveys:', error);
    return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await request.json();
    const { title, description, category, anonymous, allowMultiple, targetAudience, closesAt, processId, questions } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'At least one question is required' }, { status: 400 });
    }

    // Validate questions
    for (const q of questions) {
      if (!q.text) {
        return NextResponse.json({ error: 'Each question must have text' }, { status: 400 });
      }
      if (['single_choice', 'multiple_choice'].includes(q.type) && (!q.options || q.options.length < 2)) {
        return NextResponse.json({ error: 'Choice questions must have at least 2 options' }, { status: 400 });
      }
    }

    const survey = await db.survey.create({
      data: {
        title,
        description,
        status: 'draft',
        category: category || null,
        anonymous: anonymous !== undefined ? anonymous : true,
        allowMultiple: allowMultiple || false,
        targetAudience: targetAudience || 'all',
        closesAt: closesAt ? new Date(closesAt) : null,
        processId: processId || null,
        questionCount: questions.length,
        createdBy: session.id,
        questions: {
          create: questions.map((q: { text: string; type: string; options?: { id: string; label: string }[]; required?: boolean; allowOther?: boolean; minRating?: number; maxRating?: number }, idx: number) => ({
            text: q.text,
            type: q.type || 'single_choice',
            options: JSON.stringify(q.options || []),
            required: q.required !== undefined ? q.required : true,
            sortOrder: idx,
            allowOther: q.allowOther || false,
            minRating: q.minRating || null,
            maxRating: q.maxRating || null,
          })),
        },
      },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        questions: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return NextResponse.json({ survey }, { status: 201 });
  } catch (error) {
    console.error('Error creating survey:', error);
    return NextResponse.json({ error: 'Failed to create survey' }, { status: 500 });
  }
}
