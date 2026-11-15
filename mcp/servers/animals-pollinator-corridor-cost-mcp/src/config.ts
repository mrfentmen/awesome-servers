import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "animals-pollinator-corridor-cost-mcp",
  "title": "Pollinator Corridor Budget Audit",
  "description": "Audit pollinator corridor budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "pollinator_corridor_budget",
  "entity": "corridor patch budget line",
  "categories": [
    {
      "id": "patches",
      "label": "Patches",
      "baseline": 2
    },
    {
      "id": "bloom",
      "label": "Bloom",
      "baseline": 1
    },
    {
      "id": "nesting",
      "label": "Nesting",
      "baseline": 1
    },
    {
      "id": "pesticide",
      "label": "Pesticide",
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
      "id": "patches",
      "label": "Patches",
      "categories": [
        "patches"
      ]
    },
    {
      "id": "bloom",
      "label": "Bloom",
      "categories": [
        "bloom"
      ]
    },
    {
      "id": "nesting",
      "label": "Nesting",
      "categories": [
        "nesting"
      ]
    },
    {
      "id": "pesticide",
      "label": "Pesticide",
      "categories": [
        "pesticide"
      ]
    }
  ],
  "sample": [
    {
      "id": "pollinator_corridor_budget_budget-seed-mix",
      "name": "Seed mix",
      "category": "patches",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "new"
    },
    {
      "id": "pollinator_corridor_budget_budget-nesting-block",
      "name": "Nesting block",
      "category": "bloom",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "new"
    },
    {
      "id": "pollinator_corridor_budget_budget-water-station",
      "name": "Water station",
      "category": "nesting",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "new"
    },
    {
      "id": "pollinator_corridor_budget_budget-signage",
      "name": "Signage",
      "category": "pesticide",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "new"
    }
  ]
}
