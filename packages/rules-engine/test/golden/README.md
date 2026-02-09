# Golden Tests for the Rules Engine

These are **expert-validated test cases** that represent the **source of truth** for
how the compliance rules engine should behave. They are hand-calculated and
cross-checked by domain experts against UKRI policy documentation.

## Purpose

Golden tests serve a different purpose from regular unit tests:

1. **Source of truth** -- If a golden test fails, the code is wrong, not the test.
   Golden test expected values should only be updated after explicit approval from
   a domain expert who has re-validated the calculation.
2. **Regression guard** -- Any refactor, optimisation, or formula change must
   continue to produce exactly these results.
3. **Audit evidence** -- These tests demonstrate that the system has been
   validated against known-correct scenarios, supporting compliance audits.

## Test Scenarios

| File | Description |
|------|-------------|
| `ukri-salary-basic.test.ts` | Full-time researcher, standard UKRI salary cost calculation |
| `ukri-salary-part-time.test.ts` | Part-time (fractional FTE) researcher scenarios |
| `ukri-salary-edge-cases.test.ts` | Boundary conditions: zero hours, FTE overruns, structural assertions |

## Calculation Methodology (UKRI)

All expected values follow the UKRI fEC salary cost methodology:

1. **Contracted monthly hours** = (contractedHoursWeekly x 52) / 12
2. **Effort percentage** = project hours for the month / contracted monthly hours
3. **Monthly salary** = annual salary / 12
4. **Salary cost charged to grant** = effort percentage x monthly salary
5. **Claimable cost** = salary cost x fEC rate (80% for UKRI)

Intermediate values use full floating-point precision. Final monetary amounts
are rounded to two decimal places.

## Maintenance Policy

- **Do not modify expected values** without domain expert sign-off.
- If a test fails after a code change, investigate the code change first.
- New golden tests require a hand-calculation worksheet reviewed by a second person.
