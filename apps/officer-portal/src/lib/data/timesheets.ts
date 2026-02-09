import { prisma } from "@/lib/db";
import type { TimesheetStatus } from "@prisma/client";

export async function getTimesheetPeriods(filters?: { researcherId?: string; year?: number; month?: number; status?: string }) {
  return prisma.timesheetPeriod.findMany({
    where: {
      ...(filters?.researcherId && { researcherId: filters.researcherId }),
      ...(filters?.year && { year: filters.year }),
      ...(filters?.month && { month: filters.month }),
      ...(filters?.status && { status: filters.status as TimesheetStatus }),
    },
    include: {
      researcher: true,
      entries: { include: { grant: true } },
      nonGrantEntries: true,
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
}

export async function getTimesheetPeriod(id: string) {
  return prisma.timesheetPeriod.findUnique({
    where: { id },
    include: {
      researcher: { include: { grantAllocations: { include: { grant: true } } } },
      entries: { include: { grant: true } },
      nonGrantEntries: true,
    },
  });
}
