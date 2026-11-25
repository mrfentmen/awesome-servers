import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "car-share-guide-mcp",
  "title": "car-share guide Guide",
  "description": "Real local JSON analysis of car-share guide in the Auto Buying & Ownership lane. 25 MCP tools, no paywall.",
  "prefix": "auto_car_share_guide",
  "entity": "car-share guide item",
  "categories": [
    {
      "id": "auto",
      "label": "auto",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "car-share",
      "label": "car-share",
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
        "auto"
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
      "id": "auto_car_share_guide-auto-1",
      "name": "auto primary",
      "category": "auto",
      "tags": [
        "auto-buying-ownership",
        "car",
        "share"
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
      "id": "auto_car_share_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "auto-buying-ownership",
        "car",
        "share"
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
      "id": "auto_car_share_guide-car-share-3",
      "name": "car-share primary",
      "category": "car-share",
      "tags": [
        "auto-buying-ownership",
        "car",
        "share"
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
      "id": "auto_car_share_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "auto-buying-ownership",
        "car",
        "share"
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
      "id": "auto_car_share_guide-auto-5",
      "name": "auto backup",
      "category": "auto",
      "tags": [
        "auto-buying-ownership",
        "car",
        "share"
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
      "id": "auto_car_share_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "auto-buying-ownership",
        "car",
        "share"
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
      "id": "auto_car_share_guide-car-share-7",
      "name": "car-share backup",
      "category": "car-share",
      "tags": [
        "auto-buying-ownership",
        "car",
        "share"
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
      "id": "auto_car_share_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "auto-buying-ownership",
        "car",
        "share"
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
