import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "skincare-ingredient-stack-check-mcp",
  "title": "Skincare Ingredient Stack Audit",
  "description": "Audit a skincare routine for active-ingredient overlap, missing steps, duplicate products and shelf-life risk. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "ingredient_stack",
  "entity": "skincare product",
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
    "id": "active_overlap",
    "label": "Active overlap",
    "unit": "duplicate tags",
    "target": 0,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 500,
    "coverage": 0.8,
    "expiryDays": 60
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
      "id": "skin-cleanser",
      "name": "Gentle gel cleanser",
      "category": "cleanser",
      "tags": [
        "gentle"
      ],
      "cost": 18,
      "quantity": 1,
      "acquired": "2026-05-01",
      "expires": "2027-05-01",
      "condition": "good"
    },
    {
      "id": "skin-retinol",
      "name": "Retinol serum",
      "category": "treatment",
      "tags": [
        "retinol"
      ],
      "cost": 40,
      "quantity": 1,
      "acquired": "2026-08-01",
      "expires": "2027-02-01",
      "condition": "good"
    },
    {
      "id": "skin-vitc",
      "name": "Vitamin C serum",
      "category": "treatment",
      "tags": [
        "vitamin-c"
      ],
      "cost": 35,
      "quantity": 1,
      "acquired": "2026-09-01",
      "expires": "2027-03-01",
      "condition": "good"
    },
    {
      "id": "skin-niacinamide",
      "name": "Niacinamide serum",
      "category": "treatment",
      "tags": [
        "niacinamide"
      ],
      "cost": 22,
      "quantity": 1,
      "acquired": "2026-07-01",
      "expires": "2027-01-01",
      "condition": "good"
    },
    {
      "id": "skin-moisturizer",
      "name": "Ceramide cream",
      "category": "moisturizer",
      "tags": [
        "ceramide"
      ],
      "cost": 28,
      "quantity": 1,
      "acquired": "2026-06-01",
      "expires": "2027-06-01",
      "condition": "good"
    },
    {
      "id": "skin-spf",
      "name": "Mineral SPF 50",
      "category": "spf",
      "tags": [
        "spf"
      ],
      "cost": 24,
      "quantity": 1,
      "acquired": "2026-05-01",
      "expires": "2027-05-01",
      "condition": "good"
    },
    {
      "id": "skin-retinol-night",
      "name": "Retinol night cream",
      "category": "treatment",
      "tags": [
        "retinol"
      ],
      "cost": 38,
      "quantity": 1,
      "acquired": "2026-04-01",
      "expires": "2026-12-01",
      "condition": "fair"
    }
  ]
}
