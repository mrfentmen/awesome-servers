import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "summer-summer-wardrobe-plan-mcp",
  "title": "Summer Wardrobe Planning Audit",
  "description": "Plan summer wardrobe by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "summer_wardrobe_plan",
  "entity": "summer item plan",
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
    "id": "light_layers",
    "label": "Light layers",
    "unit": "items",
    "target": 4,
    "direction": "higher"
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
      "id": "summer_wardrobe_plan-linen-shirt",
      "name": "Linen shirt",
      "category": "top",
      "tags": [
        "top"
      ],
      "cost": 60,
      "quantity": 3,
      "condition": "good"
    },
    {
      "id": "summer_wardrobe_plan-shorts",
      "name": "Shorts",
      "category": "bottom",
      "tags": [
        "bottom"
      ],
      "cost": 40,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "summer_wardrobe_plan-sun-hat",
      "name": "Sun hat",
      "category": "hat",
      "tags": [
        "hat"
      ],
      "cost": 25,
      "quantity": 1,
      "condition": "new"
    },
    {
      "id": "summer_wardrobe_plan-sunglasses",
      "name": "Sunglasses",
      "category": "sun",
      "tags": [
        "sun"
      ],
      "cost": 30,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
