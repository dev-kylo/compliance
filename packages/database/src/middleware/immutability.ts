import { Prisma } from "@prisma/client";

/**
 * Prisma middleware that enforces immutability of locked timesheet periods.
 *
 * Once a TimesheetPeriod's status is LOCKED:
 * - No updates to TimesheetEntry records associated with that period
 * - No updates to NonGrantEntry records associated with that period
 * - No updates to the TimesheetPeriod itself (except through explicit admin override)
 *
 * Belt and braces: the application layer also prevents this, but the middleware
 * enforces it at the database access layer independently.
 */
export const immutabilityMiddleware: Prisma.Middleware = async (
  params,
  next
) => {
  // Guard updates/deletes on TimesheetEntry
  if (
    params.model === "TimesheetEntry" &&
    (params.action === "update" || params.action === "delete")
  ) {
    const entryId =
      params.action === "update"
        ? params.args.where?.id
        : params.args.where?.id;

    if (entryId) {
      // We need a raw client to check the period status
      // This is intentionally a separate query for belt-and-braces enforcement
      const { PrismaClient } = await import("@prisma/client");
      const checkClient = new PrismaClient();
      try {
        const entry = await checkClient.timesheetEntry.findUnique({
          where: { id: entryId },
          select: { timesheetPeriod: { select: { status: true } } },
        });

        if (entry?.timesheetPeriod.status === "LOCKED") {
          throw new Error(
            `Cannot ${params.action} TimesheetEntry — the associated TimesheetPeriod is locked. Locked periods are immutable.`
          );
        }
      } finally {
        await checkClient.$disconnect();
      }
    }
  }

  // Guard updates/deletes on NonGrantEntry
  if (
    params.model === "NonGrantEntry" &&
    (params.action === "update" || params.action === "delete")
  ) {
    const entryId = params.args.where?.id;

    if (entryId) {
      const { PrismaClient } = await import("@prisma/client");
      const checkClient = new PrismaClient();
      try {
        const entry = await checkClient.nonGrantEntry.findUnique({
          where: { id: entryId },
          select: { timesheetPeriod: { select: { status: true } } },
        });

        if (entry?.timesheetPeriod.status === "LOCKED") {
          throw new Error(
            `Cannot ${params.action} NonGrantEntry — the associated TimesheetPeriod is locked. Locked periods are immutable.`
          );
        }
      } finally {
        await checkClient.$disconnect();
      }
    }
  }

  // Guard updates on TimesheetPeriod itself when locked
  // Allow transition TO locked (countersigned → locked) but nothing after
  if (params.model === "TimesheetPeriod" && params.action === "update") {
    const periodId = params.args.where?.id;

    if (periodId) {
      const { PrismaClient } = await import("@prisma/client");
      const checkClient = new PrismaClient();
      try {
        const period = await checkClient.timesheetPeriod.findUnique({
          where: { id: periodId },
          select: { status: true },
        });

        if (period?.status === "LOCKED") {
          throw new Error(
            "Cannot update TimesheetPeriod — it is locked. Locked periods are immutable."
          );
        }
      } finally {
        await checkClient.$disconnect();
      }
    }
  }

  return next(params);
};
