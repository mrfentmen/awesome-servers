import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "move-box-inventory-mcp",
  "title": "Move Box Inventory Audit",
  "description": "Move Box Inventory Audit: box by box move inventory. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "move_box",
  "entity": "box",
  "categories": [
    {
      "id": "kitchen",
      "label": "Kitchen",
      "baseline": 4
    },
    {
      "id": "bedroom",
      "label": "Bedroom",
      "baseline": 3
    },
    {
      "id": "docs",
      "label": "Documents",
      "baseline": 3
    },
    {
      "id": "fragile",
      "label": "Fragile",
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
    "budget": 1000,
    "coverage": 0.75,
    "expiryDays": 45
  },
  "dependencies": [
    {
      "id": "core",
      "label": "Core records",
      "categories": [
        "kitchen"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "fragile"
      ]
    }
  ],
  "sample": [
    {
      "id": "move_box-sample-1",
      "name": "Sample kitchen entry",
      "category": "kitchen",
      "tags": [
        "moving"
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
      "id": "move_box-sample-2",
      "name": "Sample bedroom entry",
      "category": "bedroom",
      "tags": [
        "moving"
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
      "id": "move_box-sample-3",
      "name": "Sample documents entry",
      "category": "docs",
      "tags": [
        "moving"
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
      "id": "move_box-sample-4",
      "name": "Sample fragile entry",
      "category": "fragile",
      "tags": [
        "moving"
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
