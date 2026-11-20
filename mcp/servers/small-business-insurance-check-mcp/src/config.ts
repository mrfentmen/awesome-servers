import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "small-business-insurance-check-mcp",
  "title": "Business Insurance Audit",
  "description": "Audit business insurance by liability, property, workers, cyber coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "small_business_insurance",
  "entity": "business insurance item",
  "categories": [
    {
      "id": "liability",
      "label": "Liability",
      "baseline": 2
    },
    {
      "id": "property",
      "label": "Property",
      "baseline": 2
    },
    {
      "id": "workers",
      "label": "Workers",
      "baseline": 2
    },
    {
      "id": "cyber",
      "label": "Cyber",
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
    "budget": 700,
    "coverage": 0.75,
    "expiryDays": 45
  },
  "dependencies": [
    {
      "id": "core",
      "label": "Core records",
      "categories": [
        "liability"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "cyber"
      ]
    }
  ],
  "sample": [
    {
      "id": "small_business_insurance-liability-1",
      "name": "Liability primary",
      "category": "liability",
      "tags": [
        "small-business",
        "compliance",
        "operations"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "small_business_insurance-property-2",
      "name": "Property primary",
      "category": "property",
      "tags": [
        "small-business",
        "compliance",
        "operations"
      ],
      "cost": 35,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-29",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "small_business_insurance-workers-3",
      "name": "Workers primary",
      "category": "workers",
      "tags": [
        "small-business",
        "compliance",
        "operations"
      ],
      "cost": 50,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-12",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "small_business_insurance-cyber-4",
      "name": "Cyber primary",
      "category": "cyber",
      "tags": [
        "small-business",
        "compliance",
        "operations"
      ],
      "cost": 65,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-26",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "small_business_insurance-liability-5",
      "name": "Liability backup",
      "category": "liability",
      "tags": [
        "small-business",
        "compliance",
        "operations"
      ],
      "cost": 80,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-09",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "small_business_insurance-property-6",
      "name": "Property backup",
      "category": "property",
      "tags": [
        "small-business",
        "compliance",
        "operations"
      ],
      "cost": 95,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-23",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "small_business_insurance-workers-7",
      "name": "Workers backup",
      "category": "workers",
      "tags": [
        "small-business",
        "compliance",
        "operations"
      ],
      "cost": 110,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-09",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "small_business_insurance-cyber-8",
      "name": "Cyber backup",
      "category": "cyber",
      "tags": [
        "small-business",
        "compliance",
        "operations"
      ],
      "cost": 125,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-23",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
