import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "sailing-marina-cost-compare-plan-mcp",
  "title": "Marina Cost Compare Planner",
  "description": "Real local JSON analysis of marina cost compare in the Sailing lane. 25 MCP tools, no paywall.",
  "prefix": "sailing_sailing_marina_cost_compare_plan",
  "entity": "marina cost compare item",
  "categories": [
    {
      "id": "goals",
      "label": "Goals",
      "baseline": 2
    },
    {
      "id": "schedule",
      "label": "Schedule",
      "baseline": 2
    },
    {
      "id": "budget",
      "label": "Budget",
      "baseline": 2
    },
    {
      "id": "dependencies",
      "label": "Dependencies",
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
        "goals"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "dependencies"
      ]
    }
  ],
  "sample": [
    {
      "id": "sailing_sailing_marina_cost_compare_plan-goals-1",
      "name": "Goals primary",
      "category": "goals",
      "tags": [
        "sailing",
        "sailing",
        "marina"
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
      "id": "sailing_sailing_marina_cost_compare_plan-schedule-2",
      "name": "Schedule primary",
      "category": "schedule",
      "tags": [
        "sailing",
        "sailing",
        "marina"
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
      "id": "sailing_sailing_marina_cost_compare_plan-budget-3",
      "name": "Budget primary",
      "category": "budget",
      "tags": [
        "sailing",
        "sailing",
        "marina"
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
      "id": "sailing_sailing_marina_cost_compare_plan-dependencies-4",
      "name": "Dependencies primary",
      "category": "dependencies",
      "tags": [
        "sailing",
        "sailing",
        "marina"
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
      "id": "sailing_sailing_marina_cost_compare_plan-goals-5",
      "name": "Goals backup",
      "category": "goals",
      "tags": [
        "sailing",
        "sailing",
        "marina"
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
      "id": "sailing_sailing_marina_cost_compare_plan-schedule-6",
      "name": "Schedule backup",
      "category": "schedule",
      "tags": [
        "sailing",
        "sailing",
        "marina"
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
      "id": "sailing_sailing_marina_cost_compare_plan-budget-7",
      "name": "Budget backup",
      "category": "budget",
      "tags": [
        "sailing",
        "sailing",
        "marina"
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
      "id": "sailing_sailing_marina_cost_compare_plan-dependencies-8",
      "name": "Dependencies backup",
      "category": "dependencies",
      "tags": [
        "sailing",
        "sailing",
        "marina"
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
