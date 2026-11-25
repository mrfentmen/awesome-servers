import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "cruise-plan-checklist-mcp",
  "title": "cruise plan checklist Checklist",
  "description": "Real local JSON analysis of cruise plan checklist in the Travel & Hospitality lane. 25 MCP tools, no paywall.",
  "prefix": "travel_cruise_plan_checklist",
  "entity": "cruise plan checklist item",
  "categories": [
    {
      "id": "travel",
      "label": "travel",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "cruise-plan",
      "label": "cruise-plan",
      "baseline": 2
    },
    {
      "id": "mcp",
      "label": "mcp",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Days since review",
    "unit": "days",
    "target": 14,
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
        "travel"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "mcp"
      ]
    }
  ],
  "sample": [
    {
      "id": "travel_cruise_plan_checklist-travel-1",
      "name": "travel primary",
      "category": "travel",
      "tags": [
        "travel-hospitality",
        "cruise",
        "plan"
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
      "id": "travel_cruise_plan_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "travel-hospitality",
        "cruise",
        "plan"
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
      "id": "travel_cruise_plan_checklist-cruise-plan-3",
      "name": "cruise-plan primary",
      "category": "cruise-plan",
      "tags": [
        "travel-hospitality",
        "cruise",
        "plan"
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
      "id": "travel_cruise_plan_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "travel-hospitality",
        "cruise",
        "plan"
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
      "id": "travel_cruise_plan_checklist-travel-5",
      "name": "travel backup",
      "category": "travel",
      "tags": [
        "travel-hospitality",
        "cruise",
        "plan"
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
      "id": "travel_cruise_plan_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "travel-hospitality",
        "cruise",
        "plan"
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
      "id": "travel_cruise_plan_checklist-cruise-plan-7",
      "name": "cruise-plan backup",
      "category": "cruise-plan",
      "tags": [
        "travel-hospitality",
        "cruise",
        "plan"
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
      "id": "travel_cruise_plan_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "travel-hospitality",
        "cruise",
        "plan"
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
