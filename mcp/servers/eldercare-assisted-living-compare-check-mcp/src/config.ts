import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "eldercare-assisted-living-compare-check-mcp",
  "title": "Assisted Living Compare Audit",
  "description": "Audit assisted living compare by care level, cost, location, waitlist coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "eldercare_assisted_living_compare",
  "entity": "assisted living compare item",
  "categories": [
    {
      "id": "care-level",
      "label": "Care level",
      "baseline": 2
    },
    {
      "id": "cost",
      "label": "Cost",
      "baseline": 2
    },
    {
      "id": "location",
      "label": "Location",
      "baseline": 2
    },
    {
      "id": "waitlist",
      "label": "Waitlist",
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
    "budget": 700,
    "coverage": 0.75,
    "expiryDays": 45
  },
  "dependencies": [
    {
      "id": "core",
      "label": "Core records",
      "categories": [
        "care-level"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "waitlist"
      ]
    }
  ],
  "sample": [
    {
      "id": "eldercare_assisted_living_compare-care-level-1",
      "name": "Care level primary",
      "category": "care-level",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 20,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "eldercare_assisted_living_compare-cost-2",
      "name": "Cost primary",
      "category": "cost",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 35,
      "quantity": 7,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-29",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "eldercare_assisted_living_compare-location-3",
      "name": "Location primary",
      "category": "location",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 50,
      "quantity": 12,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-12",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "eldercare_assisted_living_compare-waitlist-4",
      "name": "Waitlist primary",
      "category": "waitlist",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 65,
      "quantity": 17,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-26",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "eldercare_assisted_living_compare-care-level-5",
      "name": "Care level backup",
      "category": "care-level",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 80,
      "quantity": 22,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-09",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "eldercare_assisted_living_compare-cost-6",
      "name": "Cost backup",
      "category": "cost",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 95,
      "quantity": 27,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-23",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "eldercare_assisted_living_compare-location-7",
      "name": "Location backup",
      "category": "location",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 110,
      "quantity": 32,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-09",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "eldercare_assisted_living_compare-waitlist-8",
      "name": "Waitlist backup",
      "category": "waitlist",
      "tags": [
        "eldercare",
        "senior-care",
        "aging"
      ],
      "cost": 125,
      "quantity": 37,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-23",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
