import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "local-restaurant-nutrition-estimate-mcp",
  "title": "Local Restaurant Nutrition Estimate Audit",
  "description": "Local Restaurant Nutrition Estimate Audit: estimate indie menu nutrition, marked estimate. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "local_menu",
  "entity": "dish",
  "categories": [
    {
      "id": "starter",
      "label": "Starters",
      "baseline": 4
    },
    {
      "id": "main",
      "label": "Mains",
      "baseline": 3
    },
    {
      "id": "side",
      "label": "Sides",
      "baseline": 3
    },
    {
      "id": "dessert",
      "label": "Desserts",
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
        "starter"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "dessert"
      ]
    }
  ],
  "sample": [
    {
      "id": "local_menu-sample-1",
      "name": "Sample starters entry",
      "category": "starter",
      "tags": [
        "restaurant"
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
      "id": "local_menu-sample-2",
      "name": "Sample mains entry",
      "category": "main",
      "tags": [
        "restaurant"
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
      "id": "local_menu-sample-3",
      "name": "Sample sides entry",
      "category": "side",
      "tags": [
        "restaurant"
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
      "id": "local_menu-sample-4",
      "name": "Sample desserts entry",
      "category": "dessert",
      "tags": [
        "restaurant"
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
