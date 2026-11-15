import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "summer-summer-wardrobe-cost-mcp",
  "title": "Summer Wardrobe Budget Audit",
  "description": "Audit summer wardrobe budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "summer_wardrobe_budget",
  "entity": "summer item budget line",
  "categories": [
    {
      "id": "top",
      "label": "Top",
      "baseline": 2
    },
    {
      "id": "bottom",
      "label": "Bottom",
      "baseline": 1
    },
    {
      "id": "hat",
      "label": "Hat",
      "baseline": 1
    },
    {
      "id": "sun",
      "label": "Sun",
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
    "budget": 200,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "top",
      "label": "Top",
      "categories": [
        "top"
      ]
    },
    {
      "id": "bottom",
      "label": "Bottom",
      "categories": [
        "bottom"
      ]
    },
    {
      "id": "hat",
      "label": "Hat",
      "categories": [
        "hat"
      ]
    },
    {
      "id": "sun",
      "label": "Sun",
      "categories": [
        "sun"
      ]
    }
  ],
  "sample": [
    {
      "id": "summer_wardrobe_budget-linen-shirts",
      "name": "Linen shirts",
      "category": "top",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "new"
    },
    {
      "id": "summer_wardrobe_budget-shorts",
      "name": "Shorts",
      "category": "bottom",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    },
    {
      "id": "summer_wardrobe_budget-sun-hat",
      "name": "Sun hat",
      "category": "hat",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "new"
    },
    {
      "id": "summer_wardrobe_budget-sunglasses",
      "name": "Sunglasses",
      "category": "sun",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "new"
    }
  ]
}
