import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "studio-light-guide-mcp",
  "title": "studio light guide Guide",
  "description": "Real local JSON analysis of studio light guide in the Video & Creator lane. 25 MCP tools, no paywall.",
  "prefix": "video_studio_light_guide",
  "entity": "studio light guide item",
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
      "id": "studio-light",
      "label": "studio-light",
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
      "id": "video_studio_light_guide-video-1",
      "name": "video primary",
      "category": "video",
      "tags": [
        "video-creator",
        "studio",
        "light"
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
      "id": "video_studio_light_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "video-creator",
        "studio",
        "light"
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
      "id": "video_studio_light_guide-studio-light-3",
      "name": "studio-light primary",
      "category": "studio-light",
      "tags": [
        "video-creator",
        "studio",
        "light"
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
      "id": "video_studio_light_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "video-creator",
        "studio",
        "light"
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
      "id": "video_studio_light_guide-video-5",
      "name": "video backup",
      "category": "video",
      "tags": [
        "video-creator",
        "studio",
        "light"
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
      "id": "video_studio_light_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "video-creator",
        "studio",
        "light"
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
      "id": "video_studio_light_guide-studio-light-7",
      "name": "studio-light backup",
      "category": "studio-light",
      "tags": [
        "video-creator",
        "studio",
        "light"
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
      "id": "video_studio_light_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "video-creator",
        "studio",
        "light"
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
