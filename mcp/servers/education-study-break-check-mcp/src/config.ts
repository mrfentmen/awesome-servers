import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "education-study-break-check-mcp",
  "title": "Study Break Audit",
  "description": "Audit movement, snack, rest and social break options for duration, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "study_break",
  "entity": "study break option",
  "categories": [
    {
      "id": "movement",
      "label": "Movement",
      "baseline": 2
    },
    {
      "id": "snack",
      "label": "Snack",
      "baseline": 2
    },
    {
      "id": "rest",
      "label": "Rest",
      "baseline": 2
    },
    {
      "id": "social",
      "label": "Social",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "break_minutes",
    "label": "Break minutes",
    "unit": "min",
    "target": 10,
    "direction": "higher"
  },
  "target": {
    "maxItems": 30,
    "budget": 50,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "movement",
      "label": "Movement",
      "categories": [
        "movement"
      ]
    },
    {
      "id": "snack",
      "label": "Snack",
      "categories": [
        "snack"
      ]
    },
    {
      "id": "rest",
      "label": "Rest",
      "categories": [
        "rest"
      ]
    },
    {
      "id": "social",
      "label": "Social",
      "categories": [
        "social"
      ]
    }
  ],
  "sample": [
    {
      "id": "study_break-walk-around-block",
      "name": "Walk around block",
      "category": "movement",
      "tags": [
        "movement",
        "outdoor"
      ],
      "cost": 0,
      "quantity": 12,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "new"
    },
    {
      "id": "study_break-desk-stretch",
      "name": "Desk stretch",
      "category": "movement",
      "tags": [
        "movement",
        "indoor"
      ],
      "cost": 0,
      "quantity": 5,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "study_break-apple-and-peanut-butter",
      "name": "Apple and peanut butter",
      "category": "snack",
      "tags": [
        "snack",
        "protein"
      ],
      "cost": 2,
      "quantity": 8,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "study_break-trail-mix",
      "name": "Trail mix",
      "category": "snack",
      "tags": [
        "snack",
        "nuts"
      ],
      "cost": 3,
      "quantity": 6,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "study_break-quiet-reset",
      "name": "Quiet reset",
      "category": "rest",
      "tags": [
        "rest",
        "quiet"
      ],
      "cost": 0,
      "quantity": 10,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "new"
    },
    {
      "id": "study_break-short-nap",
      "name": "Short nap",
      "category": "rest",
      "tags": [
        "rest",
        "sleep"
      ],
      "cost": 0,
      "quantity": 20,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "study_break-call-a-friend",
      "name": "Call a friend",
      "category": "social",
      "tags": [
        "social",
        "phone"
      ],
      "cost": 0,
      "quantity": 15,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "study_break-study-group-check-in",
      "name": "Study group check-in",
      "category": "social",
      "tags": [
        "social",
        "study"
      ],
      "cost": 0,
      "quantity": 12,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    }
  ]
}
