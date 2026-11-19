import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "baby-food-check-mcp",
  "title": "Baby Food Check Audit",
  "description": "Baby Food Check Audit: check baby food labels and stages, not medical advice. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "baby_food",
  "entity": "product",
  "categories": [
    {
      "id": "puree",
      "label": "Purees",
      "baseline": 4
    },
    {
      "id": "cereal",
      "label": "Cereals",
      "baseline": 3
    },
    {
      "id": "snack",
      "label": "Snacks",
      "baseline": 3
    },
    {
      "id": "formula",
      "label": "Formula",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "days_to_expiry",
    "label": "Days to deadline",
    "unit": "days",
    "target": 30,
    "direction": "higher"
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
        "puree"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "formula"
      ]
    }
  ],
  "sample": [
    {
      "id": "baby_food-sample-1",
      "name": "Sample purees entry",
      "category": "puree",
      "tags": [
        "baby"
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
      "id": "baby_food-sample-2",
      "name": "Sample cereals entry",
      "category": "cereal",
      "tags": [
        "baby"
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
      "id": "baby_food-sample-3",
      "name": "Sample snacks entry",
      "category": "snack",
      "tags": [
        "baby"
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
      "id": "baby_food-sample-4",
      "name": "Sample formula entry",
      "category": "formula",
      "tags": [
        "baby"
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
