import { PrismaClient } from "@prisma/client";
import { immutabilityMiddleware } from "./middleware/immutability";
import { auditMiddleware } from "./middleware/audit";

export { PrismaClient } from "@prisma/client";
export { immutabilityMiddleware } from "./middleware/immutability";
export { auditMiddleware } from "./middleware/audit";
export {
  validateStatusTransition,
  transitionStatus,
} from "./state-machine";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  (() => {
    const client = new PrismaClient();
    client.$use(immutabilityMiddleware);
    client.$use(auditMiddleware);
    return client;
  })();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
