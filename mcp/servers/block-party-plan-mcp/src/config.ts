import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "block-party-plan-mcp",
  "title": "Block Party Plan Audit",
  "description": "Block Party Plan Audit: block party and parade permit plan. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "block_party",
  "entity": "task",
  "categories": [
    {
      "id": "permits",
      "label": "Permits",
      "baseline": 4
    },
    {
      "id": "food",
      "label": "Food",
      "baseline": 3
    },
    {
      "id": "music",
      "label": "Music",
      "baseline": 3
    },
    {
      "id": "safety",
      "label": "Safety",
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
        "permits"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "safety"
      ]
    }
  ],
  "sample": [
    {
      "id": "block_party-sample-1",
      "name": "Sample permits entry",
      "category": "permits",
      "tags": [
        "block-party"
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
      "id": "block_party-sample-2",
      "name": "Sample food entry",
      "category": "food",
      "tags": [
        "block-party"
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
      "id": "block_party-sample-3",
      "name": "Sample music entry",
      "category": "music",
      "tags": [
        "block-party"
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
      "id": "block_party-sample-4",
      "name": "Sample safety entry",
      "category": "safety",
      "tags": [
        "block-party"
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
