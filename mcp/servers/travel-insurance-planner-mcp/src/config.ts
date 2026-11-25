import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "travel-insurance-planner-mcp",
  "title": "travel insurance planner Planner",
  "description": "Real local JSON analysis of travel insurance planner in the Travel & Hospitality lane. 25 MCP tools, no paywall.",
  "prefix": "travel_travel_insurance_planner",
  "entity": "travel insurance planner item",
  "categories": [
    {
      "id": "travel",
      "label": "travel",
      "baseline": 2
    },
    {
      "id": "planner",
      "label": "planner",
      "baseline": 2
    },
    {
      "id": "travel-insurance",
      "label": "travel-insurance",
      "baseline": 2
    },
    {
      "id": "mcp",
      "label": "mcp",
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
      "id": "travel_travel_insurance_planner-travel-1",
      "name": "travel primary",
      "category": "travel",
      "tags": [
        "travel-hospitality",
        "travel",
        "insurance"
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
      "id": "travel_travel_insurance_planner-planner-2",
      "name": "planner primary",
      "category": "planner",
      "tags": [
        "travel-hospitality",
        "travel",
        "insurance"
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
      "id": "travel_travel_insurance_planner-travel-insurance-3",
      "name": "travel-insurance primary",
      "category": "travel-insurance",
      "tags": [
        "travel-hospitality",
        "travel",
        "insurance"
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
      "id": "travel_travel_insurance_planner-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "travel-hospitality",
        "travel",
        "insurance"
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
      "id": "travel_travel_insurance_planner-travel-5",
      "name": "travel backup",
      "category": "travel",
      "tags": [
        "travel-hospitality",
        "travel",
        "insurance"
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
      "id": "travel_travel_insurance_planner-planner-6",
      "name": "planner backup",
      "category": "planner",
      "tags": [
        "travel-hospitality",
        "travel",
        "insurance"
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
      "id": "travel_travel_insurance_planner-travel-insurance-7",
      "name": "travel-insurance backup",
      "category": "travel-insurance",
      "tags": [
        "travel-hospitality",
        "travel",
        "insurance"
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
      "id": "travel_travel_insurance_planner-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "travel-hospitality",
        "travel",
        "insurance"
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
