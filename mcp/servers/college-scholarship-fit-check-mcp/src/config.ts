import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "college-scholarship-fit-check-mcp",
  "title": "Scholarship Fit Audit",
  "description": "Audit scholarship fit by eligibility, essay, deadline, amount coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "college_scholarship_fit",
  "entity": "scholarship fit item",
  "categories": [
    {
      "id": "eligibility",
      "label": "Eligibility",
      "baseline": 2
    },
    {
      "id": "essay",
      "label": "Essay",
      "baseline": 2
    },
    {
      "id": "deadline",
      "label": "Deadline",
      "baseline": 2
    },
    {
      "id": "amount",
      "label": "Amount",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "days_to_expiry",
    "label": "Days to deadline",
    "unit": "days",
    "target": 30,
    "direction": "higher"
  },
  "target": {
    "maxItems": 30,
    "budget": 700,
    "coverage": 0.75,
    "expiryDays": 45
  },
  "dependencies": [
    {
      "id": "core",
      "label": "Core records",
      "categories": [
        "eligibility"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "amount"
      ]
    }
  ],
  "sample": [
    {
      "id": "college_scholarship_fit-eligibility-1",
      "name": "Eligibility primary",
      "category": "eligibility",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "college_scholarship_fit-essay-2",
      "name": "Essay primary",
      "category": "essay",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
      ],
      "cost": 35,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-29",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "college_scholarship_fit-deadline-3",
      "name": "Deadline primary",
      "category": "deadline",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
      ],
      "cost": 50,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-12",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "college_scholarship_fit-amount-4",
      "name": "Amount primary",
      "category": "amount",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
      ],
      "cost": 65,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-26",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "college_scholarship_fit-eligibility-5",
      "name": "Eligibility backup",
      "category": "eligibility",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
      ],
      "cost": 80,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-09",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "college_scholarship_fit-essay-6",
      "name": "Essay backup",
      "category": "essay",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
      ],
      "cost": 95,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-23",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "college_scholarship_fit-deadline-7",
      "name": "Deadline backup",
      "category": "deadline",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
      ],
      "cost": 110,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-09",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "college_scholarship_fit-amount-8",
      "name": "Amount backup",
      "category": "amount",
      "tags": [
        "college",
        "fafsa",
        "student-aid"
      ],
      "cost": 125,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-23",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
