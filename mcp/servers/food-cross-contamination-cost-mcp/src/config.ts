import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "food-cross-contamination-cost-mcp",
  "title": "Cross Contamination Budget Audit",
  "description": "Audit cross contamination budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "cross_contamination_budget",
  "entity": "kitchen item budget line",
  "categories": [
    {
      "id": "board",
      "label": "Cutting boards",
      "baseline": 2
    },
    {
      "id": "knife",
      "label": "Knives",
      "baseline": 3
    },
    {
      "id": "container",
      "label": "Containers",
      "baseline": 3
    },
    {
      "id": "fridge",
      "label": "Fridge storage",
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
    "budget": 100,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "prep",
      "label": "Preparation surface",
      "categories": [
        "board",
        "knife"
      ]
    },
    {
      "id": "storage",
      "label": "Storage",
      "categories": [
        "container",
        "fridge"
      ]
    }
  ],
  "sample": [
    {
      "id": "cross_contamination_budget-raw-meat-board",
      "name": "Raw meat board",
      "category": "board",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "fair"
    },
    {
      "id": "cross_contamination_budget-vegetable-board",
      "name": "Vegetable board",
      "category": "board",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "good"
    },
    {
      "id": "cross_contamination_budget-raw-prep-knife",
      "name": "Raw prep knife",
      "category": "knife",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "cross_contamination_budget-sealed-container",
      "name": "Sealed container",
      "category": "container",
      "tags": [
        "budget"
      ],
      "cost": 8,
      "quantity": 8,
      "condition": "new"
    },
    {
      "id": "cross_contamination_budget-fridge-shelf",
      "name": "Fridge shelf",
      "category": "fridge",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    }
  ]
}
