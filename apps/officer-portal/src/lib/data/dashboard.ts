import { prisma } from "@/lib/db";

export async function getDashboardData() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Use the latest month that should be submitted (previous month)
  const targetMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const targetYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const researchers = await prisma.researcher.findMany({
    include: {
      timesheetPeriods: {
        include: { entries: true, nonGrantEntries: true },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      },
      grantAllocations: { include: { grant: true } },
    },
  });

  const allPeriods = await prisma.timesheetPeriod.findMany({
    where: { year: targetYear, month: targetMonth },
    include: { researcher: true, entries: true },
  });

  const totalResearchers = researchers.length;
  const submittedCount = allPeriods.filter(p => p.status !== "DRAFT").length;
  const unsignedCount = allPeriods.filter(p => p.status === "SUBMITTED").length;
  const lockedCount = allPeriods.filter(p => p.status === "LOCKED").length;

  // Researchers with NO period at all for the target month
  const researcherIdsWithPeriods = new Set(allPeriods.map(p => p.researcherId));
  const missingCount = researchers.filter(r => !researcherIdsWithPeriods.has(r.id)).length;

  // Overdue periods (submitted but not signed, and deadline passed)
  const overduePeriods = await prisma.timesheetPeriod.findMany({
    where: {
      status: { in: ["DRAFT", "SUBMITTED"] },
    },
    include: { researcher: true },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });

  return {
    targetMonth,
    targetYear,
    totalResearchers,
    submittedCount,
    unsignedCount,
    lockedCount,
    missingCount,
    overduePeriods,
    researchers,
  };
}
