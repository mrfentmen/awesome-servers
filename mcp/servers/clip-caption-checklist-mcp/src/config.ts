import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "clip-caption-checklist-mcp",
  "title": "clip caption checklist Checklist",
  "description": "Real local JSON analysis of clip caption checklist in the Video & Creator lane. 25 MCP tools, no paywall.",
  "prefix": "video_clip_caption_checklist",
  "entity": "clip caption checklist item",
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
      "id": "clip-caption",
      "label": "clip-caption",
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
      "id": "video_clip_caption_checklist-video-1",
      "name": "video primary",
      "category": "video",
      "tags": [
        "video-creator",
        "clip",
        "caption"
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
      "id": "video_clip_caption_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "video-creator",
        "clip",
        "caption"
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
      "id": "video_clip_caption_checklist-clip-caption-3",
      "name": "clip-caption primary",
      "category": "clip-caption",
      "tags": [
        "video-creator",
        "clip",
        "caption"
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
      "id": "video_clip_caption_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "video-creator",
        "clip",
        "caption"
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
      "id": "video_clip_caption_checklist-video-5",
      "name": "video backup",
      "category": "video",
      "tags": [
        "video-creator",
        "clip",
        "caption"
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
      "id": "video_clip_caption_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "video-creator",
        "clip",
        "caption"
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
      "id": "video_clip_caption_checklist-clip-caption-7",
      "name": "clip-caption backup",
      "category": "clip-caption",
      "tags": [
        "video-creator",
        "clip",
        "caption"
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
      "id": "video_clip_caption_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "video-creator",
        "clip",
        "caption"
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
