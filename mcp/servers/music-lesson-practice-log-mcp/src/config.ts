import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "music-lesson-practice-log-mcp",
  "title": "Music Lesson Practice Log Audit",
  "description": "Music Lesson Practice Log Audit: studio practice and fee log. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "music_lesson",
  "entity": "student",
  "categories": [
    {
      "id": "piano",
      "label": "Piano",
      "baseline": 4
    },
    {
      "id": "guitar",
      "label": "Guitar",
      "baseline": 3
    },
    {
      "id": "voice",
      "label": "Voice",
      "baseline": 3
    },
    {
      "id": "drums",
      "label": "Drums",
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
    "budget": 1000,
    "coverage": 0.75,
    "expiryDays": 45
  },
  "dependencies": [
    {
      "id": "core",
      "label": "Core records",
      "categories": [
        "piano"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "drums"
      ]
    }
  ],
  "sample": [
    {
      "id": "music_lesson-sample-1",
      "name": "Sample piano entry",
      "category": "piano",
      "tags": [
        "music"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "music_lesson-sample-2",
      "name": "Sample guitar entry",
      "category": "guitar",
      "tags": [
        "music"
      ],
      "cost": 30,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "music_lesson-sample-3",
      "name": "Sample voice entry",
      "category": "voice",
      "tags": [
        "music"
      ],
      "cost": 40,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "music_lesson-sample-4",
      "name": "Sample drums entry",
      "category": "drums",
      "tags": [
        "music"
      ],
      "cost": 50,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
