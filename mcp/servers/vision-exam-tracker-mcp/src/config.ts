import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "vision-exam-tracker-mcp",
  "title": "vision-exam tracker Tracker",
  "description": "Real local JSON analysis of vision-exam tracker in the Health & Wellness lane. 25 MCP tools, no paywall.",
  "prefix": "health_vision_exam_tracker",
  "entity": "vision-exam tracker item",
  "categories": [
    {
      "id": "health",
      "label": "health",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "vision-exam",
      "label": "vision-exam",
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
        "health"
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
      "id": "health_vision_exam_tracker-health-1",
      "name": "health primary",
      "category": "health",
      "tags": [
        "health-wellness",
        "vision",
        "exam"
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
      "id": "health_vision_exam_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "health-wellness",
        "vision",
        "exam"
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
      "id": "health_vision_exam_tracker-vision-exam-3",
      "name": "vision-exam primary",
      "category": "vision-exam",
      "tags": [
        "health-wellness",
        "vision",
        "exam"
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
      "id": "health_vision_exam_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "health-wellness",
        "vision",
        "exam"
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
      "id": "health_vision_exam_tracker-health-5",
      "name": "health backup",
      "category": "health",
      "tags": [
        "health-wellness",
        "vision",
        "exam"
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
      "id": "health_vision_exam_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "health-wellness",
        "vision",
        "exam"
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
      "id": "health_vision_exam_tracker-vision-exam-7",
      "name": "vision-exam backup",
      "category": "vision-exam",
      "tags": [
        "health-wellness",
        "vision",
        "exam"
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
      "id": "health_vision_exam_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "health-wellness",
        "vision",
        "exam"
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
