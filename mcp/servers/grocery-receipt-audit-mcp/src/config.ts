import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "grocery-receipt-audit-mcp",
  "title": "Grocery Receipt Audit Planner",
  "description": "Real local JSON analysis of grocery receipt audit in the Money Moves lane. 25 MCP tools, no paywall.",
  "prefix": "money_moves_grocery_receipt_audit",
  "entity": "grocery receipt audit item",
  "categories": [
    {
      "id": "rows",
      "label": "Rows",
      "baseline": 2
    },
    {
      "id": "flags",
      "label": "Flags",
      "baseline": 2
    },
    {
      "id": "totals",
      "label": "Totals",
      "baseline": 2
    },
    {
      "id": "notes",
      "label": "Notes",
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
        "rows"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "notes"
      ]
    }
  ],
  "sample": [
    {
      "id": "money_moves_grocery_receipt_audit-rows-1",
      "name": "Rows primary",
      "category": "rows",
      "tags": [
        "money-moves",
        "grocery",
        "receipt"
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
      "id": "money_moves_grocery_receipt_audit-flags-2",
      "name": "Flags primary",
      "category": "flags",
      "tags": [
        "money-moves",
        "grocery",
        "receipt"
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
      "id": "money_moves_grocery_receipt_audit-totals-3",
      "name": "Totals primary",
      "category": "totals",
      "tags": [
        "money-moves",
        "grocery",
        "receipt"
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
      "id": "money_moves_grocery_receipt_audit-notes-4",
      "name": "Notes primary",
      "category": "notes",
      "tags": [
        "money-moves",
        "grocery",
        "receipt"
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
      "id": "money_moves_grocery_receipt_audit-rows-5",
      "name": "Rows backup",
      "category": "rows",
      "tags": [
        "money-moves",
        "grocery",
        "receipt"
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
      "id": "money_moves_grocery_receipt_audit-flags-6",
      "name": "Flags backup",
      "category": "flags",
      "tags": [
        "money-moves",
        "grocery",
        "receipt"
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
      "id": "money_moves_grocery_receipt_audit-totals-7",
      "name": "Totals backup",
      "category": "totals",
      "tags": [
        "money-moves",
        "grocery",
        "receipt"
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
      "id": "money_moves_grocery_receipt_audit-notes-8",
      "name": "Notes backup",
      "category": "notes",
      "tags": [
        "money-moves",
        "grocery",
        "receipt"
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
