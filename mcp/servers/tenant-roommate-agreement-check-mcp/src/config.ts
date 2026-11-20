import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "tenant-roommate-agreement-check-mcp",
  "title": "Roommate Agreement Audit",
  "description": "Audit roommate agreement by rent, chores, guests, exit coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "tenant_roommate_agreement",
  "entity": "roommate agreement item",
  "categories": [
    {
      "id": "rent",
      "label": "Rent",
      "baseline": 2
    },
    {
      "id": "chores",
      "label": "Chores",
      "baseline": 2
    },
    {
      "id": "guests",
      "label": "Guests",
      "baseline": 2
    },
    {
      "id": "exit",
      "label": "Exit",
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
        "rent"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "exit"
      ]
    }
  ],
  "sample": [
    {
      "id": "tenant_roommate_agreement-rent-1",
      "name": "Rent primary",
      "category": "rent",
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
      "id": "tenant_roommate_agreement-chores-2",
      "name": "Chores primary",
      "category": "chores",
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
      "id": "tenant_roommate_agreement-guests-3",
      "name": "Guests primary",
      "category": "guests",
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
      "id": "tenant_roommate_agreement-exit-4",
      "name": "Exit primary",
      "category": "exit",
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
      "id": "tenant_roommate_agreement-rent-5",
      "name": "Rent backup",
      "category": "rent",
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
      "id": "tenant_roommate_agreement-chores-6",
      "name": "Chores backup",
      "category": "chores",
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
      "id": "tenant_roommate_agreement-guests-7",
      "name": "Guests backup",
      "category": "guests",
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
      "id": "tenant_roommate_agreement-exit-8",
      "name": "Exit backup",
      "category": "exit",
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
