import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "vendor-payment-checklist-mcp",
  "title": "vendor payment checklist Checklist",
  "description": "Real local JSON analysis of vendor payment checklist in the Money & Books lane. 25 MCP tools, no paywall.",
  "prefix": "money_vendor_payment_checklist",
  "entity": "vendor payment checklist item",
  "categories": [
    {
      "id": "money",
      "label": "money",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "vendor-payment",
      "label": "vendor-payment",
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
        "money"
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
      "id": "money_vendor_payment_checklist-money-1",
      "name": "money primary",
      "category": "money",
      "tags": [
        "money-books",
        "vendor",
        "payment"
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
      "id": "money_vendor_payment_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "money-books",
        "vendor",
        "payment"
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
      "id": "money_vendor_payment_checklist-vendor-payment-3",
      "name": "vendor-payment primary",
      "category": "vendor-payment",
      "tags": [
        "money-books",
        "vendor",
        "payment"
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
      "id": "money_vendor_payment_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "money-books",
        "vendor",
        "payment"
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
      "id": "money_vendor_payment_checklist-money-5",
      "name": "money backup",
      "category": "money",
      "tags": [
        "money-books",
        "vendor",
        "payment"
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
      "id": "money_vendor_payment_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "money-books",
        "vendor",
        "payment"
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
      "id": "money_vendor_payment_checklist-vendor-payment-7",
      "name": "vendor-payment backup",
      "category": "vendor-payment",
      "tags": [
        "money-books",
        "vendor",
        "payment"
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
      "id": "money_vendor_payment_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "money-books",
        "vendor",
        "payment"
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
