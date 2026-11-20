import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "college-graduation-audit-check-mcp",
  "title": "Graduation Audit Audit",
  "description": "Audit graduation audit by credits, major, gen eds, application coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "college_graduation_audit",
  "entity": "graduation audit item",
  "categories": [
    {
      "id": "credits",
      "label": "Credits",
      "baseline": 2
    },
    {
      "id": "major",
      "label": "Major",
      "baseline": 2
    },
    {
      "id": "gen-eds",
      "label": "Gen eds",
      "baseline": 2
    },
    {
      "id": "application",
      "label": "Application",
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
        "credits"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "application"
      ]
    }
  ],
  "sample": [
    {
      "id": "college_graduation_audit-credits-1",
      "name": "Credits primary",
      "category": "credits",
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
      "id": "college_graduation_audit-major-2",
      "name": "Major primary",
      "category": "major",
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
      "id": "college_graduation_audit-gen-eds-3",
      "name": "Gen eds primary",
      "category": "gen-eds",
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
      "id": "college_graduation_audit-application-4",
      "name": "Application primary",
      "category": "application",
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
      "id": "college_graduation_audit-credits-5",
      "name": "Credits backup",
      "category": "credits",
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
      "id": "college_graduation_audit-major-6",
      "name": "Major backup",
      "category": "major",
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
      "id": "college_graduation_audit-gen-eds-7",
      "name": "Gen eds backup",
      "category": "gen-eds",
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
      "id": "college_graduation_audit-application-8",
      "name": "Application backup",
      "category": "application",
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
