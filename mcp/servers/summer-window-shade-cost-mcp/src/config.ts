import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "summer-window-shade-cost-mcp",
  "title": "Window Shade Budget Audit",
  "description": "Audit window shade budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "window_shade_budget",
  "entity": "window shade budget line",
  "categories": [
    {
      "id": "east",
      "label": "East",
      "baseline": 2
    },
    {
      "id": "south",
      "label": "South",
      "baseline": 1
    },
    {
      "id": "west",
      "label": "West",
      "baseline": 1
    },
    {
      "id": "exterior",
      "label": "Exterior",
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
    "budget": 700,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "east",
      "label": "East",
      "categories": [
        "east"
      ]
    },
    {
      "id": "south",
      "label": "South",
      "categories": [
        "south"
      ]
    },
    {
      "id": "west",
      "label": "West",
      "categories": [
        "west"
      ]
    },
    {
      "id": "exterior",
      "label": "Exterior",
      "categories": [
        "exterior"
      ]
    }
  ],
  "sample": [
    {
      "id": "window_shade_budget-east-blinds",
      "name": "East blinds",
      "category": "east",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "new"
    },
    {
      "id": "window_shade_budget-south-shade",
      "name": "South shade",
      "category": "south",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    },
    {
      "id": "window_shade_budget-west-awning",
      "name": "West awning",
      "category": "west",
      "tags": [
        "budget"
      ],
      "cost": 300,
      "quantity": 300,
      "condition": "new"
    },
    {
      "id": "window_shade_budget-exterior-shade",
      "name": "Exterior shade",
      "category": "exterior",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "new"
    }
  ]
}
