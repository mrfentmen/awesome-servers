import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "bait-shop-checklist-mcp",
  "title": "bait shop checklist Checklist",
  "description": "Real local JSON analysis of bait shop checklist in the Fishing Hunting Camping lane. 25 MCP tools, no paywall.",
  "prefix": "outdoors_bait_shop_checklist",
  "entity": "bait shop checklist item",
  "categories": [
    {
      "id": "outdoors",
      "label": "outdoors",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "bait-shop",
      "label": "bait-shop",
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
        "outdoors"
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
      "id": "outdoors_bait_shop_checklist-outdoors-1",
      "name": "outdoors primary",
      "category": "outdoors",
      "tags": [
        "fishing-hunting-camping",
        "bait",
        "shop"
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
      "id": "outdoors_bait_shop_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "fishing-hunting-camping",
        "bait",
        "shop"
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
      "id": "outdoors_bait_shop_checklist-bait-shop-3",
      "name": "bait-shop primary",
      "category": "bait-shop",
      "tags": [
        "fishing-hunting-camping",
        "bait",
        "shop"
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
      "id": "outdoors_bait_shop_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "fishing-hunting-camping",
        "bait",
        "shop"
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
      "id": "outdoors_bait_shop_checklist-outdoors-5",
      "name": "outdoors backup",
      "category": "outdoors",
      "tags": [
        "fishing-hunting-camping",
        "bait",
        "shop"
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
      "id": "outdoors_bait_shop_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "fishing-hunting-camping",
        "bait",
        "shop"
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
      "id": "outdoors_bait_shop_checklist-bait-shop-7",
      "name": "bait-shop backup",
      "category": "bait-shop",
      "tags": [
        "fishing-hunting-camping",
        "bait",
        "shop"
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
      "id": "outdoors_bait_shop_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "fishing-hunting-camping",
        "bait",
        "shop"
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
