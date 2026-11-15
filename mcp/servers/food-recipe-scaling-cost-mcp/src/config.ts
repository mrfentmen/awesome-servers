import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "food-recipe-scaling-cost-mcp",
  "title": "Recipe Scaling Budget Audit",
  "description": "Audit recipe scaling budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "recipe_scaling_budget",
  "entity": "recipe ingredient budget line",
  "categories": [
    {
      "id": "base",
      "label": "Base",
      "baseline": 3
    },
    {
      "id": "protein",
      "label": "Protein",
      "baseline": 3
    },
    {
      "id": "seasoning",
      "label": "Seasoning",
      "baseline": 3
    },
    {
      "id": "liquid",
      "label": "Liquid",
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
    "budget": 50,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "base",
      "label": "Base ingredient",
      "categories": [
        "base"
      ]
    },
    {
      "id": "protein",
      "label": "Protein",
      "categories": [
        "protein"
      ]
    },
    {
      "id": "seasoning",
      "label": "Seasoning",
      "categories": [
        "seasoning"
      ]
    },
    {
      "id": "liquid",
      "label": "Liquid",
      "categories": [
        "liquid"
      ]
    }
  ],
  "sample": [
    {
      "id": "recipe_scaling_budget-jasmine-rice",
      "name": "Jasmine rice",
      "category": "base",
      "tags": [
        "budget"
      ],
      "cost": 3,
      "quantity": 3,
      "condition": "new"
    },
    {
      "id": "recipe_scaling_budget-chicken-thighs",
      "name": "Chicken thighs",
      "category": "protein",
      "tags": [
        "budget"
      ],
      "cost": 8,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "recipe_scaling_budget-sea-salt",
      "name": "Sea salt",
      "category": "seasoning",
      "tags": [
        "budget"
      ],
      "cost": 2,
      "quantity": 2,
      "condition": "new"
    },
    {
      "id": "recipe_scaling_budget-chicken-stock",
      "name": "Chicken stock",
      "category": "liquid",
      "tags": [
        "budget"
      ],
      "cost": 3,
      "quantity": 3,
      "condition": "good"
    }
  ]
}
