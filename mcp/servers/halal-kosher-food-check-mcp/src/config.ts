import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "halal-kosher-food-check-mcp",
  "title": "Halal Kosher Food Check Audit",
  "description": "Halal Kosher Food Check Audit: check packaged food cert claims with sources, no rulings. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "cert_food",
  "entity": "product",
  "categories": [
    {
      "id": "meat",
      "label": "Meat",
      "baseline": 4
    },
    {
      "id": "dairy",
      "label": "Dairy",
      "baseline": 3
    },
    {
      "id": "snack",
      "label": "Snacks",
      "baseline": 3
    },
    {
      "id": "ready",
      "label": "Ready meals",
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
        "meat"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "ready"
      ]
    }
  ],
  "sample": [
    {
      "id": "cert_food-sample-1",
      "name": "Sample meat entry",
      "category": "meat",
      "tags": [
        "halal"
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
      "id": "cert_food-sample-2",
      "name": "Sample dairy entry",
      "category": "dairy",
      "tags": [
        "halal"
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
      "id": "cert_food-sample-3",
      "name": "Sample snacks entry",
      "category": "snack",
      "tags": [
        "halal"
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
      "id": "cert_food-sample-4",
      "name": "Sample ready meals entry",
      "category": "ready",
      "tags": [
        "halal"
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
