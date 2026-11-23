import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "first-week-fix-list-mcp",
  "title": "First Week Fix List Tracker",
  "description": "Real local JSON analysis of first week fix list in the Closing Table lane. 25 MCP tools, no paywall.",
  "prefix": "closing_table_first_week_fix_list",
  "entity": "first week fix list item",
  "categories": [
    {
      "id": "steps",
      "label": "Steps",
      "baseline": 2
    },
    {
      "id": "tools",
      "label": "Tools",
      "baseline": 2
    },
    {
      "id": "parts",
      "label": "Parts",
      "baseline": 2
    },
    {
      "id": "safety",
      "label": "Safety",
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
        "steps"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "safety"
      ]
    }
  ],
  "sample": [
    {
      "id": "closing_table_first_week_fix_list-steps-1",
      "name": "Steps primary",
      "category": "steps",
      "tags": [
        "closing-table",
        "first",
        "week"
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
      "id": "closing_table_first_week_fix_list-tools-2",
      "name": "Tools primary",
      "category": "tools",
      "tags": [
        "closing-table",
        "first",
        "week"
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
      "id": "closing_table_first_week_fix_list-parts-3",
      "name": "Parts primary",
      "category": "parts",
      "tags": [
        "closing-table",
        "first",
        "week"
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
      "id": "closing_table_first_week_fix_list-safety-4",
      "name": "Safety primary",
      "category": "safety",
      "tags": [
        "closing-table",
        "first",
        "week"
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
      "id": "closing_table_first_week_fix_list-steps-5",
      "name": "Steps backup",
      "category": "steps",
      "tags": [
        "closing-table",
        "first",
        "week"
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
      "id": "closing_table_first_week_fix_list-tools-6",
      "name": "Tools backup",
      "category": "tools",
      "tags": [
        "closing-table",
        "first",
        "week"
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
      "id": "closing_table_first_week_fix_list-parts-7",
      "name": "Parts backup",
      "category": "parts",
      "tags": [
        "closing-table",
        "first",
        "week"
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
      "id": "closing_table_first_week_fix_list-safety-8",
      "name": "Safety backup",
      "category": "safety",
      "tags": [
        "closing-table",
        "first",
        "week"
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
