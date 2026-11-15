import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "petco-product-fit-cost-mcp",
  "title": "Pet Product Fit Budget Audit",
  "description": "Audit pet product fit budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "product_fit_budget",
  "entity": "pet product budget line",
  "categories": [
    {
      "id": "food",
      "label": "Food",
      "baseline": 1
    },
    {
      "id": "toy",
      "label": "Toys",
      "baseline": 1
    },
    {
      "id": "bed",
      "label": "Beds",
      "baseline": 1
    },
    {
      "id": "harness",
      "label": "Harnesses",
      "baseline": 1
    },
    {
      "id": "grooming",
      "label": "Grooming",
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
    "budget": 300,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "nutrition",
      "label": "Nutrition",
      "categories": [
        "food"
      ]
    },
    {
      "id": "play",
      "label": "Play",
      "categories": [
        "toy"
      ]
    },
    {
      "id": "rest",
      "label": "Rest",
      "categories": [
        "bed"
      ]
    },
    {
      "id": "walking",
      "label": "Walking",
      "categories": [
        "harness"
      ]
    },
    {
      "id": "coat",
      "label": "Coat care",
      "categories": [
        "grooming"
      ]
    }
  ],
  "sample": [
    {
      "id": "product_fit_budget-adult-dog-food",
      "name": "Adult dog food",
      "category": "food",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "good"
    },
    {
      "id": "product_fit_budget-chew-toy",
      "name": "Chew toy",
      "category": "toy",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "fair"
    },
    {
      "id": "product_fit_budget-orthopedic-bed",
      "name": "Orthopedic bed",
      "category": "bed",
      "tags": [
        "budget"
      ],
      "cost": 90,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "product_fit_budget-no-pull-harness",
      "name": "No-pull harness",
      "category": "harness",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "fair"
    },
    {
      "id": "product_fit_budget-slicker-brush",
      "name": "Slicker brush",
      "category": "grooming",
      "tags": [
        "budget"
      ],
      "cost": 18,
      "quantity": 18,
      "condition": "good"
    },
    {
      "id": "product_fit_budget-cat-wand",
      "name": "Cat wand",
      "category": "toy",
      "tags": [
        "budget"
      ],
      "cost": 10,
      "quantity": 10,
      "condition": "fair"
    }
  ]
}
