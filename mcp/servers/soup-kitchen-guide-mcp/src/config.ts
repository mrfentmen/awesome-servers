import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "soup-kitchen-guide-mcp",
  "title": "soup kitchen guide Guide",
  "description": "Real local JSON analysis of soup kitchen guide in the Food & Farm lane. 25 MCP tools, no paywall.",
  "prefix": "food_soup_kitchen_guide",
  "entity": "soup kitchen guide item",
  "categories": [
    {
      "id": "food",
      "label": "food",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "soup-kitchen",
      "label": "soup-kitchen",
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
      "id": "food_soup_kitchen_guide-food-1",
      "name": "food primary",
      "category": "food",
      "tags": [
        "food-farm",
        "soup",
        "kitchen"
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
      "id": "food_soup_kitchen_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "food-farm",
        "soup",
        "kitchen"
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
      "id": "food_soup_kitchen_guide-soup-kitchen-3",
      "name": "soup-kitchen primary",
      "category": "soup-kitchen",
      "tags": [
        "food-farm",
        "soup",
        "kitchen"
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
      "id": "food_soup_kitchen_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "food-farm",
        "soup",
        "kitchen"
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
      "id": "food_soup_kitchen_guide-food-5",
      "name": "food backup",
      "category": "food",
      "tags": [
        "food-farm",
        "soup",
        "kitchen"
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
      "id": "food_soup_kitchen_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "food-farm",
        "soup",
        "kitchen"
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
      "id": "food_soup_kitchen_guide-soup-kitchen-7",
      "name": "soup-kitchen backup",
      "category": "soup-kitchen",
      "tags": [
        "food-farm",
        "soup",
        "kitchen"
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
      "id": "food_soup_kitchen_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "food-farm",
        "soup",
        "kitchen"
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
