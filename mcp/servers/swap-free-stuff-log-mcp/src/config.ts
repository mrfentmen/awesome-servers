import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "swap-free-stuff-log-mcp",
  "title": "Swap Free Stuff Log Audit",
  "description": "Swap Free Stuff Log Audit: tool seed toy book gear swap log. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "swap_log",
  "entity": "listing",
  "categories": [
    {
      "id": "tools",
      "label": "Tools",
      "baseline": 4
    },
    {
      "id": "seeds",
      "label": "Seeds",
      "baseline": 3
    },
    {
      "id": "toys",
      "label": "Toys",
      "baseline": 3
    },
    {
      "id": "books",
      "label": "Books",
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
        "tools"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "books"
      ]
    }
  ],
  "sample": [
    {
      "id": "swap_log-sample-1",
      "name": "Sample tools entry",
      "category": "tools",
      "tags": [
        "swap"
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
      "id": "swap_log-sample-2",
      "name": "Sample seeds entry",
      "category": "seeds",
      "tags": [
        "swap"
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
      "id": "swap_log-sample-3",
      "name": "Sample toys entry",
      "category": "toys",
      "tags": [
        "swap"
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
      "id": "swap_log-sample-4",
      "name": "Sample books entry",
      "category": "books",
      "tags": [
        "swap"
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
