import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "swim-lesson-progress-log-mcp",
  "title": "Swim Lesson Progress Log Audit",
  "description": "Swim Lesson Progress Log Audit: community pool level progress log. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "swim_lesson",
  "entity": "swimmer",
  "categories": [
    {
      "id": "tots",
      "label": "Tots",
      "baseline": 4
    },
    {
      "id": "kids",
      "label": "Kids",
      "baseline": 3
    },
    {
      "id": "teens",
      "label": "Teens",
      "baseline": 3
    },
    {
      "id": "adults",
      "label": "Adults",
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
        "tots"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "adults"
      ]
    }
  ],
  "sample": [
    {
      "id": "swim_lesson-sample-1",
      "name": "Sample tots entry",
      "category": "tots",
      "tags": [
        "swim"
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
      "id": "swim_lesson-sample-2",
      "name": "Sample kids entry",
      "category": "kids",
      "tags": [
        "swim"
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
      "id": "swim_lesson-sample-3",
      "name": "Sample teens entry",
      "category": "teens",
      "tags": [
        "swim"
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
      "id": "swim_lesson-sample-4",
      "name": "Sample adults entry",
      "category": "adults",
      "tags": [
        "swim"
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
