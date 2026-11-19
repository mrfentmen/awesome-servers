import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "pet-food-nutrition-compare-mcp",
  "title": "Pet Food Nutrition Compare Audit",
  "description": "Pet Food Nutrition Compare Audit: compare pet food labels, not vet advice. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "pet_food",
  "entity": "product",
  "categories": [
    {
      "id": "dry",
      "label": "Dry",
      "baseline": 4
    },
    {
      "id": "wet",
      "label": "Wet",
      "baseline": 3
    },
    {
      "id": "treat",
      "label": "Treats",
      "baseline": 3
    },
    {
      "id": "special",
      "label": "Special diet",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Days since review",
    "unit": "days",
    "target": 14,
    "direction": "lower"
  },
  "target": {
    "maxItems": 30,
    "budget": 1000,
    "coverage": 0.75,
    "expiryDays": 45
  },
  "dependencies": [
    {
      "id": "core",
      "label": "Core records",
      "categories": [
        "dry"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "special"
      ]
    }
  ],
  "sample": [
    {
      "id": "pet_food-sample-1",
      "name": "Sample dry entry",
      "category": "dry",
      "tags": [
        "pet"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "pet_food-sample-2",
      "name": "Sample wet entry",
      "category": "wet",
      "tags": [
        "pet"
      ],
      "cost": 30,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "pet_food-sample-3",
      "name": "Sample treats entry",
      "category": "treat",
      "tags": [
        "pet"
      ],
      "cost": 40,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "pet_food-sample-4",
      "name": "Sample special diet entry",
      "category": "special",
      "tags": [
        "pet"
      ],
      "cost": 50,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
