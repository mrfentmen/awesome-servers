import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "estate-funeral-cost-compare-check-mcp",
  "title": "Funeral Cost Compare Audit",
  "description": "Audit funeral cost compare by service, burial, cremation, extras coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "estate_funeral_cost_compare",
  "entity": "funeral cost compare item",
  "categories": [
    {
      "id": "service",
      "label": "Service",
      "baseline": 2
    },
    {
      "id": "burial",
      "label": "Burial",
      "baseline": 2
    },
    {
      "id": "cremation",
      "label": "Cremation",
      "baseline": 2
    },
    {
      "id": "extras",
      "label": "Extras",
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
        "service"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "extras"
      ]
    }
  ],
  "sample": [
    {
      "id": "estate_funeral_cost_compare-service-1",
      "name": "Service primary",
      "category": "service",
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
      "id": "estate_funeral_cost_compare-burial-2",
      "name": "Burial primary",
      "category": "burial",
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
      "id": "estate_funeral_cost_compare-cremation-3",
      "name": "Cremation primary",
      "category": "cremation",
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
      "id": "estate_funeral_cost_compare-extras-4",
      "name": "Extras primary",
      "category": "extras",
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
      "id": "estate_funeral_cost_compare-service-5",
      "name": "Service backup",
      "category": "service",
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
      "id": "estate_funeral_cost_compare-burial-6",
      "name": "Burial backup",
      "category": "burial",
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
      "id": "estate_funeral_cost_compare-cremation-7",
      "name": "Cremation backup",
      "category": "cremation",
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
      "id": "estate_funeral_cost_compare-extras-8",
      "name": "Extras backup",
      "category": "extras",
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
