import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "independent-cafe-drink-estimate-mcp",
  "title": "Indie Cafe Drink Estimate Audit",
  "description": "Indie Cafe Drink Estimate Audit: estimate indie cafe drink builds and cost. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "cafe_drink",
  "entity": "drink",
  "categories": [
    {
      "id": "espresso",
      "label": "Espresso",
      "baseline": 4
    },
    {
      "id": "brew",
      "label": "Brewed",
      "baseline": 3
    },
    {
      "id": "tea",
      "label": "Tea",
      "baseline": 3
    },
    {
      "id": "special",
      "label": "Specials",
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
        "espresso"
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
      "id": "cafe_drink-sample-1",
      "name": "Sample espresso entry",
      "category": "espresso",
      "tags": [
        "cafe"
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
      "id": "cafe_drink-sample-2",
      "name": "Sample brewed entry",
      "category": "brew",
      "tags": [
        "cafe"
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
      "id": "cafe_drink-sample-3",
      "name": "Sample tea entry",
      "category": "tea",
      "tags": [
        "cafe"
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
      "id": "cafe_drink-sample-4",
      "name": "Sample specials entry",
      "category": "special",
      "tags": [
        "cafe"
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
