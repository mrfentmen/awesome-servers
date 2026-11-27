import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "podcast-feed-checklist-mcp",
  "title": "podcast feed checklist Checklist",
  "description": "Real local JSON analysis of podcast feed checklist in the Media & Publishing lane. 25 MCP tools, no paywall.",
  "prefix": "media_podcast_feed_checklist",
  "entity": "podcast feed checklist item",
  "categories": [
    {
      "id": "media",
      "label": "media",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "podcast-feed",
      "label": "podcast-feed",
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
        "media"
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
      "id": "media_podcast_feed_checklist-media-1",
      "name": "media primary",
      "category": "media",
      "tags": [
        "media-publishing",
        "podcast",
        "feed"
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
      "id": "media_podcast_feed_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "media-publishing",
        "podcast",
        "feed"
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
      "id": "media_podcast_feed_checklist-podcast-feed-3",
      "name": "podcast-feed primary",
      "category": "podcast-feed",
      "tags": [
        "media-publishing",
        "podcast",
        "feed"
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
      "id": "media_podcast_feed_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "media-publishing",
        "podcast",
        "feed"
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
      "id": "media_podcast_feed_checklist-media-5",
      "name": "media backup",
      "category": "media",
      "tags": [
        "media-publishing",
        "podcast",
        "feed"
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
      "id": "media_podcast_feed_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "media-publishing",
        "podcast",
        "feed"
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
      "id": "media_podcast_feed_checklist-podcast-feed-7",
      "name": "podcast-feed backup",
      "category": "podcast-feed",
      "tags": [
        "media-publishing",
        "podcast",
        "feed"
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
      "id": "media_podcast_feed_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "media-publishing",
        "podcast",
        "feed"
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
