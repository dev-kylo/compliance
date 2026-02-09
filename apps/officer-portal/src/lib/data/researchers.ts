import { prisma } from "@/lib/db";

export async function getResearchers() {
  return prisma.researcher.findMany({
    include: {
      grantAllocations: { include: { grant: true } },
      timesheetPeriods: { include: { entries: true, nonGrantEntries: true }, orderBy: { year: "desc" } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getResearcher(id: string) {
  return prisma.researcher.findUnique({
    where: { id },
    include: {
      grantAllocations: { include: { grant: true } },
      timesheetPeriods: {
        include: { entries: { include: { grant: true } }, nonGrantEntries: true },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      },
    },
  });
}
