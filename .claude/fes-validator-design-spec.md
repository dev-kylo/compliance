# FES Validator MVP — Design & Implementation Specification

## Overview

Build an interactive demo for "FES Validator" — a compliance tool that helps UK university research finance teams identify audit risks in grant expenditure before submitting Final Expenditure Statements (FES) to UKRI.

**Core value proposition**: "Upload your 10,000-row ERP export, I'll tell you which 5 rows will fail audit"

This is an **explorable clickable demo with hardcoded data**, not a working backend. The purpose is market validation at the ARMA Annual Conference (June 2026).

---

## Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui for consistent, professional components
- **Icons**: Lucide React
- **Charts** (if needed): Recharts
- **State**: React useState (no backend needed)

---

## Design Principles (Based on UX Research)

### 1. Compliance Dashboard Best Practices
- **Minimalist dashboards**: Show only essential information at a glance
- **Progressive disclosure**: Reveal details only when needed (click to expand)
- **Color-coded risk visualization**: Red (high), Amber (medium), Green (low/clean)
- **Clear visual hierarchy**: Most critical metrics at top-left (primary scan position)
- **Contextual guidance**: Brief explanations for compliance terms

### 2. Data Table & Issue List Patterns
- **Master-detail pattern**: List view → click → detail panel (side drawer or full page)
- **Severity badges**: Visual hierarchy so high-risk items demand attention
- **Row highlighting**: Subtle background color to indicate risk level
- **Scannable columns**: Icon + short text + amount + severity badge
- **Click-through affordance**: Entire row clickable, subtle hover state

### 3. File Upload & Processing UX
- **Drag-and-drop zone**: Large, clearly delineated area with dashed border
- **File type indicators**: Show accepted formats (.xlsx, .csv)
- **Progress feedback**: Fake processing animation with cycling status messages
- **Labor illusion**: 3-4 second animation even though data is instant (builds trust)

### 4. KPI Cards
- **4-5 key metrics maximum** on summary view
- **Large numbers** with small labels below
- **Contextual coloring**: Red for amounts at risk, green for clean
- **Consistent card sizing** in grid layout

---

## Screen Flow & Wireframes

