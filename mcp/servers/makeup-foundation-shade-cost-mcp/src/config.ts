import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "makeup-foundation-shade-cost-mcp",
  "title": "Foundation Shade Budget Audit",
  "description": "Audit foundation shade budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "foundation_shade_budget",
  "entity": "foundation product budget line",
  "categories": [
    {
      "id": "liquid",
      "label": "Liquid",
      "baseline": 2
    },
    {
      "id": "stick",
      "label": "Stick",
      "baseline": 1
    },
    {
      "id": "powder",
      "label": "Powder",
      "baseline": 1
    },
    {
      "id": "tint",
      "label": "Tinted base",
      "baseline": 2
    },
    {
      "id": "tool",
      "label": "Tools",
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
    "budget": 250,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "base",
      "label": "Base coverage",
      "categories": [
        "liquid",
        "stick",
        "powder"
      ]
    },
    {
      "id": "tint",
      "label": "Tinted base",
      "categories": [
        "tint"
      ]
    },
    {
      "id": "tool",
      "label": "Application tool",
      "categories": [
        "tool"
      ]
    }
  ],
  "sample": [
    {
      "id": "foundation_shade_budget-liquid-foundation",
      "name": "Liquid foundation",
      "category": "liquid",
      "tags": [
        "budget"
      ],
      "cost": 45,
      "quantity": 45,
      "condition": "good"
    },
    {
      "id": "foundation_shade_budget-liquid-concealer",
      "name": "Liquid concealer",
      "category": "liquid",
      "tags": [
        "budget"
      ],
      "cost": 28,
      "quantity": 28,
      "condition": "good"
    },
    {
      "id": "foundation_shade_budget-cream-stick",
      "name": "Cream stick",
      "category": "stick",
      "tags": [
        "budget"
      ],
      "cost": 32,
      "quantity": 32,
      "condition": "fair"
    },
    {
      "id": "foundation_shade_budget-loose-powder",
      "name": "Loose powder",
      "category": "powder",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "good"
    },
    {
      "id": "foundation_shade_budget-skin-tint",
      "name": "Skin tint",
      "category": "tint",
      "tags": [
        "budget"
      ],
      "cost": 36,
      "quantity": 36,
      "condition": "good"
    },
    {
      "id": "foundation_shade_budget-foundation-brush",
      "name": "Foundation brush",
      "category": "tool",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "good"
    }
  ]
}
