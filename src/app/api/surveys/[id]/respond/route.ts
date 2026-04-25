import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { answers } = body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: 'Answers are required' }, { status: 400 });
    }

    const survey = await db.survey.findUnique({
      where: { id },
      include: { questions: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    if (survey.status !== 'active') {
      return NextResponse.json({ error: 'Survey is not active' }, { status: 400 });
    }

    // Check if survey has closed
    if (survey.closesAt && new Date(survey.closesAt) < new Date()) {
      return NextResponse.json({ error: 'Survey has closed' }, { status: 400 });
    }

    const session = await getSession();

    // For non-anonymous surveys, auth is required
    if (!survey.anonymous && !session) {
      return NextResponse.json({ error: 'Authentication required for this survey' }, { status: 401 });
    }

    // Check if user has already responded (unless allowMultiple)
    if (session && !survey.allowMultiple) {
      const existingResponse = await db.surveyResponse.findFirst({
        where: { surveyId: id, userId: session.id },
      });
      if (existingResponse) {
        return NextResponse.json({ error: 'You have already responded to this survey' }, { status: 409 });
      }
    }

    // Validate answers against required questions
    for (const question of survey.questions) {
      if (question.required) {
        const answer = answers.find((a: { questionId: string }) => a.questionId === question.id);
        if (!answer || answer.value === undefined || answer.value === '') {
          return NextResponse.json(
            { error: `Required question "${question.text}" is not answered` },
            { status: 400 }
          );
        }
      }
    }

    // Create the response
    const response = await db.surveyResponse.create({
      data: {
        surveyId: id,
        userId: session?.id || null,
        answers: JSON.stringify(answers),
      },
    });

    // Update survey response count
    await db.survey.update({
      where: { id },
      data: { responseCount: { increment: 1 } },
    });

    return NextResponse.json({ response }, { status: 201 });
  } catch (error) {
    console.error('Error submitting survey response:', error);
    return NextResponse.json({ error: 'Failed to submit response' }, { status: 500 });
  }
}
