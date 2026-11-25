import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "vinyl-collect-audit-mcp",
  "title": "vinyl collect audit Audit",
  "description": "Real local JSON analysis of vinyl collect audit in the Music & Audio lane. 25 MCP tools, no paywall.",
  "prefix": "music_vinyl_collect_audit",
  "entity": "vinyl collect audit item",
  "categories": [
    {
      "id": "music",
      "label": "music",
      "baseline": 2
    },
    {
      "id": "audit",
      "label": "audit",
      "baseline": 2
    },
    {
      "id": "vinyl-collect",
      "label": "vinyl-collect",
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
      "id": "music_vinyl_collect_audit-music-1",
      "name": "music primary",
      "category": "music",
      "tags": [
        "music-audio",
        "vinyl",
        "collect"
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
      "id": "music_vinyl_collect_audit-audit-2",
      "name": "audit primary",
      "category": "audit",
      "tags": [
        "music-audio",
        "vinyl",
        "collect"
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
      "id": "music_vinyl_collect_audit-vinyl-collect-3",
      "name": "vinyl-collect primary",
      "category": "vinyl-collect",
      "tags": [
        "music-audio",
        "vinyl",
        "collect"
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
      "id": "music_vinyl_collect_audit-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "music-audio",
        "vinyl",
        "collect"
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
      "id": "music_vinyl_collect_audit-music-5",
      "name": "music backup",
      "category": "music",
      "tags": [
        "music-audio",
        "vinyl",
        "collect"
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
      "id": "music_vinyl_collect_audit-audit-6",
      "name": "audit backup",
      "category": "audit",
      "tags": [
        "music-audio",
        "vinyl",
        "collect"
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
      "id": "music_vinyl_collect_audit-vinyl-collect-7",
      "name": "vinyl-collect backup",
      "category": "vinyl-collect",
      "tags": [
        "music-audio",
        "vinyl",
        "collect"
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
      "id": "music_vinyl_collect_audit-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "music-audio",
        "vinyl",
        "collect"
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
