import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "travel-passport-expiry-check-mcp",
  "title": "Passport Expiry Audit",
  "description": "Audit passports, visas, insurance and vaccination documents for expiry and travel readiness. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "passport_expiry",
  "entity": "travel document",
  "categories": [
    {
      "id": "passport",
      "label": "Passports",
      "baseline": 1
    },
    {
      "id": "visa",
      "label": "Visas",
      "baseline": 2
    },
    {
      "id": "insurance",
      "label": "Insurance",
      "baseline": 2
    },
    {
      "id": "vaccine",
      "label": "Vaccination records",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "days_to_expiry",
    "label": "Days to expiry",
    "unit": "days",
    "target": 180,
    "direction": "higher"
  },
  "target": {
    "maxItems": 12,
    "budget": 500,
    "coverage": 0.75,
    "expiryDays": 180
  },
  "dependencies": [
    {
      "id": "identity",
      "label": "Identity document",
      "categories": [
        "passport"
      ]
    },
    {
      "id": "entry",
      "label": "Entry permission",
      "categories": [
        "visa"
      ]
    },
    {
      "id": "health",
      "label": "Health document",
      "categories": [
        "vaccine"
      ]
    }
  ],
  "sample": [
    {
      "id": "travel-passport",
      "name": "Passport",
      "category": "passport",
      "tags": [
        "identity"
      ],
      "cost": 160,
      "quantity": 1,
      "acquired": "2023-05-01",
      "expires": "2028-05-01",
      "condition": "good"
    },
    {
      "id": "travel-visa",
      "name": "Tourist visa",
      "category": "visa",
      "tags": [
        "entry"
      ],
      "cost": 80,
      "quantity": 1,
      "acquired": "2026-01-01",
      "expires": "2027-02-01",
      "condition": "good"
    },
    {
      "id": "travel-insurance",
      "name": "Travel insurance",
      "category": "insurance",
      "tags": [
        "medical"
      ],
      "cost": 60,
      "quantity": 1,
      "acquired": "2026-10-01",
      "expires": "2026-12-15",
      "condition": "good"
    },
    {
      "id": "travel-vaccine",
      "name": "Vaccination record",
      "category": "vaccine",
      "tags": [
        "health"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2020-01-01",
      "expires": "2028-01-01",
      "condition": "good"
    },
    {
      "id": "travel-visa-2",
      "name": "Business visa",
      "category": "visa",
      "tags": [
        "entry"
      ],
      "cost": 120,
      "quantity": 1,
      "acquired": "2025-06-01",
      "expires": "2027-06-01",
      "condition": "good"
    }
  ]
}
