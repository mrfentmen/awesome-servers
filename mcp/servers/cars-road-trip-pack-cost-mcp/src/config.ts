import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "cars-road-trip-pack-cost-mcp",
  "title": "Road Trip Pack Budget Audit",
  "description": "Audit road trip pack budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "road_trip_pack_budget",
  "entity": "pack item budget line",
  "categories": [
    {
      "id": "docs",
      "label": "Documents",
      "baseline": 2
    },
    {
      "id": "safety",
      "label": "Safety",
      "baseline": 2
    },
    {
      "id": "snacks",
      "label": "Snacks",
      "baseline": 2
    },
    {
      "id": "tools",
      "label": "Tools",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 100,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "docs",
      "label": "Documents",
      "categories": [
        "docs"
      ]
    },
    {
      "id": "safety",
      "label": "Safety kit",
      "categories": [
        "safety"
      ]
    },
    {
      "id": "snacks",
      "label": "Snacks",
      "categories": [
        "snacks"
      ]
    },
    {
      "id": "tools",
      "label": "Tools",
      "categories": [
        "tools"
      ]
    }
  ],
  "sample": [
    {
      "id": "road_trip_pack_budget-insurance-and-licence",
      "name": "Insurance and licence",
      "category": "docs",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "road_trip_pack_budget-first-aid-kit",
      "name": "First aid kit",
      "category": "safety",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "good"
    },
    {
      "id": "road_trip_pack_budget-snack-box",
      "name": "Snack box",
      "category": "snacks",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "good"
    },
    {
      "id": "road_trip_pack_budget-tire-repair-kit",
      "name": "Tire repair kit",
      "category": "tools",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    }
  ]
}
