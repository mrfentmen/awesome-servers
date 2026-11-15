import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "disaster-go-bag-cost-mcp",
  "title": "Go Bag Budget Audit",
  "description": "Audit go bag budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "go_bag_budget",
  "entity": "go-bag item budget line",
  "categories": [
    {
      "id": "water",
      "label": "Water",
      "baseline": 1
    },
    {
      "id": "food",
      "label": "Food",
      "baseline": 2
    },
    {
      "id": "medical",
      "label": "Medical",
      "baseline": 2
    },
    {
      "id": "light",
      "label": "Light",
      "baseline": 1
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
    "budget": 150,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "water",
      "label": "Drinking water",
      "categories": [
        "water"
      ]
    },
    {
      "id": "food",
      "label": "Food supply",
      "categories": [
        "food"
      ]
    },
    {
      "id": "medical",
      "label": "Medical supply",
      "categories": [
        "medical"
      ]
    },
    {
      "id": "light",
      "label": "Light source",
      "categories": [
        "light"
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
      "id": "go_bag_budget-water-pouches",
      "name": "Water pouches",
      "category": "water",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "new"
    },
    {
      "id": "go_bag_budget-energy-bars",
      "name": "Energy bars",
      "category": "food",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "good"
    },
    {
      "id": "go_bag_budget-first-aid-kit",
      "name": "First aid kit",
      "category": "medical",
      "tags": [
        "budget"
      ],
      "cost": 35,
      "quantity": 35,
      "condition": "new"
    },
    {
      "id": "go_bag_budget-hand-crank-flashlight",
      "name": "Hand crank flashlight",
      "category": "light",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "new"
    },
    {
      "id": "go_bag_budget-multi-tool",
      "name": "Multi-tool",
      "category": "tools",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "good"
    }
  ]
}
