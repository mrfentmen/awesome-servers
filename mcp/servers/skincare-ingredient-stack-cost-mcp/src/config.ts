import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "skincare-ingredient-stack-cost-mcp",
  "title": "Skincare Ingredient Stack Budget Audit",
  "description": "Audit skincare ingredient stack budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "ingredient_stack_budget",
  "entity": "skincare product budget line",
  "categories": [
    {
      "id": "cleanser",
      "label": "Cleansers",
      "baseline": 2
    },
    {
      "id": "treatment",
      "label": "Treatments",
      "baseline": 3
    },
    {
      "id": "moisturizer",
      "label": "Moisturizers",
      "baseline": 2
    },
    {
      "id": "spf",
      "label": "SPF",
      "baseline": 2
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
      "id": "cleanse",
      "label": "Cleansing step",
      "categories": [
        "cleanser"
      ]
    },
    {
      "id": "treat",
      "label": "Treatment step",
      "categories": [
        "treatment"
      ]
    },
    {
      "id": "moisturize",
      "label": "Moisturizing step",
      "categories": [
        "moisturizer"
      ]
    },
    {
      "id": "protect",
      "label": "Sun protection",
      "categories": [
        "spf"
      ]
    }
  ],
  "sample": [
    {
      "id": "ingredient_stack_budget-gentle-gel-cleanser",
      "name": "Gentle gel cleanser",
      "category": "cleanser",
      "tags": [
        "budget"
      ],
      "cost": 18,
      "quantity": 18,
      "condition": "good"
    },
    {
      "id": "ingredient_stack_budget-retinol-serum",
      "name": "Retinol serum",
      "category": "treatment",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "good"
    },
    {
      "id": "ingredient_stack_budget-vitamin-c-serum",
      "name": "Vitamin C serum",
      "category": "treatment",
      "tags": [
        "budget"
      ],
      "cost": 35,
      "quantity": 35,
      "condition": "good"
    },
    {
      "id": "ingredient_stack_budget-niacinamide-serum",
      "name": "Niacinamide serum",
      "category": "treatment",
      "tags": [
        "budget"
      ],
      "cost": 22,
      "quantity": 22,
      "condition": "good"
    },
    {
      "id": "ingredient_stack_budget-ceramide-cream",
      "name": "Ceramide cream",
      "category": "moisturizer",
      "tags": [
        "budget"
      ],
      "cost": 28,
      "quantity": 28,
      "condition": "good"
    },
    {
      "id": "ingredient_stack_budget-mineral-spf-50",
      "name": "Mineral SPF 50",
      "category": "spf",
      "tags": [
        "budget"
      ],
      "cost": 24,
      "quantity": 24,
      "condition": "good"
    },
    {
      "id": "ingredient_stack_budget-retinol-night-cream",
      "name": "Retinol night cream",
      "category": "treatment",
      "tags": [
        "budget"
      ],
      "cost": 38,
      "quantity": 38,
      "condition": "fair"
    }
  ]
}
