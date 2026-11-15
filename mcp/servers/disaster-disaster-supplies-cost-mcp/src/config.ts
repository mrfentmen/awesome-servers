import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "disaster-disaster-supplies-cost-mcp",
  "title": "Disaster Supplies Budget Audit",
  "description": "Audit disaster supplies budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "disaster_supplies_budget",
  "entity": "emergency supply budget line",
  "categories": [
    {
      "id": "water",
      "label": "Water",
      "baseline": 2
    },
    {
      "id": "food",
      "label": "Food",
      "baseline": 3
    },
    {
      "id": "medical",
      "label": "Medical",
      "baseline": 2
    },
    {
      "id": "power",
      "label": "Power",
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
    "budget": 200,
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
      "id": "power",
      "label": "Power supply",
      "categories": [
        "power"
      ]
    }
  ],
  "sample": [
    {
      "id": "disaster_supplies_budget-case-of-water",
      "name": "Case of water",
      "category": "water",
      "tags": [
        "budget"
      ],
      "cost": 8,
      "quantity": 8,
      "condition": "new"
    },
    {
      "id": "disaster_supplies_budget-canned-soup",
      "name": "Canned soup",
      "category": "food",
      "tags": [
        "budget"
      ],
      "cost": 3,
      "quantity": 3,
      "condition": "new"
    },
    {
      "id": "disaster_supplies_budget-trauma-kit",
      "name": "Trauma kit",
      "category": "medical",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    },
    {
      "id": "disaster_supplies_budget-battery-bank",
      "name": "Battery bank",
      "category": "power",
      "tags": [
        "budget"
      ],
      "cost": 50,
      "quantity": 50,
      "condition": "good"
    },
    {
      "id": "disaster_supplies_budget-hand-crank-radio",
      "name": "Hand crank radio",
      "category": "tools",
      "tags": [
        "budget"
      ],
      "cost": 35,
      "quantity": 35,
      "condition": "new"
    }
  ]
}
