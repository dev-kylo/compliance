"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { Prisma, NonGrantCategory, TimesheetStatus, ReminderLevel } from "@prisma/client";

export async function createTimesheetPeriod(data: {
  researcherId: string;
  year: number;
  month: number;
  entries: { grantId: string; hours: number; notes?: string }[];
  nonGrantEntries: { category: string; hours: number; description?: string }[];
}) {
  const period = await prisma.timesheetPeriod.create({
    data: {
      researcherId: data.researcherId,
      year: data.year,
      month: data.month,
      status: "DRAFT",
      entries: {
        create: data.entries.map((e) => ({
          grantId: e.grantId,
          hours: e.hours,
          notes: e.notes || null,
        })),
      },
      nonGrantEntries: {
        create: data.nonGrantEntries.map((e) => ({
          category: e.category as NonGrantCategory,
          hours: e.hours,
          description: e.description || null,
        })),
      },
    },
    include: { entries: true, nonGrantEntries: true },
  });

  await prisma.auditLog.create({
    data: {
      entityType: "TimesheetPeriod",
      entityId: period.id,
      action: "create",
      newData: period as unknown as Prisma.InputJsonValue,
      performedBy: "officer",
    },
  });

  revalidatePath("/timesheets");
  revalidatePath("/dashboard");
  return period;
}

export async function updateTimesheetEntries(data: {
  periodId: string;
  entries: { grantId: string; hours: number; notes?: string }[];
  nonGrantEntries: {
    category: string;
    hours: number;
    description?: string;
  }[];
}) {
  const period = await prisma.timesheetPeriod.findUnique({
    where: { id: data.periodId },
  });
  if (!period || period.status === "LOCKED") {
    throw new Error("Cannot update a locked timesheet period.");
  }
  if (period.status !== "DRAFT") {
    throw new Error("Can only update entries on draft timesheets.");
  }

  await prisma.timesheetEntry.deleteMany({
    where: { timesheetPeriodId: data.periodId },
  });
  await prisma.nonGrantEntry.deleteMany({
    where: { timesheetPeriodId: data.periodId },
  });

  await prisma.timesheetEntry.createMany({
    data: data.entries.map((e) => ({
      timesheetPeriodId: data.periodId,
      grantId: e.grantId,
      hours: e.hours,
      notes: e.notes || null,
    })),
  });

  await prisma.nonGrantEntry.createMany({
    data: data.nonGrantEntries.map((e) => ({
      timesheetPeriodId: data.periodId,
      category: e.category as NonGrantCategory,
      hours: e.hours,
      description: e.description || null,
    })),
  });

  await prisma.auditLog.create({
    data: {
      entityType: "TimesheetPeriod",
      entityId: data.periodId,
      action: "update",
      newData: {
        entries: data.entries,
        nonGrantEntries: data.nonGrantEntries,
      } as unknown as Prisma.InputJsonValue,
      performedBy: "officer",
    },
  });

  revalidatePath("/timesheets");
  revalidatePath("/dashboard");
}

export async function transitionTimesheetStatus(
  periodId: string,
  newStatus: string
) {
  const period = await prisma.timesheetPeriod.findUnique({
    where: { id: periodId },
  });
  if (!period) throw new Error("Period not found");

  const statusMap: Record<string, TimesheetStatus> = {
    DRAFT: "SUBMITTED",
    SUBMITTED: "SIGNED",
    SIGNED: "COUNTERSIGNED",
    COUNTERSIGNED: "LOCKED",
  };

  const expectedNext = statusMap[period.status];
  if (!expectedNext || newStatus !== expectedNext) {
    throw new Error(
      `Invalid transition from ${period.status} to ${newStatus}`
    );
  }

  const now = new Date();
  const updateData: Prisma.TimesheetPeriodUpdateInput = {
    status: expectedNext,
  };

  switch (expectedNext) {
    case "SUBMITTED":
      updateData.submittedAt = now;
      break;
    case "SIGNED":
      updateData.signedAt = now;
      break;
    case "COUNTERSIGNED":
      updateData.countersignedAt = now;
      break;
    case "LOCKED":
      updateData.lockedAt = now;
      break;
  }

  const updated = await prisma.timesheetPeriod.update({
    where: { id: periodId },
    data: updateData,
  });

  await prisma.auditLog.create({
    data: {
      entityType: "TimesheetPeriod",
      entityId: periodId,
      action: newStatus.toLowerCase(),
      previousData: {
        status: period.status,
      } as unknown as Prisma.InputJsonValue,
      newData: { status: newStatus } as unknown as Prisma.InputJsonValue,
      performedBy: "officer",
    },
  });

  revalidatePath("/timesheets");
  revalidatePath("/dashboard");
  revalidatePath("/researchers");
  return updated;
}

export async function markReminderSent(
  researcherId: string,
  year: number,
  month: number,
  level: string
) {
  const reminder = await prisma.reminder.create({
    data: {
      researcherId,
      periodYear: year,
      periodMonth: month,
      level: level as ReminderLevel,
      sentAt: new Date(),
      markedSentBy: "officer",
    },
  });
  revalidatePath("/timesheets");
  return reminder;
}
