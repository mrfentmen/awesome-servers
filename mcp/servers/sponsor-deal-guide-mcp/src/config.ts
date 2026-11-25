import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "sponsor-deal-guide-mcp",
  "title": "sponsor deal guide Guide",
  "description": "Real local JSON analysis of sponsor deal guide in the Video & Creator lane. 25 MCP tools, no paywall.",
  "prefix": "video_sponsor_deal_guide",
  "entity": "sponsor deal guide item",
  "categories": [
    {
      "id": "video",
      "label": "video",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "sponsor-deal",
      "label": "sponsor-deal",
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
        "video"
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
      "id": "video_sponsor_deal_guide-video-1",
      "name": "video primary",
      "category": "video",
      "tags": [
        "video-creator",
        "sponsor",
        "deal"
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
      "id": "video_sponsor_deal_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "video-creator",
        "sponsor",
        "deal"
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
      "id": "video_sponsor_deal_guide-sponsor-deal-3",
      "name": "sponsor-deal primary",
      "category": "sponsor-deal",
      "tags": [
        "video-creator",
        "sponsor",
        "deal"
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
      "id": "video_sponsor_deal_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "video-creator",
        "sponsor",
        "deal"
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
      "id": "video_sponsor_deal_guide-video-5",
      "name": "video backup",
      "category": "video",
      "tags": [
        "video-creator",
        "sponsor",
        "deal"
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
      "id": "video_sponsor_deal_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "video-creator",
        "sponsor",
        "deal"
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
      "id": "video_sponsor_deal_guide-sponsor-deal-7",
      "name": "sponsor-deal backup",
      "category": "sponsor-deal",
      "tags": [
        "video-creator",
        "sponsor",
        "deal"
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
      "id": "video_sponsor_deal_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "video-creator",
        "sponsor",
        "deal"
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
