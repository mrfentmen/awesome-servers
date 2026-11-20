import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "tenant-rent-affordability-check-mcp",
  "title": "Rent Affordability Audit",
  "description": "Audit rent affordability by income, rent, utilities, buffer coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "tenant_rent_affordability",
  "entity": "rent affordability item",
  "categories": [
    {
      "id": "income",
      "label": "Income",
      "baseline": 2
    },
    {
      "id": "rent",
      "label": "Rent",
      "baseline": 2
    },
    {
      "id": "utilities",
      "label": "Utilities",
      "baseline": 2
    },
    {
      "id": "buffer",
      "label": "Buffer",
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
        "income"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "buffer"
      ]
    }
  ],
  "sample": [
    {
      "id": "tenant_rent_affordability-income-1",
      "name": "Income primary",
      "category": "income",
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
      "id": "tenant_rent_affordability-rent-2",
      "name": "Rent primary",
      "category": "rent",
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
      "id": "tenant_rent_affordability-utilities-3",
      "name": "Utilities primary",
      "category": "utilities",
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
      "id": "tenant_rent_affordability-buffer-4",
      "name": "Buffer primary",
      "category": "buffer",
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
      "id": "tenant_rent_affordability-income-5",
      "name": "Income backup",
      "category": "income",
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
      "id": "tenant_rent_affordability-rent-6",
      "name": "Rent backup",
      "category": "rent",
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
      "id": "tenant_rent_affordability-utilities-7",
      "name": "Utilities backup",
      "category": "utilities",
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
      "id": "tenant_rent_affordability-buffer-8",
      "name": "Buffer backup",
      "category": "buffer",
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
