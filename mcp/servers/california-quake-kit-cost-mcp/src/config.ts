import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "california-quake-kit-cost-mcp",
  "title": "Earthquake Kit Budget Audit",
  "description": "Audit earthquake kit budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "quake_kit_budget",
  "entity": "kit item budget line",
  "categories": [
    {
      "id": "water",
      "label": "Water",
      "baseline": 2
    },
    {
      "id": "food",
      "label": "Food",
      "baseline": 1
    },
    {
      "id": "tools",
      "label": "Tools",
      "baseline": 1
    },
    {
      "id": "docs",
      "label": "Docs",
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
    "budget": 250,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "water",
      "label": "Water",
      "categories": [
        "water"
      ]
    },
    {
      "id": "food",
      "label": "Food",
      "categories": [
        "food"
      ]
    },
    {
      "id": "tools",
      "label": "Tools",
      "categories": [
        "tools"
      ]
    },
    {
      "id": "docs",
      "label": "Docs",
      "categories": [
        "docs"
      ]
    }
  ],
  "sample": [
    {
      "id": "quake_kit_budget-drinking-water",
      "name": "Drinking water",
      "category": "water",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "new"
    },
    {
      "id": "quake_kit_budget-emergency-food",
      "name": "Emergency food",
      "category": "food",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "new"
    },
    {
      "id": "quake_kit_budget-multi-tool",
      "name": "Multi-tool",
      "category": "tools",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    },
    {
      "id": "quake_kit_budget-document-copies",
      "name": "Document copies",
      "category": "docs",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
