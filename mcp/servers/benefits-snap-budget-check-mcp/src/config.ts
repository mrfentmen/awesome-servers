import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "benefits-snap-budget-check-mcp",
  "title": "SNAP Budget Audit",
  "description": "Audit snap budget by household, income, deductions, benefit coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "benefits_snap_budget",
  "entity": "snap budget item",
  "categories": [
    {
      "id": "household",
      "label": "Household",
      "baseline": 2
    },
    {
      "id": "income",
      "label": "Income",
      "baseline": 2
    },
    {
      "id": "deductions",
      "label": "Deductions",
      "baseline": 2
    },
    {
      "id": "benefit",
      "label": "Benefit",
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
        "household"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "benefit"
      ]
    }
  ],
  "sample": [
    {
      "id": "benefits_snap_budget-household-1",
      "name": "Household primary",
      "category": "household",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_snap_budget-income-2",
      "name": "Income primary",
      "category": "income",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_snap_budget-deductions-3",
      "name": "Deductions primary",
      "category": "deductions",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_snap_budget-benefit-4",
      "name": "Benefit primary",
      "category": "benefit",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_snap_budget-household-5",
      "name": "Household backup",
      "category": "household",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_snap_budget-income-6",
      "name": "Income backup",
      "category": "income",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_snap_budget-deductions-7",
      "name": "Deductions backup",
      "category": "deductions",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
      "id": "benefits_snap_budget-benefit-8",
      "name": "Benefit backup",
      "category": "benefit",
      "tags": [
        "benefits",
        "medicare",
        "retirement"
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