### Screen 1: Landing Page

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              [LOGO]  FES Validator                          │
│                                                             │
│     Find the 5 rows that will fail your next UKRI audit     │
│                                                             │
│     ┌─────────────────────────────────────────────────┐     │
│     │                                                 │     │
│     │      📄 Drag & drop your transaction export     │     │
│     │          or click to browse files               │     │
│     │                                                 │     │
│     │          .xlsx, .csv up to 50MB                 │     │
│     └─────────────────────────────────────────────────┘     │
│                                                             │
│     Funder: [UKRI ▾]  (dropdown, only UKRI works)          │
│                                                             │
│     ─────────────────────────────────────────────────────   │
│     Trusted by research finance teams at 12 UK universities │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Design notes:**
- Clean, minimal landing with single focused action
- Drop zone: 400px × 200px, dashed border (#E5E7EB), rounded-lg
- On hover/drag-over: border becomes solid blue (#3B82F6), light blue bg
- Funder dropdown disabled with tooltip for non-UKRI options: "Coming soon"
- Subtle social proof footer (greyed out university logos optional)

---

### Screen 2: Upload Confirmation

After "upload" (fake), show file details before processing:

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back                                      FES Validator  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     📄 oracle_export_grant_EP-X029441_2024-25.xlsx         │
│                                                             │
│     ┌──────────────────┐  ┌──────────────────┐             │
│     │   4,847          │  │   £2,341,892     │             │
│     │   transactions   │  │   total value    │             │
│     └──────────────────┘  └──────────────────┘             │
│                                                             │
│     Grant: EP/X029441/1 — Neural Interface Development      │
│     Period: Apr 2022 – Mar 2025                            │
│     Funder: UKRI - EPSRC                                   │
│                                                             │
│              [ Run Compliance Check →]                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Design notes:**
- Two stat cards side-by-side, centered
- File name in monospace font, truncate if long
- Grant details in muted text below
- Primary CTA button: filled blue, prominent

---

### Screen 3: Processing Animation

Full-screen loader with cycling status messages:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│                    ◠ ◡ ◠  (spinner)                         │
│                                                             │
│              Checking staff cost evidence...                │
│                                                             │
│              ████████░░░░░░░░  47%                          │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Status message rotation** (every 800ms):
1. "Parsing transaction data..."
2. "Matching against UKRI eligibility rules..."
3. "Checking staff cost evidence..."
4. "Validating timesheet records..."
5. "Flagging audit risks..."
6. "Generating report..."

**Design notes:**
- Total duration: 3.5 seconds
- Progress bar fills smoothly with ease-in animation
- Centered vertically and horizontally
- Clean white background
- Status text fades between messages

---

### Screen 4: Risk Dashboard (Main Results)

```
┌─────────────────────────────────────────────────────────────┐
│  ← New Check                                 FES Validator  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  EP/X029441/1 — Neural Interface Development                │
│  FES deadline: 30 Jun 2025 (156 days)                      │
│                                                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐ │
│  │ 🔴 12      │ │ 🟡 34      │ │ 🟢 4,801   │ │ 68/100   │ │
│  │ High Risk  │ │ Med Risk   │ │ Clean      │ │ Audit    │ │
│  │ £47,291    │ │ £89,445    │ │            │ │ Score    │ │
│  └────────────┘ └────────────┘ └────────────┘ └──────────┘ │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ISSUES BY CATEGORY                                         │
│                                                             │
│  👤 Staff Costs      3 issues    £31,200 at risk    [→]    │
│  🖥️ Equipment        2 issues    £8,450 at risk     [→]    │
│  🧪 Consumables      5 issues    £4,891 at risk     [→]    │
│  ✈️ Travel           2 issues    £2,750 at risk     [→]    │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  [ View All 12 Issues ]              [ Export Report 📥 ]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Design notes:**

**KPI Cards (top row):**
- 4 cards in responsive grid (2×2 on mobile, 4×1 on desktop)
- High Risk card: Red left border or subtle red background tint
- Medium Risk card: Amber accent
- Clean card: Green accent
- Audit Score: Circular progress indicator or simple number

**Category breakdown:**
- List items with subtle hover state
- Click anywhere on row to filter to that category
- Arrow icon on right indicates drill-down available
- Issue count in bold, amount in regular weight

**Buttons:**
- "View All Issues" = primary (filled)
- "Export Report" = secondary (outlined)

---

### Screen 5: Issue List

```
┌─────────────────────────────────────────────────────────────┐
│  ← Dashboard                    Filter: [All ▾]  [Staff ▾]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  12 issues found • £47,291 total exposure                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🔴  👤  Dr. Sarah Chen — Nov Salary      £4,200   #1892 ││
│  │     Missing timesheet evidence                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🔴  👤  Dr. James Okafor — Dec Salary    £6,300   #2104 ││
│  │     Timesheet shows 22% vs 30% billed                   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🔴  🖥️  Apple iPad Pro                   £1,299   #3421 ││
│  │     General computing — no project justification        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 🟡  🧪  Amazon Office Supplies           £247.89  #2876 ││
│  │     Non-itemised receipt                                ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ... (scrollable list continues)                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Design notes:**

**Issue cards:**
- Full-width cards with subtle shadow or border
- Left color stripe indicating severity (8px wide)
- Two-line layout:
  - Line 1: Severity dot + Category icon + Description (bold) + Amount + Row #
  - Line 2: Brief issue summary (muted text)
- Entire card clickable → navigates to detail view
- Hover: subtle background change + slight lift/shadow

**Filters:**
- Dropdown for severity: All / High / Medium
- Dropdown for category: All / Staff / Equipment / Consumables / Travel
- Filters apply instantly (client-side)

**Row number (#1892):**
- Monospace, muted color
- Important for users to locate in their actual ERP export

---

### Screen 6: Issue Detail (Staff Cost Example)

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Issues                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔴 HIGH RISK                                               │
│                                                             │
│  Dr. Sarah Chen — November 2024 Salary                      │
│  Row 1,892 in transaction export                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Amount        £4,200.00                                ││
│  │  Cost Type     Directly Incurred Staff                  ││
│  │  Cost Centre   PHYS-2341                                ││
│  │  Posted        3 Dec 2024                               ││
│  │  Invoice Ref   PAY-NOV24-SC001                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ━━━ COMPLIANCE ISSUE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                             │
│  No timesheet evidence for November 2024                    │
│                                                             │
│  Staff cost charged at budgeted FTE (20%) with no           │
│  timesheet evidence. Dr. Chen is allocated across           │
│  multiple grants and therefore requires monthly             │
│  timesheet records under UKRI RGC 4.6.                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  📖 UKRI Terms & Conditions — RGC 4.6                   ││
│  │  "Where an individual is working on more than one       ││
│  │  project, the Research Organisation must maintain       ││
│  │  records of actual time spent on each project."         ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ━━━ AUDIT RISK ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                             │
│  Without timesheet evidence, this cost is likely to be      │
│  disallowed at audit.                                       │
│                                                             │
│  Total exposure: £6,720                                     │
│  (£4,200 salary + £2,520 overhead at 60%)                   │
│                                                             │
│  ━━━ RECOMMENDED ACTIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                             │
│  ☐  Obtain signed timesheet from Dr. Chen                  │
│  ☐  If unavailable, adjust charge to actual hours          │
│  ☐  Document variance justification if >10%                │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  [ Mark as Reviewed ✓ ]  [ Add Note 📝 ]  [ Dismiss ✕ ]    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Design notes:**

**Header section:**
- Large severity badge with background color
- Transaction description as page title
- Row number in muted monospace

**Transaction details:**
- Clean key-value layout in card
- Left-aligned labels, right-aligned values
- Subtle divider between rows

**Compliance issue section:**
- Clear section headers with horizontal rules
- Readable paragraph text (not bullet points)
- Rule citation in separate card with book icon
- Slightly indented or different background

**Audit risk section:**
- Total exposure in bold with calculation shown
- Red text or background tint for amount

**Recommended actions:**
- Checkbox-style list (decorative, not functional in demo)
- Each action is specific and actionable

**Action buttons:**
- "Mark as Reviewed" = primary
- "Add Note" and "Dismiss" = secondary/outline
- These are demo-only (show toast "Action recorded" on click)

---

### Screen 7: Issue Detail (Equipment Example)

Same layout structure, different content:

```
🔴 HIGH RISK

Apple iPad Pro 12.9" — Equipment Purchase
Row 3,421 in transaction export

┌─────────────────────────────────────┐
│  Amount        £1,299.00            │
│  Cost Type     Directly Incurred    │
│  Vendor        Apple Store Online   │
│  Cost Centre   ENG-4521             │
│  Posted        15 Oct 2024          │
│  PO Number     PO-2024-08921        │
└─────────────────────────────────────┘

━━━ COMPLIANCE ISSUE ━━━━━━━━━━━━━━━━━

General computing equipment without project justification

iPad purchased as "Equipment" but appears to be general-
purpose computing equipment. UKRI requires equipment 
charged to grants to be demonstrably necessary for the 
specific project.

┌─────────────────────────────────────────────────────┐
│  📖 UKRI Guidance on Directly Incurred Costs        │
│  "Equipment that would normally be provided by the  │
│  institution as part of research infrastructure     │
│  should not be charged as Directly Incurred."       │
└─────────────────────────────────────────────────────┘

━━━ AUDIT RISK ━━━━━━━━━━━━━━━━━━━━━━━

Equipment without documented project-specific need is 
commonly disallowed. Full purchase price at risk.

Total exposure: £1,299.00

━━━ RECOMMENDED ACTIONS ━━━━━━━━━━━━━━━

☐  Document specific project use case for iPad
☐  If general use, recode to departmental budget
☐  Obtain PI sign-off on project necessity
```

---

## Data Model Reference

Use the provided JSON data file (`fes-validator-dummy-data.json`) for all hardcoded data. Key structures:

### Grants Array
```typescript
interface Grant {
  id: string;
  reference: string;        // "EP/X029441/1"
  title: string;
  funder: string;
  pi: { name, department, email };
  startDate: string;
  endDate: string;
  fesDeadline: string;
  daysUntilDeadline: number;
  totalAwarded: number;
  totalSpent: number;
  riskLevel: "high" | "medium" | "low";
  summary: {
    totalTransactions: number;
    highRiskCount: number;
    mediumRiskCount: number;
    cleanCount: number;
    totalAtRisk: number;
    categories: Record<string, CategorySummary>;
  };
}
```

### Issues Array
```typescript
interface Issue {
  id: string;
  grantId: string;
  rowNumber: number;
  severity: "high" | "medium" | "low";
  category: "Staff Costs" | "Equipment" | "Consumables" | "Travel" | "Other";
  costType: string;
  transactionDate: string;
  description: string;
  vendor: string;
  amount: number;
  costCentre: string;
  issue: {
    type: string;
    title: string;
    description: string;
    ruleReference: { source, section, text, url };
    auditRisk: string;
    totalExposure: number;
    exposureCalculation: string;
    recommendedActions: string[];
  };
}
```

---

## Color Palette

```css
/* Severity colors */
--risk-high: #DC2626;       /* Red-600 */
--risk-high-bg: #FEE2E2;    /* Red-100 */
--risk-medium: #F59E0B;     /* Amber-500 */
--risk-medium-bg: #FEF3C7;  /* Amber-100 */
--risk-low: #10B981;        /* Emerald-500 */
--risk-low-bg: #D1FAE5;     /* Emerald-100 */

/* UI colors */
--primary: #3B82F6;         /* Blue-500 */
--primary-dark: #2563EB;    /* Blue-600 */
--text-primary: #111827;    /* Gray-900 */
--text-secondary: #6B7280;  /* Gray-500 */
--text-muted: #9CA3AF;      /* Gray-400 */
--border: #E5E7EB;          /* Gray-200 */
--background: #F9FAFB;      /* Gray-50 */
--card-bg: #FFFFFF;
```

---

## Typography

- **Headings**: Inter or system-ui, semibold
- **Body**: Inter or system-ui, regular
- **Monospace** (row numbers, codes): JetBrains Mono or monospace
- **Base size**: 16px
- **Scale**: 
  - Page title: 24px / 1.5rem
  - Section header: 18px / 1.125rem
  - Card title: 16px / 1rem
  - Body: 14px / 0.875rem
  - Muted/label: 12px / 0.75rem

---

## Responsive Behavior

**Breakpoints:**
- Mobile: < 640px
- Tablet: 640px – 1024px
- Desktop: > 1024px

**Key adaptations:**
- KPI cards: 2×2 grid on mobile, 4×1 on desktop
- Issue list: Full-width cards on all sizes
- Issue detail: Single column on mobile, two-column (metadata + content) on desktop
- Navigation: Sticky header with back button

---

## Interactions & Micro-interactions

1. **Drop zone hover**: Border pulses, background fades to light blue
2. **Processing animation**: Smooth progress bar with status text fade
3. **Card hover**: Subtle shadow lift (translateY -2px, shadow increase)
4. **Button hover**: Darken background by 10%
5. **Severity badge**: Subtle pulse animation on high-risk items (optional)
6. **Toast notifications**: Slide in from bottom-right, auto-dismiss after 3s

---

## Demo Flow Logic

```typescript
// State machine for demo navigation
const screens = [
  'landing',
  'upload-confirm',
  'processing',
  'dashboard',
  'issue-list',
  'issue-detail'
];

// Fake upload always loads grant_001 data
// Processing screen shows for 3.5 seconds then auto-navigates
// Issue list can filter by severity and category
// Issue detail shows based on selected issue ID
```

---

## File Structure Suggestion

```
/app
  /page.tsx                 # Landing
  /upload/page.tsx          # Upload confirmation
  /processing/page.tsx      # Processing animation
  /dashboard/page.tsx       # Main results
  /issues/page.tsx          # Issue list
  /issues/[id]/page.tsx     # Issue detail
/components
  /ui                       # shadcn components
  /DropZone.tsx
  /KPICard.tsx
  /IssueCard.tsx
  /SeverityBadge.tsx
  /CategoryIcon.tsx
  /ProcessingLoader.tsx
/lib
  /data.ts                  # Import and export dummy data
  /utils.ts                 # Formatting helpers
```

---

## Key Implementation Notes

1. **No actual file upload**: The drop zone is purely visual. Clicking/dropping triggers navigation to upload-confirm with hardcoded filename.

2. **Single grant demo**: Always show EP/X029441/1 data. Multi-grant view is out of scope.

3. **Buttons are decorative**: "Export Report", "Mark as Reviewed" etc. show toast messages but don't persist state.

4. **URL-based navigation**: Use Next.js routing so back button works naturally.

5. **Mobile-first**: Build mobile layout first, enhance for desktop.

6. **Accessibility basics**: 
   - Proper heading hierarchy
   - Color contrast for severity indicators
   - Button focus states
   - Alt text for icons (use aria-label)

---

## Success Criteria

The demo is successful if a Research Finance Manager can:

1. ✅ Understand the value proposition within 5 seconds of landing
2. ✅ "Upload" a file and see realistic processing feedback
3. ✅ Quickly identify how many issues exist and total £ at risk
4. ✅ Drill into a specific issue and understand why it's flagged
5. ✅ See the specific UKRI rule that's being violated
6. ✅ Know what actions to take to remediate

---

## Out of Scope for MVP

- Actual file parsing
- User authentication
- Saving/persisting state
- Multiple grant comparison
- PDF report generation
- Email notifications
- Wellcome/Horizon Europe rules
