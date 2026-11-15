import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "earthquake-emergency-water-cost-mcp",
  "title": "Emergency Water Budget Audit",
  "description": "Audit emergency water budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "emergency_water_budget",
  "entity": "water item budget line",
  "categories": [
    {
      "id": "storage",
      "label": "Storage",
      "baseline": 2
    },
    {
      "id": "treatment",
      "label": "Treatment",
      "baseline": 1
    },
    {
      "id": "container",
      "label": "Container",
      "baseline": 1
    },
    {
      "id": "plan",
      "label": "Plan",
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
      "id": "storage",
      "label": "Storage",
      "categories": [
        "storage"
      ]
    },
    {
      "id": "treatment",
      "label": "Treatment",
      "categories": [
        "treatment"
      ]
    },
    {
      "id": "container",
      "label": "Container",
      "categories": [
        "container"
      ]
    },
    {
      "id": "plan",
      "label": "Plan",
      "categories": [
        "plan"
      ]
    }
  ],
  "sample": [
    {
      "id": "emergency_water_budget-drinking-water",
      "name": "Drinking water",
      "category": "storage",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "new"
    },
    {
      "id": "emergency_water_budget-water-filter",
      "name": "Water filter",
      "category": "treatment",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    },
    {
      "id": "emergency_water_budget-jerry-cans",
      "name": "Jerry cans",
      "category": "container",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "new"
    },
    {
      "id": "emergency_water_budget-water-plan",
      "name": "Water plan",
      "category": "plan",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
