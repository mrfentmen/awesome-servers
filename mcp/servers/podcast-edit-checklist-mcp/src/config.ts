import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "podcast-edit-checklist-mcp",
  "title": "podcast edit checklist Checklist",
  "description": "Real local JSON analysis of podcast edit checklist in the Video & Creator lane. 25 MCP tools, no paywall.",
  "prefix": "video_podcast_edit_checklist",
  "entity": "podcast edit checklist item",
  "categories": [
    {
      "id": "video",
      "label": "video",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "podcast-edit",
      "label": "podcast-edit",
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
      "id": "video_podcast_edit_checklist-video-1",
      "name": "video primary",
      "category": "video",
      "tags": [
        "video-creator",
        "podcast",
        "edit"
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
      "id": "video_podcast_edit_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "video-creator",
        "podcast",
        "edit"
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
      "id": "video_podcast_edit_checklist-podcast-edit-3",
      "name": "podcast-edit primary",
      "category": "podcast-edit",
      "tags": [
        "video-creator",
        "podcast",
        "edit"
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
      "id": "video_podcast_edit_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "video-creator",
        "podcast",
        "edit"
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
      "id": "video_podcast_edit_checklist-video-5",
      "name": "video backup",
      "category": "video",
      "tags": [
        "video-creator",
        "podcast",
        "edit"
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
      "id": "video_podcast_edit_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "video-creator",
        "podcast",
        "edit"
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
      "id": "video_podcast_edit_checklist-podcast-edit-7",
      "name": "podcast-edit backup",
      "category": "podcast-edit",
      "tags": [
        "video-creator",
        "podcast",
        "edit"
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
      "id": "video_podcast_edit_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "video-creator",
        "podcast",
        "edit"
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
