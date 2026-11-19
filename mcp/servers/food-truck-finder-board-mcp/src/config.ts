import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "food-truck-finder-board-mcp",
  "title": "Food Truck Finder Board Audit",
  "description": "Food Truck Finder Board Audit: local food truck schedule board. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "food_truck",
  "entity": "truck",
  "categories": [
    {
      "id": "tacos",
      "label": "Tacos",
      "baseline": 4
    },
    {
      "id": "bbq",
      "label": "BBQ",
      "baseline": 3
    },
    {
      "id": "dessert",
      "label": "Dessert",
      "baseline": 3
    },
    {
      "id": "drinks",
      "label": "Drinks",
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
    "budget": 1000,
    "coverage": 0.75,
    "expiryDays": 45
  },
  "dependencies": [
    {
      "id": "core",
      "label": "Core records",
      "categories": [
        "tacos"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "drinks"
      ]
    }
  ],
  "sample": [
    {
      "id": "food_truck-sample-1",
      "name": "Sample tacos entry",
      "category": "tacos",
      "tags": [
        "food-truck"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "food_truck-sample-2",
      "name": "Sample bbq entry",
      "category": "bbq",
      "tags": [
        "food-truck"
      ],
      "cost": 30,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "food_truck-sample-3",
      "name": "Sample dessert entry",
      "category": "dessert",
      "tags": [
        "food-truck"
      ],
      "cost": 40,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "food_truck-sample-4",
      "name": "Sample drinks entry",
      "category": "drinks",
      "tags": [
        "food-truck"
      ],
      "cost": 50,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
