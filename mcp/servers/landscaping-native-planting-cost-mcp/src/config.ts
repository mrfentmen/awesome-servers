import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "landscaping-native-planting-cost-mcp",
  "title": "Native Planting Budget Audit",
  "description": "Audit native planting budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "native_planting_budget",
  "entity": "planting budget line",
  "categories": [
    {
      "id": "shrub",
      "label": "Shrubs",
      "baseline": 3
    },
    {
      "id": "perennial",
      "label": "Perennials",
      "baseline": 4
    },
    {
      "id": "grass",
      "label": "Grasses",
      "baseline": 2
    },
    {
      "id": "tree",
      "label": "Trees",
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
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "shrub",
      "label": "Shrub layer",
      "categories": [
        "shrub"
      ]
    },
    {
      "id": "perennial",
      "label": "Perennial layer",
      "categories": [
        "perennial"
      ]
    },
    {
      "id": "grass",
      "label": "Grass layer",
      "categories": [
        "grass"
      ]
    },
    {
      "id": "tree",
      "label": "Canopy layer",
      "categories": [
        "tree"
      ]
    }
  ],
  "sample": [
    {
      "id": "native_planting_budget-native-shrub",
      "name": "Native shrub",
      "category": "shrub",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "native_planting_budget-native-perennial",
      "name": "Native perennial",
      "category": "perennial",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "good"
    },
    {
      "id": "native_planting_budget-native-grass",
      "name": "Native grass",
      "category": "grass",
      "tags": [
        "budget"
      ],
      "cost": 10,
      "quantity": 10,
      "condition": "new"
    },
    {
      "id": "native_planting_budget-native-tree-sapling",
      "name": "Native tree sapling",
      "category": "tree",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "fair"
    },
    {
      "id": "native_planting_budget-native-groundcover",
      "name": "Native groundcover",
      "category": "perennial",
      "tags": [
        "budget"
      ],
      "cost": 8,
      "quantity": 8,
      "condition": "good"
    }
  ]
}
