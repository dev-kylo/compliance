import { prisma } from "@/lib/db";

export async function getGrants() {
  return prisma.grant.findMany({
    include: {
      principalInvestigator: true,
      grantAllocations: { include: { researcher: true } },
    },
    orderBy: { reference: "asc" },
  });
}

export async function getGrant(id: string) {
  return prisma.grant.findUnique({
    where: { id },
    include: {
      principalInvestigator: true,
      grantAllocations: { include: { researcher: true } },
      timesheetEntries: {
        include: {
          timesheetPeriod: { include: { entries: true, nonGrantEntries: true } },
        },
      },
    },
  });
}
