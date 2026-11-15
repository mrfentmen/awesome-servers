import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "snow-ski-wax-cost-mcp",
  "title": "Ski Wax Budget Audit",
  "description": "Audit ski wax budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "ski_wax_budget",
  "entity": "wax item budget line",
  "categories": [
    {
      "id": "wax",
      "label": "Wax",
      "baseline": 2
    },
    {
      "id": "tool",
      "label": "Tool",
      "baseline": 1
    },
    {
      "id": "base",
      "label": "Base",
      "baseline": 1
    },
    {
      "id": "temperature",
      "label": "Temperature",
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
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "wax",
      "label": "Wax",
      "categories": [
        "wax"
      ]
    },
    {
      "id": "tool",
      "label": "Tool",
      "categories": [
        "tool"
      ]
    },
    {
      "id": "base",
      "label": "Base",
      "categories": [
        "base"
      ]
    },
    {
      "id": "temperature",
      "label": "Temperature",
      "categories": [
        "temperature"
      ]
    }
  ],
  "sample": [
    {
      "id": "ski_wax_budget-all-temp-wax",
      "name": "All-temp wax",
      "category": "wax",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "new"
    },
    {
      "id": "ski_wax_budget-wax-iron",
      "name": "Wax iron",
      "category": "tool",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "new"
    },
    {
      "id": "ski_wax_budget-base-cleaner",
      "name": "Base cleaner",
      "category": "base",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "new"
    },
    {
      "id": "ski_wax_budget-cold-wax",
      "name": "Cold wax",
      "category": "temperature",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "new"
    }
  ]
}
