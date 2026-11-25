import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "catering-order-audit-mcp",
  "title": "catering order audit Audit",
  "description": "Real local JSON analysis of catering order audit in the Food & Farm lane. 25 MCP tools, no paywall.",
  "prefix": "food_catering_order_audit",
  "entity": "catering order audit item",
  "categories": [
    {
      "id": "food",
      "label": "food",
      "baseline": 2
    },
    {
      "id": "audit",
      "label": "audit",
      "baseline": 2
    },
    {
      "id": "catering-order",
      "label": "catering-order",
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
    "target": 7,
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
        "food"
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
      "id": "food_catering_order_audit-food-1",
      "name": "food primary",
      "category": "food",
      "tags": [
        "food-farm",
        "catering",
        "order"
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
      "id": "food_catering_order_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "food-farm",
        "catering",
        "order"
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
      "id": "food_catering_order_audit-catering-order-3",
      "name": "catering-order primary",
      "category": "catering-order",
      "tags": [
        "food-farm",
        "catering",
        "order"
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
      "id": "food_catering_order_audit-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "food-farm",
        "catering",
        "order"
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
      "id": "food_catering_order_audit-food-5",
      "name": "food backup",
      "category": "food",
      "tags": [
        "food-farm",
        "catering",
        "order"
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
      "id": "food_catering_order_audit-audit-6",
      "name": "audit backup",
      "category": "audit",
      "tags": [
        "food-farm",
        "catering",
        "order"
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
      "id": "food_catering_order_audit-catering-order-7",
      "name": "catering-order backup",
      "category": "catering-order",
      "tags": [
        "food-farm",
        "catering",
        "order"
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
      "id": "food_catering_order_audit-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "food-farm",
        "catering",
        "order"
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
