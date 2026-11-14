import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { MissionError } from "./server";
export const missionVisibility = (
  userId: string,
): Prisma.MissionWhereInput => ({
  OR: [
    { organizationId: null, createdBy: userId },
    { organization: { memberships: { some: { userId } } } },
  ],
});
export const templateVisibility = (
  userId: string,
): Prisma.MissionTemplateWhereInput => ({
  OR: [
    { organizationId: null, createdBy: userId },
    { organization: { memberships: { some: { userId } } } },
  ],
});
export async function accessTemplate(id: string, userId: string) {
  const template = await db.missionTemplate.findFirst({
    where: { id, ...templateVisibility(userId) },
  });
  if (!template) throw new MissionError(404, "Template not found.");
  return template;
}
