import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "pet-lifetime-cost-planner-mcp",
  "title": "Pet Lifetime Cost Planner Audit",
  "description": "Pet Lifetime Cost Planner Audit: plan lifetime pet cost by category. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "pet_cost",
  "entity": "cost item",
  "categories": [
    {
      "id": "food",
      "label": "Food",
      "baseline": 4
    },
    {
      "id": "vet",
      "label": "Vet",
      "baseline": 3
    },
    {
      "id": "gear",
      "label": "Gear",
      "baseline": 3
    },
    {
      "id": "care",
      "label": "Care",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "cost_per_use",
    "label": "Cost per use",
    "unit": "USD",
    "target": 25,
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
        "food"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "care"
      ]
    }
  ],
  "sample": [
    {
      "id": "pet_cost-sample-1",
      "name": "Sample food entry",
      "category": "food",
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
      "id": "pet_cost-sample-2",
      "name": "Sample vet entry",
      "category": "vet",
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
      "id": "pet_cost-sample-3",
      "name": "Sample gear entry",
      "category": "gear",
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
      "id": "pet_cost-sample-4",
      "name": "Sample care entry",
      "category": "care",
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
