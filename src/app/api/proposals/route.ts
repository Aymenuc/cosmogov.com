import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser, apiFailure, ApiError, rateLimit } from "@/lib/api-server";
import {
  proposalVisibility,
  proposalResults,
  voteTotals,
} from "@/lib/proposals-server";
import { proposalCreate } from "@/lib/proposal-validation";
export async function GET(req: NextRequest) {
  try {
    const user = await apiUser();
    const params = req.nextUrl.searchParams;
    const proposals = await db.proposal.findMany({
      where: {
        ...proposalVisibility(user.id),
        ...(params.get("status") ? { status: params.get("status")! } : {}),
        ...(params.get("orgId")
          ? { organizationId: params.get("orgId")! }
          : {}),
        ...(params.get("search")
          ? {
              title: {
                contains: params.get("search")!.slice(0, 200),
                mode: "insensitive",
              },
            }
          : {}),
        ...(params.get("category")
          ? { category: params.get("category")! }
          : {}),
      },
      include: {
        creator: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true, slug: true } },
        votes: {
          where: { voterId: user.id },
          select: { id: true, option: true, voterId: true },
        },
        _count: { select: { votes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const results = await proposalResults(proposals.map((p) => p.id));
    return NextResponse.json(
      proposals.map((p) => ({ ...p, voteTotals: voteTotals(results, p.id) })),
    );
  } catch (error) {
    return apiFailure(error);
  }
}
export async function POST(req: NextRequest) {
  try {
    const user = await apiUser();
    await rateLimit("proposal-create", user.id, 20, 3600);
    const data = proposalCreate.parse(await req.json());
    if (
      data.organizationId &&
      !(await db.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: data.organizationId,
          },
        },
      }))
    )
      throw new ApiError(
        403,
        "Join this community before creating its proposals.",
      );
    const proposal = await db.proposal.create({
      data: {
        ...data,
        options: JSON.stringify(data.options),
        closesAt: data.closesAt ? new Date(data.closesAt) : null,
        createdBy: user.id,
      },
      include: {
        creator: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true, slug: true } },
      },
    });
    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    return apiFailure(error);
  }
}
