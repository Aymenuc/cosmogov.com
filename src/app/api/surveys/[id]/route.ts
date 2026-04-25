import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    const survey = await db.survey.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        questions: { orderBy: { sortOrder: 'asc' } },
        responses: {
          orderBy: { createdAt: 'desc' },
          take: 200,
          select: {
            id: true,
            userId: true,
            answers: true,
            completedAt: true,
            createdAt: true,
          },
        },
        _count: { select: { responses: true } },
      },
    });

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Check if the current user has already responded
    let hasResponded = false;
    if (session) {
      const existingResponse = await db.surveyResponse.findFirst({
        where: { surveyId: id, userId: session.id },
      });
      hasResponded = !!existingResponse;
    }

    // Compute per-question statistics
    const questionStats = survey.questions.map((question) => {
      const totalResponses = survey.responses.length;
      const parsedOptions: { id: string; label: string }[] = JSON.parse(question.options || '[]');

      if (['single_choice', 'multiple_choice', 'yes_no'].includes(question.type)) {
        // Count occurrences of each option
        const optionCounts: Record<string, number> = {};
        parsedOptions.forEach((opt) => { optionCounts[opt.id || opt.label] = 0; });
        let otherCount = 0;

        survey.responses.forEach((response) => {
          const answers: { questionId: string; value: string | string[]; otherText?: string }[] = JSON.parse(response.answers || '[]');
          const answer = answers.find((a) => a.questionId === question.id);
          if (answer) {
            if (Array.isArray(answer.value)) {
              answer.value.forEach((v: string) => {
                if (optionCounts[v] !== undefined) optionCounts[v]++;
                else otherCount++;
              });
            } else {
              if (optionCounts[answer.value] !== undefined) optionCounts[answer.value]++;
              else otherCount++;
            }
          }
        });

        const results = parsedOptions.map((opt) => ({
          id: opt.id || opt.label,
          label: opt.label,
          count: optionCounts[opt.id || opt.label] || 0,
          percentage: totalResponses > 0 ? Math.round(((optionCounts[opt.id || opt.label] || 0) / totalResponses) * 100) : 0,
        }));

        if (otherCount > 0) {
          results.push({ id: 'other', label: 'Other', count: otherCount, percentage: Math.round((otherCount / totalResponses) * 100) });
        }

        return { questionId: question.id, questionText: question.text, type: question.type, totalResponses, results };
      }

      if (question.type === 'rating') {
        const ratings: number[] = [];
        survey.responses.forEach((response) => {
          const answers: { questionId: string; value: string | string[] }[] = JSON.parse(response.answers || '[]');
          const answer = answers.find((a) => a.questionId === question.id);
          if (answer && typeof answer.value === 'string') {
            const num = parseInt(answer.value, 10);
            if (!isNaN(num)) ratings.push(num);
          }
        });

        const avg = ratings.length > 0 ? (ratings.reduce((s, r) => s + r, 0) / ratings.length) : 0;
        const distribution: Record<number, number> = {};
        const min = question.minRating || 1;
        const max = question.maxRating || 5;
        for (let i = min; i <= max; i++) distribution[i] = 0;
        ratings.forEach((r) => { if (distribution[r] !== undefined) distribution[r]++; });

        return {
          questionId: question.id,
          questionText: question.text,
          type: question.type,
          totalResponses: ratings.length,
          averageRating: Math.round(avg * 10) / 10,
          distribution,
        };
      }

      if (question.type === 'scale') {
        const values: number[] = [];
        survey.responses.forEach((response) => {
          const answers: { questionId: string; value: string | string[] }[] = JSON.parse(response.answers || '[]');
          const answer = answers.find((a) => a.questionId === question.id);
          if (answer && typeof answer.value === 'string') {
            const num = parseInt(answer.value, 10);
            if (!isNaN(num)) values.push(num);
          }
        });

        const avg = values.length > 0 ? (values.reduce((s, v) => s + v, 0) / values.length) : 0;
        return {
          questionId: question.id,
          questionText: question.text,
          type: question.type,
          totalResponses: values.length,
          averageValue: Math.round(avg * 10) / 10,
        };
      }

      if (question.type === 'text') {
        const textAnswers: string[] = [];
        survey.responses.forEach((response) => {
          const answers: { questionId: string; value: string | string[] }[] = JSON.parse(response.answers || '[]');
          const answer = answers.find((a) => a.questionId === question.id);
          if (answer && typeof answer.value === 'string' && answer.value.trim()) {
            textAnswers.push(answer.value);
          }
        });

        return {
          questionId: question.id,
          questionText: question.text,
          type: question.type,
          totalResponses: textAnswers.length,
          sampleAnswers: textAnswers.slice(0, 10),
        };
      }

      return { questionId: question.id, questionText: question.text, type: question.type, totalResponses: 0 };
    });

    return NextResponse.json({
      survey,
      hasResponded,
      questionStats,
    });
  } catch (error) {
    console.error('Error fetching survey:', error);
    return NextResponse.json({ error: 'Failed to fetch survey' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const survey = await db.survey.findUnique({ where: { id } });
    if (!survey) return NextResponse.json({ error: 'Survey not found' }, { status: 404 });

    const isCreator = survey.createdBy === session.id;
    const isAdmin = session.role === 'admin' || session.role === 'super_admin';
    if (!isCreator && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.status) updateData.status = body.status;
    if (body.title) updateData.title = body.title;
    if (body.description) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.closesAt !== undefined) updateData.closesAt = body.closesAt ? new Date(body.closesAt) : null;
    if (body.anonymous !== undefined) updateData.anonymous = body.anonymous;
    if (body.allowMultiple !== undefined) updateData.allowMultiple = body.allowMultiple;
    if (body.aiSummary !== undefined) updateData.aiSummary = body.aiSummary;

    // If activating, update questionCount from actual questions
    if (body.status === 'active') {
      const questionCount = await db.surveyQuestion.count({ where: { surveyId: id } });
      updateData.questionCount = questionCount;
    }

    const updated = await db.survey.update({
      where: { id },
      data: updateData,
      include: {
        creator: { select: { id: true, name: true, avatarUrl: true } },
        questions: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return NextResponse.json({ survey: updated });
  } catch (error) {
    console.error('Error updating survey:', error);
    return NextResponse.json({ error: 'Failed to update survey' }, { status: 500 });
  }
}
