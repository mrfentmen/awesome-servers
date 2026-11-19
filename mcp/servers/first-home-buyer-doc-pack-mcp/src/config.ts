import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "first-home-buyer-doc-pack-mcp",
  "title": "First Home Buyer Doc Pack Audit",
  "description": "First Home Buyer Doc Pack Audit: buyer document checklist, not legal advice. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "buyer_docs",
  "entity": "document",
  "categories": [
    {
      "id": "id",
      "label": "ID",
      "baseline": 4
    },
    {
      "id": "income",
      "label": "Income",
      "baseline": 3
    },
    {
      "id": "loan",
      "label": "Loan",
      "baseline": 3
    },
    {
      "id": "closing",
      "label": "Closing",
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
    "budget": 1000,
    "coverage": 0.75,
    "expiryDays": 45
  },
  "dependencies": [
    {
      "id": "core",
      "label": "Core records",
      "categories": [
        "id"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "closing"
      ]
    }
  ],
  "sample": [
    {
      "id": "buyer_docs-sample-1",
      "name": "Sample id entry",
      "category": "id",
      "tags": [
        "homebuyer"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "buyer_docs-sample-2",
      "name": "Sample income entry",
      "category": "income",
      "tags": [
        "homebuyer"
      ],
      "cost": 30,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "buyer_docs-sample-3",
      "name": "Sample loan entry",
      "category": "loan",
      "tags": [
        "homebuyer"
      ],
      "cost": 40,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "buyer_docs-sample-4",
      "name": "Sample closing entry",
      "category": "closing",
      "tags": [
        "homebuyer"
      ],
      "cost": 50,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
