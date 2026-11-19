import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "boba-kombucha-check-mcp",
  "title": "Boba Kombucha Check Audit",
  "description": "Boba Kombucha Check Audit: compare boba and kombucha sugar caffeine and cost. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "boba_tea",
  "entity": "drink",
  "categories": [
    {
      "id": "milk-tea",
      "label": "Milk tea",
      "baseline": 4
    },
    {
      "id": "fruit-tea",
      "label": "Fruit tea",
      "baseline": 3
    },
    {
      "id": "kombucha",
      "label": "Kombucha",
      "baseline": 3
    },
    {
      "id": "topping",
      "label": "Toppings",
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
        "milk-tea"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "topping"
      ]
    }
  ],
  "sample": [
    {
      "id": "boba_tea-sample-1",
      "name": "Sample milk tea entry",
      "category": "milk-tea",
      "tags": [
        "boba"
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
      "id": "boba_tea-sample-2",
      "name": "Sample fruit tea entry",
      "category": "fruit-tea",
      "tags": [
        "boba"
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
      "id": "boba_tea-sample-3",
      "name": "Sample kombucha entry",
      "category": "kombucha",
      "tags": [
        "boba"
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
      "id": "boba_tea-sample-4",
      "name": "Sample toppings entry",
      "category": "topping",
      "tags": [
        "boba"
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
