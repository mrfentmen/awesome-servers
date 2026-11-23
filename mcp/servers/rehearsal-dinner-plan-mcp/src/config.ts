import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "rehearsal-dinner-plan-mcp",
  "title": "Rehearsal Dinner Plan Planner",
  "description": "Real local JSON analysis of rehearsal dinner plan in the Wedding Day lane. 25 MCP tools, no paywall.",
  "prefix": "wedding_day_rehearsal_dinner_plan",
  "entity": "rehearsal dinner plan item",
  "categories": [
    {
      "id": "coverage",
      "label": "Coverage",
      "baseline": 2
    },
    {
      "id": "gaps",
      "label": "Gaps",
      "baseline": 2
    },
    {
      "id": "costs",
      "label": "Costs",
      "baseline": 2
    },
    {
      "id": "deadlines",
      "label": "Deadlines",
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
        "coverage"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "deadlines"
      ]
    }
  ],
  "sample": [
    {
      "id": "wedding_day_rehearsal_dinner_plan-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "wedding-day",
        "rehearsal",
        "dinner"
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
      "id": "wedding_day_rehearsal_dinner_plan-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "wedding-day",
        "rehearsal",
        "dinner"
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
      "id": "wedding_day_rehearsal_dinner_plan-costs-3",
      "name": "Costs primary",
      "category": "costs",
      "tags": [
        "wedding-day",
        "rehearsal",
        "dinner"
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
      "id": "wedding_day_rehearsal_dinner_plan-deadlines-4",
      "name": "Deadlines primary",
      "category": "deadlines",
      "tags": [
        "wedding-day",
        "rehearsal",
        "dinner"
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
      "id": "wedding_day_rehearsal_dinner_plan-coverage-5",
      "name": "Coverage backup",
      "category": "coverage",
      "tags": [
        "wedding-day",
        "rehearsal",
        "dinner"
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
      "id": "wedding_day_rehearsal_dinner_plan-gaps-6",
      "name": "Gaps backup",
      "category": "gaps",
      "tags": [
        "wedding-day",
        "rehearsal",
        "dinner"
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
      "id": "wedding_day_rehearsal_dinner_plan-costs-7",
      "name": "Costs backup",
      "category": "costs",
      "tags": [
        "wedding-day",
        "rehearsal",
        "dinner"
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
      "id": "wedding_day_rehearsal_dinner_plan-deadlines-8",
      "name": "Deadlines backup",
      "category": "deadlines",
      "tags": [
        "wedding-day",
        "rehearsal",
        "dinner"
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
