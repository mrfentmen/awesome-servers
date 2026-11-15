import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "california-water-district-plan-mcp",
  "title": "Water District Planning Audit",
  "description": "Plan water district by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "water_district_plan",
  "entity": "water item plan",
  "categories": [
    {
      "id": "supply",
      "label": "Supply",
      "baseline": 2
    },
    {
      "id": "quality",
      "label": "Quality",
      "baseline": 1
    },
    {
      "id": "conservation",
      "label": "Conservation",
      "baseline": 1
    },
    {
      "id": "billing",
      "label": "Billing",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "gallons_per_day",
    "label": "Gallons per day",
    "unit": "gal/day",
    "target": 50,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 200,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "supply",
      "label": "Supply",
      "categories": [
        "supply"
      ]
    },
    {
      "id": "quality",
      "label": "Quality",
      "categories": [
        "quality"
      ]
    },
    {
      "id": "conservation",
      "label": "Conservation",
      "categories": [
        "conservation"
      ]
    },
    {
      "id": "billing",
      "label": "Billing",
      "categories": [
        "billing"
      ]
    }
  ],
  "sample": [
    {
      "id": "water_district_plan-water-supply",
      "name": "Water supply",
      "category": "supply",
      "tags": [
        "supply"
      ],
      "cost": 0,
      "quantity": 60,
      "condition": "fair"
    },
    {
      "id": "water_district_plan-quality-test",
      "name": "Quality test",
      "category": "quality",
      "tags": [
        "quality"
      ],
      "cost": 80,
      "quantity": 1,
      "condition": "new"
    },
    {
      "id": "water_district_plan-conservation-kit",
      "name": "Conservation kit",
      "category": "conservation",
      "tags": [
        "conservation"
      ],
      "cost": 0,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "water_district_plan-water-bill",
      "name": "Water bill",
      "category": "billing",
      "tags": [
        "billing"
      ],
      "cost": 0,
      "quantity": 55,
      "condition": "fair"
    }
  ]
}
