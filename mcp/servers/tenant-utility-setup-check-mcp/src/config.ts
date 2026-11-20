import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "tenant-utility-setup-check-mcp",
  "title": "Utility Setup Audit",
  "description": "Audit utility setup by electric, water, internet, trash coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "tenant_utility_setup",
  "entity": "utility setup item",
  "categories": [
    {
      "id": "electric",
      "label": "Electric",
      "baseline": 2
    },
    {
      "id": "water",
      "label": "Water",
      "baseline": 2
    },
    {
      "id": "internet",
      "label": "Internet",
      "baseline": 2
    },
    {
      "id": "trash",
      "label": "Trash",
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
        "electric"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "trash"
      ]
    }
  ],
  "sample": [
    {
      "id": "tenant_utility_setup-electric-1",
      "name": "Electric primary",
      "category": "electric",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
      "id": "tenant_utility_setup-water-2",
      "name": "Water primary",
      "category": "water",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
      "id": "tenant_utility_setup-internet-3",
      "name": "Internet primary",
      "category": "internet",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
      "id": "tenant_utility_setup-trash-4",
      "name": "Trash primary",
      "category": "trash",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
      "id": "tenant_utility_setup-electric-5",
      "name": "Electric backup",
      "category": "electric",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
      "id": "tenant_utility_setup-water-6",
      "name": "Water backup",
      "category": "water",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
      "id": "tenant_utility_setup-internet-7",
      "name": "Internet backup",
      "category": "internet",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
      "id": "tenant_utility_setup-trash-8",
      "name": "Trash backup",
      "category": "trash",
      "tags": [
        "tenant",
        "renting",
        "lease"
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
