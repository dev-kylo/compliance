import { PrismaClient, TimesheetStatus, NonGrantCategory } from "@prisma/client";
import * as crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function main() {
  console.log("Seeding database with Loughborough pilot data...\n");

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.nonGrantEntry.deleteMany();
  await prisma.timesheetEntry.deleteMany();
  await prisma.timesheetPeriod.deleteMany();
  await prisma.grantResearcher.deleteMany();
  await prisma.grant.deleteMany();
  await prisma.researcher.deleteMany();
  await prisma.user.deleteMany();
  await prisma.institution.deleteMany();

  // ── Institution ────────────────────────────────────────────────────────
  const lboro = await prisma.institution.create({
    data: {
      name: "Loughborough University",
      code: "LBORO",
    },
  });
  console.log("Created institution:", lboro.name);

  // ── Researchers ────────────────────────────────────────────────────────
  const drChen = await prisma.researcher.create({
    data: {
      name: "Dr Sarah Chen",
      email: "s.chen@lboro.ac.uk",
      department: "Engineering",
      contractedHoursWeekly: 35,
      employmentFraction: 1.0,
      annualSalary: 52000,
      salaryEffectiveDate: new Date("2024-08-01"),
      institutionId: lboro.id,
    },
  });

  const drOkafor = await prisma.researcher.create({
    data: {
      name: "Dr James Okafor",
      email: "j.okafor@lboro.ac.uk",
      department: "Chemistry",
      contractedHoursWeekly: 37.5,
      employmentFraction: 0.8,
      annualSalary: 45000,
      salaryEffectiveDate: new Date("2024-01-01"),
      institutionId: lboro.id,
    },
  });

  const drMehta = await prisma.researcher.create({
    data: {
      name: "Dr Priya Mehta",
      email: "p.mehta@lboro.ac.uk",
      department: "Computer Science",
      contractedHoursWeekly: 35,
      employmentFraction: 1.0,
      annualSalary: 61000,
      salaryEffectiveDate: new Date("2024-04-01"),
      institutionId: lboro.id,
    },
  });

  console.log("Created researchers:", drChen.name, drOkafor.name, drMehta.name);

  // ── Grants ─────────────────────────────────────────────────────────────
  const grantMaterials = await prisma.grant.create({
    data: {
      funderProfileId: "ukri",
      title: "Advanced Materials for Energy Storage",
      reference: "EP/T023456/1",
      startDate: new Date("2024-10-01"),
      endDate: new Date("2027-09-30"),
      totalStaffBudget: 185000,
      principalInvestigatorId: drChen.id,
      institutionId: lboro.id,
    },
  });

  const grantHydrogen = await prisma.grant.create({
    data: {
      funderProfileId: "ukri",
      title: "Catalysis for Green Hydrogen",
      reference: "EP/V078901/1",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2027-12-31"),
      totalStaffBudget: 142000,
      principalInvestigatorId: drChen.id,
      institutionId: lboro.id,
    },
  });

  const grantDrugDiscovery = await prisma.grant.create({
    data: {
      funderProfileId: "ukri",
      title: "Machine Learning for Drug Discovery",
      reference: "EP/W034567/1",
      startDate: new Date("2024-04-01"),
      endDate: new Date("2026-03-31"),
      totalStaffBudget: 210000,
      principalInvestigatorId: drMehta.id,
      institutionId: lboro.id,
    },
  });

  const grantPolymer = await prisma.grant.create({
    data: {
      funderProfileId: "ukri",
      title: "Sustainable Polymer Processing",
      reference: "EP/X012345/1",
      startDate: new Date("2025-03-01"),
      endDate: new Date("2028-02-28"),
      totalStaffBudget: 168000,
      principalInvestigatorId: drMehta.id,
      institutionId: lboro.id,
    },
  });

  console.log("Created grants:", grantMaterials.reference, grantHydrogen.reference, grantDrugDiscovery.reference, grantPolymer.reference);

  // ── Grant-Researcher Allocations ───────────────────────────────────────
  await prisma.grantResearcher.createMany({
    data: [
      { grantId: grantMaterials.id, researcherId: drChen.id, fundedFTE: 0.4 },
      { grantId: grantHydrogen.id, researcherId: drChen.id, fundedFTE: 0.2 },
      { grantId: grantMaterials.id, researcherId: drOkafor.id, fundedFTE: 0.3 },
      { grantId: grantHydrogen.id, researcherId: drOkafor.id, fundedFTE: 0.3 },
      { grantId: grantDrugDiscovery.id, researcherId: drMehta.id, fundedFTE: 0.5 },
      { grantId: grantPolymer.id, researcherId: drMehta.id, fundedFTE: 0.3 },
    ],
  });
  console.log("Created grant-researcher allocations");

  // ── Users ──────────────────────────────────────────────────────────────
  await prisma.user.createMany({
    data: [
      {
        email: "officer@lboro.ac.uk",
        name: "Research Finance Officer",
        passwordHash: hashPassword("pilot2025"),
        role: "OFFICER",
      },
      {
        email: "s.chen@lboro.ac.uk",
        name: "Dr Sarah Chen",
        passwordHash: hashPassword("pilot2025"),
        role: "PI",
        researcherId: drChen.id,
      },
      {
        email: "p.mehta@lboro.ac.uk",
        name: "Dr Priya Mehta",
        passwordHash: hashPassword("pilot2025"),
        role: "PI",
        researcherId: drMehta.id,
      },
      {
        email: "j.okafor@lboro.ac.uk",
        name: "Dr James Okafor",
        passwordHash: hashPassword("pilot2025"),
        role: "RESEARCHER",
        researcherId: drOkafor.id,
      },
    ],
  });
  console.log("Created users");

  // ── Timesheet Data (Sep 2025 – Feb 2026) ──────────────────────────────
  // Helper to create a timesheet period with entries
  async function createPeriod(
    researcherId: string,
    year: number,
    month: number,
    status: TimesheetStatus,
    grantEntries: { grantId: string; hours: number; notes?: string }[],
    nonGrantEntries: { category: NonGrantCategory; hours: number; description?: string }[],
    timestamps: {
      submittedAt?: Date;
      signedAt?: Date;
      countersignedAt?: Date;
      lockedAt?: Date;
    } = {}
  ) {
    const period = await prisma.timesheetPeriod.create({
      data: {
        researcherId,
        year,
        month,
        status,
        submittedAt: timestamps.submittedAt ?? null,
        signedAt: timestamps.signedAt ?? null,
        countersignedAt: timestamps.countersignedAt ?? null,
        lockedAt: timestamps.lockedAt ?? null,
      },
    });

    if (grantEntries.length > 0) {
      await prisma.timesheetEntry.createMany({
        data: grantEntries.map((e) => ({
          timesheetPeriodId: period.id,
          grantId: e.grantId,
          hours: e.hours,
          notes: e.notes ?? null,
        })),
      });
    }

    if (nonGrantEntries.length > 0) {
      await prisma.nonGrantEntry.createMany({
        data: nonGrantEntries.map((e) => ({
          timesheetPeriodId: period.id,
          category: e.category,
          hours: e.hours,
          description: e.description ?? null,
        })),
      });
    }

    return period;
  }

  // ─── Dr Sarah Chen (diligent — mostly locked) ─────────────────────────
  // She's on EP/T023456/1 (0.4 FTE) and EP/V078901/1 (0.2 FTE, starts Jan 2025)
  // Contracted: 35 hrs/week → ~151.67 hrs/month

  // Sep 2025 — locked (only Materials grant active, Hydrogen started Jan)
  await createPeriod(
    drChen.id, 2025, 9, "LOCKED",
    [
      { grantId: grantMaterials.id, hours: 62, notes: "Lab work and analysis" },
      { grantId: grantHydrogen.id, hours: 28, notes: "Literature review" },
    ],
    [
      { category: "TEACHING", hours: 25, description: "Undergraduate lectures" },
      { category: "ADMIN", hours: 15, description: "Department meetings" },
      { category: "OTHER_RESEARCH", hours: 22, description: "PhD supervision" },
    ],
    {
      submittedAt: new Date("2025-10-03"),
      signedAt: new Date("2025-10-04"),
      countersignedAt: new Date("2025-10-06"),
      lockedAt: new Date("2025-10-07"),
    }
  );

  // Oct 2025 — locked
  await createPeriod(
    drChen.id, 2025, 10, "LOCKED",
    [
      { grantId: grantMaterials.id, hours: 58, notes: "Sample preparation" },
      { grantId: grantHydrogen.id, hours: 32, notes: "Catalyst screening" },
    ],
    [
      { category: "TEACHING", hours: 28, description: "Lectures and tutorials" },
      { category: "ADMIN", hours: 12, description: "Committee work" },
      { category: "OTHER_RESEARCH", hours: 20, description: "Paper review" },
    ],
    {
      submittedAt: new Date("2025-11-02"),
      signedAt: new Date("2025-11-03"),
      countersignedAt: new Date("2025-11-05"),
      lockedAt: new Date("2025-11-06"),
    }
  );

  // Nov 2025 — locked
  await createPeriod(
    drChen.id, 2025, 11, "LOCKED",
    [
      { grantId: grantMaterials.id, hours: 60, notes: "Data analysis" },
      { grantId: grantHydrogen.id, hours: 30, notes: "Experimental design" },
    ],
    [
      { category: "TEACHING", hours: 26, description: "Term-time teaching" },
      { category: "ADMIN", hours: 14, description: "Staff meetings" },
      { category: "OTHER_RESEARCH", hours: 20, description: "Conference prep" },
    ],
    {
      submittedAt: new Date("2025-12-04"),
      signedAt: new Date("2025-12-05"),
      countersignedAt: new Date("2025-12-08"),
      lockedAt: new Date("2025-12-09"),
    }
  );

  // Dec 2025 — locked (high hours on Materials — will trigger FTE warning)
  await createPeriod(
    drChen.id, 2025, 12, "LOCKED",
    [
      { grantId: grantMaterials.id, hours: 85, notes: "Intensive lab phase — deadline push" },
      { grantId: grantHydrogen.id, hours: 25, notes: "Report writing" },
    ],
    [
      { category: "TEACHING", hours: 10, description: "End of term" },
      { category: "ADMIN", hours: 8, description: "Year-end admin" },
      { category: "LEAVE", hours: 22, description: "Christmas leave" },
    ],
    {
      submittedAt: new Date("2026-01-05"),
      signedAt: new Date("2026-01-06"),
      countersignedAt: new Date("2026-01-08"),
      lockedAt: new Date("2026-01-09"),
    }
  );

  // Jan 2026 — countersigned (awaiting lock)
  await createPeriod(
    drChen.id, 2026, 1, "COUNTERSIGNED",
    [
      { grantId: grantMaterials.id, hours: 56, notes: "Results analysis" },
      { grantId: grantHydrogen.id, hours: 30, notes: "Planning next experiments" },
    ],
    [
      { category: "TEACHING", hours: 30, description: "New term lectures" },
      { category: "ADMIN", hours: 15, description: "Grant meeting prep" },
      { category: "OTHER_RESEARCH", hours: 20, description: "PhD supervision" },
    ],
    {
      submittedAt: new Date("2026-02-03"),
      signedAt: new Date("2026-02-04"),
      countersignedAt: new Date("2026-02-06"),
    }
  );

  // Feb 2026 — submitted (awaiting signatures)
  await createPeriod(
    drChen.id, 2026, 2, "SUBMITTED",
    [
      { grantId: grantMaterials.id, hours: 60, notes: "Ongoing experiments" },
      { grantId: grantHydrogen.id, hours: 28, notes: "Catalyst optimization" },
    ],
    [
      { category: "TEACHING", hours: 25, description: "Lectures" },
      { category: "ADMIN", hours: 12, description: "Department business" },
      { category: "OTHER_RESEARCH", hours: 25, description: "Paper writing" },
    ],
    {
      submittedAt: new Date("2026-02-08"),
    }
  );

  console.log("Created Dr Chen's timesheets (Sep 2025 – Feb 2026)");

  // ─── Dr James Okafor (some unsigned — the common problem) ─────────────
  // He's on EP/T023456/1 (0.3 FTE) and EP/V078901/1 (0.3 FTE, starts Jan 2025)
  // Part-time 0.8 FTE, 37.5 hrs/week → ~162.5 hrs/month (but 0.8 = ~130 hrs)

  // Sep 2025 — locked (old one OK)
  await createPeriod(
    drOkafor.id, 2025, 9, "LOCKED",
    [
      { grantId: grantMaterials.id, hours: 48, notes: "Lab support" },
      { grantId: grantHydrogen.id, hours: 45, notes: "Hydrogen experiments" },
    ],
    [
      { category: "TEACHING", hours: 15, description: "Lab demonstrating" },
      { category: "ADMIN", hours: 10, description: "Meetings" },
      { category: "OTHER_RESEARCH", hours: 12, description: "Literature review" },
    ],
    {
      submittedAt: new Date("2025-10-05"),
      signedAt: new Date("2025-10-07"),
      countersignedAt: new Date("2025-10-09"),
      lockedAt: new Date("2025-10-10"),
    }
  );

  // Oct 2025 — submitted but NOT signed (problem!)
  await createPeriod(
    drOkafor.id, 2025, 10, "SUBMITTED",
    [
      { grantId: grantMaterials.id, hours: 50, notes: "Sample analysis" },
      { grantId: grantHydrogen.id, hours: 42, notes: "Catalyst tests" },
    ],
    [
      { category: "TEACHING", hours: 18, description: "Lab sessions" },
      { category: "ADMIN", hours: 8, description: "Admin" },
      { category: "OTHER_RESEARCH", hours: 12, description: "Reading" },
    ],
    {
      submittedAt: new Date("2025-11-08"),
    }
  );

  // Nov 2025 — submitted but NOT signed
  await createPeriod(
    drOkafor.id, 2025, 11, "SUBMITTED",
    [
      { grantId: grantMaterials.id, hours: 45, notes: "Data collection" },
      // MISSING entry for EP/V078901/1 — completeness gap!
    ],
    [
      { category: "TEACHING", hours: 20, description: "Teaching" },
      { category: "ADMIN", hours: 10, description: "Admin" },
      { category: "OTHER_RESEARCH", hours: 55, description: "Other work" },
    ],
    {
      submittedAt: new Date("2025-12-12"),
    }
  );

  // Dec 2025 — signed but awaiting PI countersignature
  await createPeriod(
    drOkafor.id, 2025, 12, "SIGNED",
    [
      { grantId: grantMaterials.id, hours: 42, notes: "End of year wrap-up" },
      { grantId: grantHydrogen.id, hours: 38, notes: "Report writing" },
    ],
    [
      { category: "TEACHING", hours: 5, description: "Minimal teaching" },
      { category: "LEAVE", hours: 30, description: "Christmas leave" },
      { category: "ADMIN", hours: 15, description: "Year-end admin" },
    ],
    {
      submittedAt: new Date("2026-01-06"),
      signedAt: new Date("2026-01-07"),
    }
  );

  // Jan 2026 — submitted, late (submitted 15 days after deadline)
  await createPeriod(
    drOkafor.id, 2026, 1, "SUBMITTED",
    [
      { grantId: grantMaterials.id, hours: 46, notes: "Lab work" },
      { grantId: grantHydrogen.id, hours: 44, notes: "Experiments" },
    ],
    [
      { category: "TEACHING", hours: 15, description: "New term" },
      { category: "ADMIN", hours: 12, description: "Planning" },
      { category: "OTHER_RESEARCH", hours: 13, description: "Supervision" },
    ],
    {
      submittedAt: new Date("2026-02-25"), // Late! Deadline was ~Feb 10
    }
  );

  // Feb 2026 — draft (not yet submitted)
  await createPeriod(
    drOkafor.id, 2026, 2, "DRAFT",
    [
      { grantId: grantMaterials.id, hours: 40, notes: "In progress" },
    ],
    [],
    {}
  );

  console.log("Created Dr Okafor's timesheets (Sep 2025 – Feb 2026)");

  // ─── Dr Priya Mehta (Jan/Feb still in draft — she's behind) ───────────
  // She's on EP/W034567/1 (0.5 FTE) and EP/X012345/1 (0.3 FTE, starts Mar 2025)
  // Full-time 1.0, 35 hrs/week → ~151.67 hrs/month

  // Sep 2025 — locked
  await createPeriod(
    drMehta.id, 2025, 9, "LOCKED",
    [
      { grantId: grantDrugDiscovery.id, hours: 72, notes: "ML model training" },
      { grantId: grantPolymer.id, hours: 40, notes: "Initial experiments" },
    ],
    [
      { category: "TEACHING", hours: 20, description: "MSc lectures" },
      { category: "ADMIN", hours: 10, description: "Department meetings" },
      { category: "OTHER_RESEARCH", hours: 10, description: "Paper review" },
    ],
    {
      submittedAt: new Date("2025-10-04"),
      signedAt: new Date("2025-10-06"),
      countersignedAt: new Date("2025-10-08"),
      lockedAt: new Date("2025-10-09"),
    }
  );

  // Oct 2025 — locked
  await createPeriod(
    drMehta.id, 2025, 10, "LOCKED",
    [
      { grantId: grantDrugDiscovery.id, hours: 75, notes: "Feature engineering" },
      { grantId: grantPolymer.id, hours: 42, notes: "Literature review" },
    ],
    [
      { category: "TEACHING", hours: 18, description: "Lectures" },
      { category: "ADMIN", hours: 8, description: "Meetings" },
      { category: "OTHER_RESEARCH", hours: 8, description: "Supervision" },
    ],
    {
      submittedAt: new Date("2025-11-03"),
      signedAt: new Date("2025-11-04"),
      countersignedAt: new Date("2025-11-06"),
      lockedAt: new Date("2025-11-07"),
    }
  );

  // Nov 2025 — countersigned
  await createPeriod(
    drMehta.id, 2025, 11, "COUNTERSIGNED",
    [
      { grantId: grantDrugDiscovery.id, hours: 70, notes: "Model validation" },
      { grantId: grantPolymer.id, hours: 38, notes: "Processing tests" },
    ],
    [
      { category: "TEACHING", hours: 22, description: "Teaching" },
      { category: "ADMIN", hours: 10, description: "Admin" },
      { category: "OTHER_RESEARCH", hours: 12, description: "Other" },
    ],
    {
      submittedAt: new Date("2025-12-05"),
      signedAt: new Date("2025-12-06"),
      countersignedAt: new Date("2025-12-09"),
    }
  );

  // Dec 2025 — signed (awaiting PI countersignature)
  await createPeriod(
    drMehta.id, 2025, 12, "SIGNED",
    [
      { grantId: grantDrugDiscovery.id, hours: 68, notes: "Paper writing" },
      { grantId: grantPolymer.id, hours: 35, notes: "Planning" },
    ],
    [
      { category: "TEACHING", hours: 12, description: "End of term" },
      { category: "LEAVE", hours: 20, description: "Christmas leave" },
      { category: "ADMIN", hours: 15, description: "Year-end" },
    ],
    {
      submittedAt: new Date("2026-01-04"),
      signedAt: new Date("2026-01-05"),
    }
  );

  // Jan 2026 — DRAFT (she's behind!)
  await createPeriod(
    drMehta.id, 2026, 1, "DRAFT",
    [
      { grantId: grantDrugDiscovery.id, hours: 65, notes: "Draft" },
      { grantId: grantPolymer.id, hours: 45, notes: "Draft" },
    ],
    [
      { category: "TEACHING", hours: 25, description: "New term" },
      { category: "ADMIN", hours: 10, description: "Planning" },
    ],
    {}
  );

  // Feb 2026 — DRAFT (also behind!)
  await createPeriod(
    drMehta.id, 2026, 2, "DRAFT",
    [
      { grantId: grantDrugDiscovery.id, hours: 70 },
      { grantId: grantPolymer.id, hours: 40 },
    ],
    [
      { category: "TEACHING", hours: 22, description: "Lectures" },
    ],
    {}
  );

  console.log("Created Dr Mehta's timesheets (Sep 2025 – Feb 2026)");

  // ── Summary ────────────────────────────────────────────────────────────
  const periodCount = await prisma.timesheetPeriod.count();
  const entryCount = await prisma.timesheetEntry.count();
  const nonGrantCount = await prisma.nonGrantEntry.count();

  console.log("\n=== Seed Complete ===");
  console.log(`Institution: 1`);
  console.log(`Researchers: 3`);
  console.log(`Grants: 4`);
  console.log(`Grant-Researcher allocations: 6`);
  console.log(`Timesheet periods: ${periodCount}`);
  console.log(`Timesheet entries: ${entryCount}`);
  console.log(`Non-grant entries: ${nonGrantCount}`);
  console.log(`Users: 4`);
  console.log("\nDashboard should show:");
  console.log("- Dr Chen: mostly compliant, Dec has high FTE on Materials");
  console.log("- Dr Okafor: multiple unsigned timesheets, Nov missing Hydrogen entry");
  console.log("- Dr Mehta: Jan + Feb still in draft");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
