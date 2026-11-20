import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "college-study-abroad-budget-check-mcp",
  "title": "Study Abroad Budget Audit",
  "description": "Audit study abroad budget by tuition, travel, housing, insurance coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "college_study_abroad_budget",
  "entity": "study abroad budget item",
  "categories": [
    {
      "id": "tuition",
      "label": "Tuition",
      "baseline": 2
    },
    {
      "id": "travel",
      "label": "Travel",
      "baseline": 2
    },
    {
      "id": "housing",
      "label": "Housing",
      "baseline": 2
    },
    {
      "id": "insurance",
      "label": "Insurance",
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
        "tuition"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "insurance"
      ]
    }
  ],
  "sample": [
    {
      "id": "college_study_abroad_budget-tuition-1",
      "name": "Tuition primary",
      "category": "tuition",
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
      "id": "college_study_abroad_budget-travel-2",
      "name": "Travel primary",
      "category": "travel",
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
      "id": "college_study_abroad_budget-housing-3",
      "name": "Housing primary",
      "category": "housing",
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
      "id": "college_study_abroad_budget-insurance-4",
      "name": "Insurance primary",
      "category": "insurance",
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
      "id": "college_study_abroad_budget-tuition-5",
      "name": "Tuition backup",
      "category": "tuition",
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
      "id": "college_study_abroad_budget-travel-6",
      "name": "Travel backup",
      "category": "travel",
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
      "id": "college_study_abroad_budget-housing-7",
      "name": "Housing backup",
      "category": "housing",
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
      "id": "college_study_abroad_budget-insurance-8",
      "name": "Insurance backup",
      "category": "insurance",
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
