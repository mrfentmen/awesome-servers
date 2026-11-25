import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "utility-bill-checklist-mcp",
  "title": "utility bill checklist Checklist",
  "description": "Real local JSON analysis of utility bill checklist in the Energy & Planet lane. 25 MCP tools, no paywall.",
  "prefix": "planet_utility_bill_checklist",
  "entity": "utility bill checklist item",
  "categories": [
    {
      "id": "planet",
      "label": "planet",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "utility-bill",
      "label": "utility-bill",
      "baseline": 2
    },
    {
      "id": "mcp",
      "label": "mcp",
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
        "planet"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "mcp"
      ]
    }
  ],
  "sample": [
    {
      "id": "planet_utility_bill_checklist-planet-1",
      "name": "planet primary",
      "category": "planet",
      "tags": [
        "energy-planet",
        "utility",
        "bill"
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
      "id": "planet_utility_bill_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "energy-planet",
        "utility",
        "bill"
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
      "id": "planet_utility_bill_checklist-utility-bill-3",
      "name": "utility-bill primary",
      "category": "utility-bill",
      "tags": [
        "energy-planet",
        "utility",
        "bill"
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
      "id": "planet_utility_bill_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "energy-planet",
        "utility",
        "bill"
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
      "id": "planet_utility_bill_checklist-planet-5",
      "name": "planet backup",
      "category": "planet",
      "tags": [
        "energy-planet",
        "utility",
        "bill"
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
      "id": "planet_utility_bill_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "energy-planet",
        "utility",
        "bill"
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
      "id": "planet_utility_bill_checklist-utility-bill-7",
      "name": "utility-bill backup",
      "category": "utility-bill",
      "tags": [
        "energy-planet",
        "utility",
        "bill"
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
      "id": "planet_utility_bill_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "energy-planet",
        "utility",
        "bill"
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
