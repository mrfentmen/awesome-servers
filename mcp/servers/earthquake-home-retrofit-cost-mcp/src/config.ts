import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "earthquake-home-retrofit-cost-mcp",
  "title": "Home Retrofit Budget Audit",
  "description": "Audit home retrofit budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "home_retrofit_budget",
  "entity": "retrofit item budget line",
  "categories": [
    {
      "id": "foundation",
      "label": "Foundation",
      "baseline": 2
    },
    {
      "id": "frame",
      "label": "Frame",
      "baseline": 1
    },
    {
      "id": "water-heater",
      "label": "Water Heater",
      "baseline": 1
    },
    {
      "id": "contents",
      "label": "Contents",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 500,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 4700,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "foundation",
      "label": "Foundation",
      "categories": [
        "foundation"
      ]
    },
    {
      "id": "frame",
      "label": "Frame",
      "categories": [
        "frame"
      ]
    },
    {
      "id": "water-heater",
      "label": "Water Heater",
      "categories": [
        "water-heater"
      ]
    },
    {
      "id": "contents",
      "label": "Contents",
      "categories": [
        "contents"
      ]
    }
  ],
  "sample": [
    {
      "id": "home_retrofit_budget-foundation-bolting",
      "name": "Foundation bolting",
      "category": "foundation",
      "tags": [
        "budget"
      ],
      "cost": 1200,
      "quantity": 1200,
      "condition": "new"
    },
    {
      "id": "home_retrofit_budget-cripple-wall-bracing",
      "name": "Cripple wall bracing",
      "category": "frame",
      "tags": [
        "budget"
      ],
      "cost": 2500,
      "quantity": 2500,
      "condition": "new"
    },
    {
      "id": "home_retrofit_budget-water-heater-strap",
      "name": "Water heater strap",
      "category": "water-heater",
      "tags": [
        "budget"
      ],
      "cost": 150,
      "quantity": 150,
      "condition": "new"
    },
    {
      "id": "home_retrofit_budget-cabinet-latches",
      "name": "Cabinet latches",
      "category": "contents",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "new"
    }
  ]
}
