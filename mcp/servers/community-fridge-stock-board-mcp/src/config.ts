import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "community-fridge-stock-board-mcp",
  "title": "Community Fridge Stock Board Audit",
  "description": "Community Fridge Stock Board Audit: volunteer-entered fridge stock board. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "fridge_stock",
  "entity": "stock item",
  "categories": [
    {
      "id": "fresh",
      "label": "Fresh",
      "baseline": 4
    },
    {
      "id": "canned",
      "label": "Canned",
      "baseline": 3
    },
    {
      "id": "bread",
      "label": "Bread",
      "baseline": 3
    },
    {
      "id": "drinks",
      "label": "Drinks",
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
        "fresh"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "drinks"
      ]
    }
  ],
  "sample": [
    {
      "id": "fridge_stock-sample-1",
      "name": "Sample fresh entry",
      "category": "fresh",
      "tags": [
        "community"
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
      "id": "fridge_stock-sample-2",
      "name": "Sample canned entry",
      "category": "canned",
      "tags": [
        "community"
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
      "id": "fridge_stock-sample-3",
      "name": "Sample bread entry",
      "category": "bread",
      "tags": [
        "community"
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
      "id": "fridge_stock-sample-4",
      "name": "Sample drinks entry",
      "category": "drinks",
      "tags": [
        "community"
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
