import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "estate-family-property-split-check-mcp",
  "title": "Family Property Split Audit",
  "description": "Audit family property split by valuation, ownership, offers, agreement coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "estate_family_property_split",
  "entity": "family property split item",
  "categories": [
    {
      "id": "valuation",
      "label": "Valuation",
      "baseline": 2
    },
    {
      "id": "ownership",
      "label": "Ownership",
      "baseline": 2
    },
    {
      "id": "offers",
      "label": "Offers",
      "baseline": 2
    },
    {
      "id": "agreement",
      "label": "Agreement",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "days_to_expiry",
    "label": "Days to deadline",
    "unit": "days",
    "target": 90,
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
        "valuation"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "agreement"
      ]
    }
  ],
  "sample": [
    {
      "id": "estate_family_property_split-valuation-1",
      "name": "Valuation primary",
      "category": "valuation",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_family_property_split-ownership-2",
      "name": "Ownership primary",
      "category": "ownership",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_family_property_split-offers-3",
      "name": "Offers primary",
      "category": "offers",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_family_property_split-agreement-4",
      "name": "Agreement primary",
      "category": "agreement",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_family_property_split-valuation-5",
      "name": "Valuation backup",
      "category": "valuation",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_family_property_split-ownership-6",
      "name": "Ownership backup",
      "category": "ownership",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_family_property_split-offers-7",
      "name": "Offers backup",
      "category": "offers",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
      "id": "estate_family_property_split-agreement-8",
      "name": "Agreement backup",
      "category": "agreement",
      "tags": [
        "estate",
        "probate",
        "inheritance"
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
