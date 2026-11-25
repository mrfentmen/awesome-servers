import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "rooftop-garden-tracker-mcp",
  "title": "rooftop garden tracker Tracker",
  "description": "Real local JSON analysis of rooftop garden tracker in the Food & Farm lane. 25 MCP tools, no paywall.",
  "prefix": "food_rooftop_garden_tracker",
  "entity": "rooftop garden tracker item",
  "categories": [
    {
      "id": "food",
      "label": "food",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "rooftop-garden",
      "label": "rooftop-garden",
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
        "food"
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
      "id": "food_rooftop_garden_tracker-food-1",
      "name": "food primary",
      "category": "food",
      "tags": [
        "food-farm",
        "rooftop",
        "garden"
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
      "id": "food_rooftop_garden_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "food-farm",
        "rooftop",
        "garden"
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
      "id": "food_rooftop_garden_tracker-rooftop-garden-3",
      "name": "rooftop-garden primary",
      "category": "rooftop-garden",
      "tags": [
        "food-farm",
        "rooftop",
        "garden"
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
      "id": "food_rooftop_garden_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "food-farm",
        "rooftop",
        "garden"
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
      "id": "food_rooftop_garden_tracker-food-5",
      "name": "food backup",
      "category": "food",
      "tags": [
        "food-farm",
        "rooftop",
        "garden"
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
      "id": "food_rooftop_garden_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "food-farm",
        "rooftop",
        "garden"
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
      "id": "food_rooftop_garden_tracker-rooftop-garden-7",
      "name": "rooftop-garden backup",
      "category": "rooftop-garden",
      "tags": [
        "food-farm",
        "rooftop",
        "garden"
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
      "id": "food_rooftop_garden_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "food-farm",
        "rooftop",
        "garden"
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
