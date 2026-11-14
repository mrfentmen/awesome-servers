import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "food-pantry-expiry-check-mcp",
  "title": "Pantry Expiry Audit",
  "description": "Audit pantry stock for expiry, category coverage, spend and missing meal dependencies. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "pantry_expiry",
  "entity": "pantry item",
  "categories": [
    {
      "id": "grain",
      "label": "Grains",
      "baseline": 4
    },
    {
      "id": "can",
      "label": "Canned goods",
      "baseline": 4
    },
    {
      "id": "fridge",
      "label": "Fridge items",
      "baseline": 4
    },
    {
      "id": "freezer",
      "label": "Freezer items",
      "baseline": 3
    },
    {
      "id": "spice",
      "label": "Spices",
      "baseline": 4
    }
  ],
  "metric": {
    "id": "days_to_expiry",
    "label": "Days to expiry",
    "unit": "days",
    "target": 30,
    "direction": "higher"
  },
  "target": {
    "maxItems": 40,
    "budget": 250,
    "coverage": 0.8,
    "expiryDays": 30
  },
  "dependencies": [
    {
      "id": "base",
      "label": "Base staple",
      "categories": [
        "grain"
      ]
    },
    {
      "id": "protein",
      "label": "Protein",
      "categories": [
        "can",
        "fridge",
        "freezer"
      ]
    },
    {
      "id": "produce",
      "label": "Produce",
      "categories": [
        "fridge",
        "freezer"
      ]
    },
    {
      "id": "seasoning",
      "label": "Seasoning",
      "categories": [
        "spice"
      ]
    }
  ],
  "sample": [
    {
      "id": "pantry-rice",
      "name": "Jasmine rice",
      "category": "grain",
      "tags": [
        "staple"
      ],
      "cost": 12,
      "quantity": 1,
      "acquired": "2026-01-01",
      "expires": "2027-12-01",
      "condition": "new"
    },
    {
      "id": "pantry-beans",
      "name": "Black beans",
      "category": "can",
      "tags": [
        "protein"
      ],
      "cost": 2,
      "quantity": 4,
      "acquired": "2026-02-01",
      "expires": "2028-01-01",
      "condition": "new"
    },
    {
      "id": "pantry-yogurt",
      "name": "Greek yogurt",
      "category": "fridge",
      "tags": [
        "dairy"
      ],
      "cost": 6,
      "quantity": 2,
      "acquired": "2026-11-01",
      "expires": "2026-11-20",
      "condition": "good"
    },
    {
      "id": "pantry-peas",
      "name": "Frozen peas",
      "category": "freezer",
      "tags": [
        "vegetable"
      ],
      "cost": 4,
      "quantity": 1,
      "acquired": "2026-08-01",
      "expires": "2027-02-01",
      "condition": "good"
    },
    {
      "id": "pantry-paprika",
      "name": "Smoked paprika",
      "category": "spice",
      "tags": [
        "smoky"
      ],
      "cost": 5,
      "quantity": 1,
      "acquired": "2024-01-01",
      "expires": "2025-11-01",
      "condition": "fair"
    },
    {
      "id": "pantry-pasta",
      "name": "Penne pasta",
      "category": "grain",
      "tags": [
        "staple"
      ],
      "cost": 3,
      "quantity": 2,
      "acquired": "2026-03-01",
      "expires": "2027-08-01",
      "condition": "new"
    }
  ]
}
