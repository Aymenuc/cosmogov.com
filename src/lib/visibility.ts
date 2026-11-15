import type { Prisma } from "@prisma/client";

/**
 * Who may see a space. Public spaces are visible to every signed-in member;
 * private ones only to their creator and the people inside them.
 * Use these in every list, detail and map query so "private" means private.
 */
export const processVisibility = (
  userId: string,
): Prisma.ParticipatoryProcessWhereInput => ({
  OR: [
    { isPublic: true },
    { createdBy: userId },
    { organization: { memberships: { some: { userId } } } },
  ],
});

export const assemblyVisibility = (
  userId: string,
): Prisma.AssemblyWhereInput => ({
  OR: [
    { isPublic: true },
    { createdBy: userId },
    { members: { some: { userId } } },
  ],
});

export const debateVisibility = (
  userId: string,
): Prisma.DebateSessionWhereInput => ({
  OR: [
    { isPublic: true },
    { createdBy: userId },
    { participants: { some: { userId } } },
  ],
});

/**
 * Items that may sit inside a process (surveys, legislation, meetings,
 * initiatives, assemblies): standalone ones follow their own rules; ones
 * inside a private process are visible only to people who can see it.
 */
export const inVisibleProcess = (userId: string) => ({
  OR: [{ processId: null }, { process: processVisibility(userId) }],
});
