import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "sample-pack-checklist-mcp",
  "title": "sample pack checklist Checklist",
  "description": "Real local JSON analysis of sample pack checklist in the Music & Audio lane. 25 MCP tools, no paywall.",
  "prefix": "music_sample_pack_checklist",
  "entity": "sample pack checklist item",
  "categories": [
    {
      "id": "music",
      "label": "music",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "sample-pack",
      "label": "sample-pack",
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
        "music"
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
      "id": "music_sample_pack_checklist-music-1",
      "name": "music primary",
      "category": "music",
      "tags": [
        "music-audio",
        "sample",
        "pack"
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
      "id": "music_sample_pack_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "music-audio",
        "sample",
        "pack"
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
      "id": "music_sample_pack_checklist-sample-pack-3",
      "name": "sample-pack primary",
      "category": "sample-pack",
      "tags": [
        "music-audio",
        "sample",
        "pack"
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
      "id": "music_sample_pack_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "music-audio",
        "sample",
        "pack"
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
      "id": "music_sample_pack_checklist-music-5",
      "name": "music backup",
      "category": "music",
      "tags": [
        "music-audio",
        "sample",
        "pack"
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
      "id": "music_sample_pack_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "music-audio",
        "sample",
        "pack"
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
      "id": "music_sample_pack_checklist-sample-pack-7",
      "name": "sample-pack backup",
      "category": "sample-pack",
      "tags": [
        "music-audio",
        "sample",
        "pack"
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
      "id": "music_sample_pack_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "music-audio",
        "sample",
        "pack"
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
