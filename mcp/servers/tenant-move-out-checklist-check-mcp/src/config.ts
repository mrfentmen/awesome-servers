import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "tenant-move-out-checklist-check-mcp",
  "title": "Move-Out Checklist Audit",
  "description": "Audit move-out checklist by cleaning, photos, keys, forwarding coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "tenant_move_out_checklist",
  "entity": "move-out checklist item",
  "categories": [
    {
      "id": "cleaning",
      "label": "Cleaning",
      "baseline": 2
    },
    {
      "id": "photos",
      "label": "Photos",
      "baseline": 2
    },
    {
      "id": "keys",
      "label": "Keys",
      "baseline": 2
    },
    {
      "id": "forwarding",
      "label": "Forwarding",
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
        "cleaning"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "forwarding"
      ]
    }
  ],
  "sample": [
    {
      "id": "tenant_move_out_checklist-cleaning-1",
      "name": "Cleaning primary",
      "category": "cleaning",
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
      "id": "tenant_move_out_checklist-photos-2",
      "name": "Photos primary",
      "category": "photos",
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
      "id": "tenant_move_out_checklist-keys-3",
      "name": "Keys primary",
      "category": "keys",
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
      "id": "tenant_move_out_checklist-forwarding-4",
      "name": "Forwarding primary",
      "category": "forwarding",
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
      "id": "tenant_move_out_checklist-cleaning-5",
      "name": "Cleaning backup",
      "category": "cleaning",
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
      "id": "tenant_move_out_checklist-photos-6",
      "name": "Photos backup",
      "category": "photos",
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
      "id": "tenant_move_out_checklist-keys-7",
      "name": "Keys backup",
      "category": "keys",
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
      "id": "tenant_move_out_checklist-forwarding-8",
      "name": "Forwarding backup",
      "category": "forwarding",
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
