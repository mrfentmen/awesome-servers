import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "cats-litter-box-cost-mcp",
  "title": "Litter Box Budget Audit",
  "description": "Audit litter box budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "litter_box_budget",
  "entity": "litter item budget line",
  "categories": [
    {
      "id": "litter",
      "label": "Litter",
      "baseline": 2
    },
    {
      "id": "box",
      "label": "Boxes",
      "baseline": 1
    },
    {
      "id": "scoop",
      "label": "Scoops",
      "baseline": 1
    },
    {
      "id": "deodorizer",
      "label": "Deodorizer",
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
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "litter",
      "label": "Litter",
      "categories": [
        "litter"
      ]
    },
    {
      "id": "box",
      "label": "Box",
      "categories": [
        "box"
      ]
    },
    {
      "id": "scoop",
      "label": "Scoop",
      "categories": [
        "scoop"
      ]
    }
  ],
  "sample": [
    {
      "id": "litter_box_budget-clumping-litter",
      "name": "Clumping litter",
      "category": "litter",
      "tags": [
        "budget"
      ],
      "cost": 18,
      "quantity": 18,
      "condition": "new"
    },
    {
      "id": "litter_box_budget-open-litter-box",
      "name": "Open litter box",
      "category": "box",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "litter_box_budget-metal-scoop",
      "name": "Metal scoop",
      "category": "scoop",
      "tags": [
        "budget"
      ],
      "cost": 8,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "litter_box_budget-odor-absorber",
      "name": "Odor absorber",
      "category": "deodorizer",
      "tags": [
        "budget"
      ],
      "cost": 6,
      "quantity": 6,
      "condition": "fair"
    }
  ]
}
