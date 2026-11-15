import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "earthquake-soft-story-cost-mcp",
  "title": "Soft Story Budget Audit",
  "description": "Audit soft story budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "soft_story_budget",
  "entity": "soft-story item budget line",
  "categories": [
    {
      "id": "garage",
      "label": "Garage",
      "baseline": 2
    },
    {
      "id": "bracing",
      "label": "Bracing",
      "baseline": 1
    },
    {
      "id": "foundation",
      "label": "Foundation",
      "baseline": 1
    },
    {
      "id": "inspection",
      "label": "Inspection",
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
    "budget": 4350,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "garage",
      "label": "Garage",
      "categories": [
        "garage"
      ]
    },
    {
      "id": "bracing",
      "label": "Bracing",
      "categories": [
        "bracing"
      ]
    },
    {
      "id": "foundation",
      "label": "Foundation",
      "categories": [
        "foundation"
      ]
    },
    {
      "id": "inspection",
      "label": "Inspection",
      "categories": [
        "inspection"
      ]
    }
  ],
  "sample": [
    {
      "id": "soft_story_budget-structural-engineer",
      "name": "Structural engineer",
      "category": "garage",
      "tags": [
        "budget"
      ],
      "cost": 600,
      "quantity": 600,
      "condition": "new"
    },
    {
      "id": "soft_story_budget-steel-bracing",
      "name": "Steel bracing",
      "category": "bracing",
      "tags": [
        "budget"
      ],
      "cost": 1800,
      "quantity": 1800,
      "condition": "new"
    },
    {
      "id": "soft_story_budget-foundation-repair",
      "name": "Foundation repair",
      "category": "foundation",
      "tags": [
        "budget"
      ],
      "cost": 900,
      "quantity": 900,
      "condition": "new"
    },
    {
      "id": "soft_story_budget-permit",
      "name": "Permit",
      "category": "inspection",
      "tags": [
        "budget"
      ],
      "cost": 300,
      "quantity": 300,
      "condition": "new"
    }
  ]
}
