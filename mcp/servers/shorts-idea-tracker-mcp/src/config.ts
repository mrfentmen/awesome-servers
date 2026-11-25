import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "shorts-idea-tracker-mcp",
  "title": "shorts idea tracker Tracker",
  "description": "Real local JSON analysis of shorts idea tracker in the Video & Creator lane. 25 MCP tools, no paywall.",
  "prefix": "video_shorts_idea_tracker",
  "entity": "shorts idea tracker item",
  "categories": [
    {
      "id": "video",
      "label": "video",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "shorts-idea",
      "label": "shorts-idea",
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
    "label": "Days since activity",
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
      "id": "video_shorts_idea_tracker-video-1",
      "name": "video primary",
      "category": "video",
      "tags": [
        "video-creator",
        "shorts",
        "idea"
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
      "id": "video_shorts_idea_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "video-creator",
        "shorts",
        "idea"
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
      "id": "video_shorts_idea_tracker-shorts-idea-3",
      "name": "shorts-idea primary",
      "category": "shorts-idea",
      "tags": [
        "video-creator",
        "shorts",
        "idea"
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
      "id": "video_shorts_idea_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "video-creator",
        "shorts",
        "idea"
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
      "id": "video_shorts_idea_tracker-video-5",
      "name": "video backup",
      "category": "video",
      "tags": [
        "video-creator",
        "shorts",
        "idea"
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
      "id": "video_shorts_idea_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "video-creator",
        "shorts",
        "idea"
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
      "id": "video_shorts_idea_tracker-shorts-idea-7",
      "name": "shorts-idea backup",
      "category": "shorts-idea",
      "tags": [
        "video-creator",
        "shorts",
        "idea"
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
      "id": "video_shorts_idea_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "video-creator",
        "shorts",
        "idea"
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
