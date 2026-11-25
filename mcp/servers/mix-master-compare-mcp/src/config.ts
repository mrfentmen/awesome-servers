import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "mix-master-compare-mcp",
  "title": "mix master compare Compare",
  "description": "Real local JSON analysis of mix master compare in the Music & Audio lane. 25 MCP tools, no paywall.",
  "prefix": "music_mix_master_compare",
  "entity": "mix master compare item",
  "categories": [
    {
      "id": "music",
      "label": "music",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "mix-master",
      "label": "mix-master",
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
      "id": "music_mix_master_compare-music-1",
      "name": "music primary",
      "category": "music",
      "tags": [
        "music-audio",
        "mix",
        "master"
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
      "id": "music_mix_master_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "music-audio",
        "mix",
        "master"
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
      "id": "music_mix_master_compare-mix-master-3",
      "name": "mix-master primary",
      "category": "mix-master",
      "tags": [
        "music-audio",
        "mix",
        "master"
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
      "id": "music_mix_master_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "music-audio",
        "mix",
        "master"
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
      "id": "music_mix_master_compare-music-5",
      "name": "music backup",
      "category": "music",
      "tags": [
        "music-audio",
        "mix",
        "master"
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
      "id": "music_mix_master_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "music-audio",
        "mix",
        "master"
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
      "id": "music_mix_master_compare-mix-master-7",
      "name": "mix-master backup",
      "category": "mix-master",
      "tags": [
        "music-audio",
        "mix",
        "master"
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
      "id": "music_mix_master_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "music-audio",
        "mix",
        "master"
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
