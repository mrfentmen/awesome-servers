import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "food-recipe-scaling-check-mcp",
  "title": "Recipe Scaling Audit",
  "description": "Audit recipe ingredients for servings, cost, coverage and scaling gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "recipe_scaling",
  "entity": "recipe ingredient",
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
    "id": "service_gap",
    "label": "Servings",
    "unit": "servings",
    "target": 4,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 80,
    "coverage": 0.75,
    "expiryDays": 30
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
      "id": "recipe-rice",
      "name": "Jasmine rice",
      "category": "base",
      "tags": [
        "staple"
      ],
      "cost": 3,
      "quantity": 6,
      "expires": "2027-12-01",
      "condition": "new"
    },
    {
      "id": "recipe-chicken",
      "name": "Chicken thighs",
      "category": "protein",
      "tags": [
        "fresh"
      ],
      "cost": 8,
      "quantity": 4,
      "expires": "2026-11-20",
      "condition": "good"
    },
    {
      "id": "recipe-salt",
      "name": "Sea salt",
      "category": "seasoning",
      "tags": [
        "basic"
      ],
      "cost": 2,
      "quantity": 1,
      "expires": "2028-01-01",
      "condition": "new"
    },
    {
      "id": "recipe-stock",
      "name": "Chicken stock",
      "category": "liquid",
      "tags": [
        "stock"
      ],
      "cost": 3,
      "quantity": 8,
      "expires": "2026-12-15",
      "condition": "good"
    }
  ]
}
