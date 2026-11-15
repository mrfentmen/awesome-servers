import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "makeup-look-recreate-cost-mcp",
  "title": "Look Recreation Budget Audit",
  "description": "Audit look recreation budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "look_recreate_budget",
  "entity": "look product budget line",
  "categories": [
    {
      "id": "base",
      "label": "Base",
      "baseline": 1
    },
    {
      "id": "eye",
      "label": "Eyes",
      "baseline": 2
    },
    {
      "id": "lip",
      "label": "Lips",
      "baseline": 1
    },
    {
      "id": "cheek",
      "label": "Cheeks",
      "baseline": 1
    },
    {
      "id": "tool",
      "label": "Tools",
      "baseline": 1
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
    "budget": 250,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "base",
      "label": "Complexion",
      "categories": [
        "base"
      ]
    },
    {
      "id": "eye",
      "label": "Eye look",
      "categories": [
        "eye"
      ]
    },
    {
      "id": "lip",
      "label": "Lip colour",
      "categories": [
        "lip"
      ]
    },
    {
      "id": "cheek",
      "label": "Cheek colour",
      "categories": [
        "cheek"
      ]
    }
  ],
  "sample": [
    {
      "id": "look_recreate_budget-matte-foundation",
      "name": "Matte foundation",
      "category": "base",
      "tags": [
        "budget"
      ],
      "cost": 42,
      "quantity": 42,
      "condition": "good"
    },
    {
      "id": "look_recreate_budget-shadow-palette",
      "name": "Shadow palette",
      "category": "eye",
      "tags": [
        "budget"
      ],
      "cost": 38,
      "quantity": 38,
      "condition": "good"
    },
    {
      "id": "look_recreate_budget-liquid-liner",
      "name": "Liquid liner",
      "category": "eye",
      "tags": [
        "budget"
      ],
      "cost": 22,
      "quantity": 22,
      "condition": "good"
    },
    {
      "id": "look_recreate_budget-red-lipstick",
      "name": "Red lipstick",
      "category": "lip",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "good"
    },
    {
      "id": "look_recreate_budget-cream-blush",
      "name": "Cream blush",
      "category": "cheek",
      "tags": [
        "budget"
      ],
      "cost": 28,
      "quantity": 28,
      "condition": "good"
    },
    {
      "id": "look_recreate_budget-blending-brush",
      "name": "Blending brush",
      "category": "tool",
      "tags": [
        "budget"
      ],
      "cost": 18,
      "quantity": 18,
      "condition": "good"
    }
  ]
}
