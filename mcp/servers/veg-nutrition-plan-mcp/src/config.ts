import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "veg-nutrition-plan-mcp",
  "title": "Veg Nutrition Plan Audit",
  "description": "Veg Nutrition Plan Audit: plan weekly plant meals for calcium iron protein. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "veg_nutrition",
  "entity": "meal plan",
  "categories": [
    {
      "id": "greens",
      "label": "Greens",
      "baseline": 4
    },
    {
      "id": "beans",
      "label": "Beans and lentils",
      "baseline": 3
    },
    {
      "id": "grains",
      "label": "Grains",
      "baseline": 3
    },
    {
      "id": "nuts",
      "label": "Nuts and seeds",
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
        "greens"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "nuts"
      ]
    }
  ],
  "sample": [
    {
      "id": "veg_nutrition-sample-1",
      "name": "Sample greens entry",
      "category": "greens",
      "tags": [
        "vegan"
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
      "id": "veg_nutrition-sample-2",
      "name": "Sample beans and lentils entry",
      "category": "beans",
      "tags": [
        "vegan"
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
      "id": "veg_nutrition-sample-3",
      "name": "Sample grains entry",
      "category": "grains",
      "tags": [
        "vegan"
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
      "id": "veg_nutrition-sample-4",
      "name": "Sample nuts and seeds entry",
      "category": "nuts",
      "tags": [
        "vegan"
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
