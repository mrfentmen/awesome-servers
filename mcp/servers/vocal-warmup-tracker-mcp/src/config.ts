import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "vocal-warmup-tracker-mcp",
  "title": "vocal warmup tracker Tracker",
  "description": "Real local JSON analysis of vocal warmup tracker in the Music & Audio lane. 25 MCP tools, no paywall.",
  "prefix": "music_vocal_warmup_tracker",
  "entity": "vocal warmup tracker item",
  "categories": [
    {
      "id": "music",
      "label": "music",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "vocal-warmup",
      "label": "vocal-warmup",
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
      "id": "music_vocal_warmup_tracker-music-1",
      "name": "music primary",
      "category": "music",
      "tags": [
        "music-audio",
        "vocal",
        "warmup"
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
      "id": "music_vocal_warmup_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "music-audio",
        "vocal",
        "warmup"
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
      "id": "music_vocal_warmup_tracker-vocal-warmup-3",
      "name": "vocal-warmup primary",
      "category": "vocal-warmup",
      "tags": [
        "music-audio",
        "vocal",
        "warmup"
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
      "id": "music_vocal_warmup_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "music-audio",
        "vocal",
        "warmup"
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
      "id": "music_vocal_warmup_tracker-music-5",
      "name": "music backup",
      "category": "music",
      "tags": [
        "music-audio",
        "vocal",
        "warmup"
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
      "id": "music_vocal_warmup_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "music-audio",
        "vocal",
        "warmup"
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
      "id": "music_vocal_warmup_tracker-vocal-warmup-7",
      "name": "vocal-warmup backup",
      "category": "vocal-warmup",
      "tags": [
        "music-audio",
        "vocal",
        "warmup"
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
      "id": "music_vocal_warmup_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "music-audio",
        "vocal",
        "warmup"
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
