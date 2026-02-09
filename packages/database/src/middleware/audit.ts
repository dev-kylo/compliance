import { Prisma } from "@prisma/client";

// Models that should be audit-logged
const AUDITED_MODELS = new Set([
  "TimesheetPeriod",
  "TimesheetEntry",
  "NonGrantEntry",
  "Grant",
  "Researcher",
  "GrantResearcher",
]);

// Actions that should be audit-logged
const AUDITED_ACTIONS = new Set([
  "create",
  "update",
  "delete",
]);

/**
 * Prisma middleware that logs all mutations to audited models.
 *
 * Every create, update, and delete on timesheet-related models is logged
 * to the AuditLog table with before/after snapshots.
 */
export const auditMiddleware: Prisma.Middleware = async (params, next) => {
  if (
    !params.model ||
    !AUDITED_MODELS.has(params.model) ||
    !AUDITED_ACTIONS.has(params.action)
  ) {
    return next(params);
  }

  let previousData: Record<string, unknown> | null = null;

  // Capture previous state for updates and deletes
  if (
    (params.action === "update" || params.action === "delete") &&
    params.args.where?.id
  ) {
    try {
      const { PrismaClient } = await import("@prisma/client");
      const checkClient = new PrismaClient();
      try {
        const modelName = params.model.charAt(0).toLowerCase() + params.model.slice(1);
        const model = (checkClient as Record<string, unknown>)[modelName] as {
          findUnique: (args: { where: { id: string } }) => Promise<Record<string, unknown> | null>;
        };
        if (model?.findUnique) {
          previousData = await model.findUnique({
            where: { id: params.args.where.id },
          });
        }
      } finally {
        await checkClient.$disconnect();
      }
    } catch {
      // Don't block the operation if audit pre-fetch fails
    }
  }

  // Execute the actual operation
  const result = await next(params);

  // Log the audit entry asynchronously — don't block the operation
  try {
    const { PrismaClient } = await import("@prisma/client");
    const auditClient = new PrismaClient();
    try {
      await auditClient.auditLog.create({
        data: {
          entityType: params.model!,
          entityId: (result as { id?: string })?.id ?? params.args.where?.id ?? "unknown",
          action: params.action,
          previousData: previousData ? (previousData as Prisma.InputJsonValue) : undefined,
          newData: params.action !== "delete" ? (result as Prisma.InputJsonValue) : undefined,
          // performedBy is set from context — for now use a placeholder
          // In production, this would come from the authenticated session
          performedBy: (params.args as { _auditUserId?: string })?._auditUserId ?? "system",
        },
      });
    } finally {
      await auditClient.$disconnect();
    }
  } catch {
    // Audit logging failure should not block the operation
    console.error(`Failed to create audit log for ${params.model}.${params.action}`);
  }

  return result;
};
