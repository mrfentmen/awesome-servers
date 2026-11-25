import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "concert-tailgate-planner-mcp",
  "title": "concert tailgate planner Planner",
  "description": "Real local JSON analysis of concert tailgate planner in the Events & Celebrations lane. 25 MCP tools, no paywall.",
  "prefix": "events_concert_tailgate_planner",
  "entity": "concert tailgate planner item",
  "categories": [
    {
      "id": "events",
      "label": "events",
      "baseline": 2
    },
    {
      "id": "planner",
      "label": "planner",
      "baseline": 2
    },
    {
      "id": "concert-tailgate",
      "label": "concert-tailgate",
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
        "events"
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
      "id": "events_concert_tailgate_planner-events-1",
      "name": "events primary",
      "category": "events",
      "tags": [
        "events-celebrations",
        "concert",
        "tailgate"
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
      "id": "events_concert_tailgate_planner-planner-2",
      "name": "planner primary",
      "category": "planner",
      "tags": [
        "events-celebrations",
        "concert",
        "tailgate"
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
      "id": "events_concert_tailgate_planner-concert-tailgate-3",
      "name": "concert-tailgate primary",
      "category": "concert-tailgate",
      "tags": [
        "events-celebrations",
        "concert",
        "tailgate"
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
      "id": "events_concert_tailgate_planner-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "events-celebrations",
        "concert",
        "tailgate"
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
      "id": "events_concert_tailgate_planner-events-5",
      "name": "events backup",
      "category": "events",
      "tags": [
        "events-celebrations",
        "concert",
        "tailgate"
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
      "id": "events_concert_tailgate_planner-planner-6",
      "name": "planner backup",
      "category": "planner",
      "tags": [
        "events-celebrations",
        "concert",
        "tailgate"
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
      "id": "events_concert_tailgate_planner-concert-tailgate-7",
      "name": "concert-tailgate backup",
      "category": "concert-tailgate",
      "tags": [
        "events-celebrations",
        "concert",
        "tailgate"
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
      "id": "events_concert_tailgate_planner-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "events-celebrations",
        "concert",
        "tailgate"
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
