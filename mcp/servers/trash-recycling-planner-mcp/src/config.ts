import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "trash-recycling-planner-mcp",
  "title": "trash recycling planner Planner",
  "description": "Real local JSON analysis of trash recycling planner in the Local Government lane. 25 MCP tools, no paywall.",
  "prefix": "civic_trash_recycling_planner",
  "entity": "trash recycling planner item",
  "categories": [
    {
      "id": "civic",
      "label": "civic",
      "baseline": 2
    },
    {
      "id": "planner",
      "label": "planner",
      "baseline": 2
    },
    {
      "id": "trash-recycling",
      "label": "trash-recycling",
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
        "civic"
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
      "id": "civic_trash_recycling_planner-civic-1",
      "name": "civic primary",
      "category": "civic",
      "tags": [
        "local-government",
        "trash",
        "recycling"
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
      "id": "civic_trash_recycling_planner-planner-2",
      "name": "planner primary",
      "category": "planner",
      "tags": [
        "local-government",
        "trash",
        "recycling"
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
      "id": "civic_trash_recycling_planner-trash-recycling-3",
      "name": "trash-recycling primary",
      "category": "trash-recycling",
      "tags": [
        "local-government",
        "trash",
        "recycling"
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
      "id": "civic_trash_recycling_planner-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "local-government",
        "trash",
        "recycling"
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
      "id": "civic_trash_recycling_planner-civic-5",
      "name": "civic backup",
      "category": "civic",
      "tags": [
        "local-government",
        "trash",
        "recycling"
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
      "id": "civic_trash_recycling_planner-planner-6",
      "name": "planner backup",
      "category": "planner",
      "tags": [
        "local-government",
        "trash",
        "recycling"
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
      "id": "civic_trash_recycling_planner-trash-recycling-7",
      "name": "trash-recycling backup",
      "category": "trash-recycling",
      "tags": [
        "local-government",
        "trash",
        "recycling"
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
      "id": "civic_trash_recycling_planner-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "local-government",
        "trash",
        "recycling"
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
