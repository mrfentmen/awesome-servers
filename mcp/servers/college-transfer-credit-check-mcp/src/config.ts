import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "college-transfer-credit-check-mcp",
  "title": "Transfer Credit Audit",
  "description": "Audit transfer credit by course, accreditation, equivalency, appeal coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "college_transfer_credit",
  "entity": "transfer credit item",
  "categories": [
    {
      "id": "course",
      "label": "Course",
      "baseline": 2
    },
    {
      "id": "accreditation",
      "label": "Accreditation",
      "baseline": 2
    },
    {
      "id": "equivalency",
      "label": "Equivalency",
      "baseline": 2
    },
    {
      "id": "appeal",
      "label": "Appeal",
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
        "course"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "appeal"
      ]
    }
  ],
  "sample": [
    {
      "id": "college_transfer_credit-course-1",
      "name": "Course primary",
      "category": "course",
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
      "id": "college_transfer_credit-accreditation-2",
      "name": "Accreditation primary",
      "category": "accreditation",
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
      "id": "college_transfer_credit-equivalency-3",
      "name": "Equivalency primary",
      "category": "equivalency",
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
      "id": "college_transfer_credit-appeal-4",
      "name": "Appeal primary",
      "category": "appeal",
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
      "id": "college_transfer_credit-course-5",
      "name": "Course backup",
      "category": "course",
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
      "id": "college_transfer_credit-accreditation-6",
      "name": "Accreditation backup",
      "category": "accreditation",
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
      "id": "college_transfer_credit-equivalency-7",
      "name": "Equivalency backup",
      "category": "equivalency",
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
      "id": "college_transfer_credit-appeal-8",
      "name": "Appeal backup",
      "category": "appeal",
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
