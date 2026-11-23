import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "appraisal-gap-plan-mcp",
  "title": "Appraisal Gap Plan Tracker",
  "description": "Real local JSON analysis of appraisal gap plan in the Closing Table lane. 25 MCP tools, no paywall.",
  "prefix": "closing_table_appraisal_gap_plan",
  "entity": "appraisal gap plan item",
  "categories": [
    {
      "id": "models",
      "label": "Models",
      "baseline": 2
    },
    {
      "id": "prices",
      "label": "Prices",
      "baseline": 2
    },
    {
      "id": "stock",
      "label": "Stock",
      "baseline": 2
    },
    {
      "id": "shifts",
      "label": "Shifts",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Days since activity",
    "unit": "days",
    "target": 7,
    "direction": "lower"
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
        "models"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "shifts"
      ]
    }
  ],
  "sample": [
    {
      "id": "closing_table_appraisal_gap_plan-models-1",
      "name": "Models primary",
      "category": "models",
      "tags": [
        "closing-table",
        "appraisal",
        "gap"
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
      "id": "closing_table_appraisal_gap_plan-prices-2",
      "name": "Prices primary",
      "category": "prices",
      "tags": [
        "closing-table",
        "appraisal",
        "gap"
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
      "id": "closing_table_appraisal_gap_plan-stock-3",
      "name": "Stock primary",
      "category": "stock",
      "tags": [
        "closing-table",
        "appraisal",
        "gap"
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
      "id": "closing_table_appraisal_gap_plan-shifts-4",
      "name": "Shifts primary",
      "category": "shifts",
      "tags": [
        "closing-table",
        "appraisal",
        "gap"
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
      "id": "closing_table_appraisal_gap_plan-models-5",
      "name": "Models backup",
      "category": "models",
      "tags": [
        "closing-table",
        "appraisal",
        "gap"
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
      "id": "closing_table_appraisal_gap_plan-prices-6",
      "name": "Prices backup",
      "category": "prices",
      "tags": [
        "closing-table",
        "appraisal",
        "gap"
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
      "id": "closing_table_appraisal_gap_plan-stock-7",
      "name": "Stock backup",
      "category": "stock",
      "tags": [
        "closing-table",
        "appraisal",
        "gap"
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
      "id": "closing_table_appraisal_gap_plan-shifts-8",
      "name": "Shifts backup",
      "category": "shifts",
      "tags": [
        "closing-table",
        "appraisal",
        "gap"
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
