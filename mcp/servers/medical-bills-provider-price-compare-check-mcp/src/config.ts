import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "medical-bills-provider-price-compare-check-mcp",
  "title": "Provider Price Compare Audit",
  "description": "Audit provider price compare by procedure, cash price, insurance price, distance coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "medical_bills_provider_price_compare",
  "entity": "provider price compare item",
  "categories": [
    {
      "id": "procedure",
      "label": "Procedure",
      "baseline": 2
    },
    {
      "id": "cash-price",
      "label": "Cash price",
      "baseline": 2
    },
    {
      "id": "insurance-price",
      "label": "Insurance price",
      "baseline": 2
    },
    {
      "id": "distance",
      "label": "Distance",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "clearance_risk",
    "label": "Claim risk",
    "unit": "score",
    "target": 0,
    "direction": "lower"
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
        "procedure"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "distance"
      ]
    }
  ],
  "sample": [
    {
      "id": "medical_bills_provider_price_compare-procedure-1",
      "name": "Procedure primary",
      "category": "procedure",
      "tags": [
        "medical-bills",
        "insurance-claims",
        "healthcare",
        "cleared"
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
      "id": "medical_bills_provider_price_compare-cash-price-2",
      "name": "Cash price primary",
      "category": "cash-price",
      "tags": [
        "medical-bills",
        "insurance-claims",
        "healthcare",
        "pending"
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
      "id": "medical_bills_provider_price_compare-insurance-price-3",
      "name": "Insurance price primary",
      "category": "insurance-price",
      "tags": [
        "medical-bills",
        "insurance-claims",
        "healthcare",
        "denied"
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
      "id": "medical_bills_provider_price_compare-distance-4",
      "name": "Distance primary",
      "category": "distance",
      "tags": [
        "medical-bills",
        "insurance-claims",
        "healthcare",
        "cleared"
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
      "id": "medical_bills_provider_price_compare-procedure-5",
      "name": "Procedure backup",
      "category": "procedure",
      "tags": [
        "medical-bills",
        "insurance-claims",
        "healthcare",
        "cleared"
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
      "id": "medical_bills_provider_price_compare-cash-price-6",
      "name": "Cash price backup",
      "category": "cash-price",
      "tags": [
        "medical-bills",
        "insurance-claims",
        "healthcare",
        "pending"
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
      "id": "medical_bills_provider_price_compare-insurance-price-7",
      "name": "Insurance price backup",
      "category": "insurance-price",
      "tags": [
        "medical-bills",
        "insurance-claims",
        "healthcare",
        "denied"
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
      "id": "medical_bills_provider_price_compare-distance-8",
      "name": "Distance backup",
      "category": "distance",
      "tags": [
        "medical-bills",
        "insurance-claims",
        "healthcare",
        "cleared"
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
