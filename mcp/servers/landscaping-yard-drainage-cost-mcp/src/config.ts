import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "landscaping-yard-drainage-cost-mcp",
  "title": "Yard Drainage Budget Audit",
  "description": "Audit yard drainage budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "yard_drainage_budget",
  "entity": "drainage item budget line",
  "categories": [
    {
      "id": "gutter",
      "label": "Gutters",
      "baseline": 3
    },
    {
      "id": "drain",
      "label": "Drains",
      "baseline": 2
    },
    {
      "id": "soakaway",
      "label": "Soakaways",
      "baseline": 2
    },
    {
      "id": "barrel",
      "label": "Barrels",
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
    "budget": 450,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "gutter",
      "label": "Gutter run",
      "categories": [
        "gutter"
      ]
    },
    {
      "id": "drain",
      "label": "Drain",
      "categories": [
        "drain"
      ]
    },
    {
      "id": "soakaway",
      "label": "Soakaway",
      "categories": [
        "soakaway"
      ]
    },
    {
      "id": "barrel",
      "label": "Water barrel",
      "categories": [
        "barrel"
      ]
    }
  ],
  "sample": [
    {
      "id": "yard_drainage_budget-front-gutter-run",
      "name": "Front gutter run",
      "category": "gutter",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "good"
    },
    {
      "id": "yard_drainage_budget-patio-drain",
      "name": "Patio drain",
      "category": "drain",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "fair"
    },
    {
      "id": "yard_drainage_budget-soakaway",
      "name": "Soakaway",
      "category": "soakaway",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "fair"
    },
    {
      "id": "yard_drainage_budget-rain-barrel",
      "name": "Rain barrel",
      "category": "barrel",
      "tags": [
        "budget"
      ],
      "cost": 90,
      "quantity": 90,
      "condition": "good"
    }
  ]
}
