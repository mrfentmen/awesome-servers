import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "college-school-compare-check-mcp",
  "title": "School Compare Audit",
  "description": "Audit school compare by cost, program, location, outcomes coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "college_school_compare",
  "entity": "school compare item",
  "categories": [
    {
      "id": "cost",
      "label": "Cost",
      "baseline": 2
    },
    {
      "id": "program",
      "label": "Program",
      "baseline": 2
    },
    {
      "id": "location",
      "label": "Location",
      "baseline": 2
    },
    {
      "id": "outcomes",
      "label": "Outcomes",
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
        "cost"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "outcomes"
      ]
    }
  ],
  "sample": [
    {
      "id": "college_school_compare-cost-1",
      "name": "Cost primary",
      "category": "cost",
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
      "id": "college_school_compare-program-2",
      "name": "Program primary",
      "category": "program",
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
      "id": "college_school_compare-location-3",
      "name": "Location primary",
      "category": "location",
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
      "id": "college_school_compare-outcomes-4",
      "name": "Outcomes primary",
      "category": "outcomes",
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
      "id": "college_school_compare-cost-5",
      "name": "Cost backup",
      "category": "cost",
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
      "id": "college_school_compare-program-6",
      "name": "Program backup",
      "category": "program",
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
      "id": "college_school_compare-location-7",
      "name": "Location backup",
      "category": "location",
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
      "id": "college_school_compare-outcomes-8",
      "name": "Outcomes backup",
      "category": "outcomes",
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
