import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "petco-product-fit-match-mcp",
  "title": "Pet Product Fit Match Audit",
  "description": "Match pet product fit by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "product_fit_match",
  "entity": "pet product match",
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
    "id": "fit_score",
    "label": "Fit score",
    "unit": "%",
    "target": 85,
    "direction": "higher"
  },
  "target": {
    "maxItems": 25,
    "budget": 500,
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
      "id": "product_fit_match-food",
      "name": "Adult dog food",
      "category": "food",
      "tags": [
        "large-breed",
        "chicken"
      ],
      "cost": 60,
      "quantity": 92,
      "condition": "good"
    },
    {
      "id": "product_fit_match-toy",
      "name": "Chew toy",
      "category": "toy",
      "tags": [
        "tough",
        "medium"
      ],
      "cost": 15,
      "quantity": 78,
      "condition": "fair"
    },
    {
      "id": "product_fit_match-bed",
      "name": "Orthopedic bed",
      "category": "bed",
      "tags": [
        "large",
        "washable"
      ],
      "cost": 90,
      "quantity": 88,
      "condition": "good"
    },
    {
      "id": "product_fit_match-harness",
      "name": "No-pull harness",
      "category": "harness",
      "tags": [
        "large",
        "adjustable"
      ],
      "cost": 40,
      "quantity": 82,
      "condition": "fair"
    },
    {
      "id": "product_fit_match-brush",
      "name": "Slicker brush",
      "category": "grooming",
      "tags": [
        "long-hair",
        "daily"
      ],
      "cost": 18,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "product_fit_match-cat-toy",
      "name": "Cat wand",
      "category": "toy",
      "tags": [
        "cat",
        "interactive"
      ],
      "cost": 10,
      "quantity": 70,
      "condition": "fair"
    }
  ]
}
