import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "education-study-break-index-mcp",
  "title": "Study Break Archive",
  "description": "Archive study break by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "study_break_index",
  "entity": "study break option archive",
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
      "id": "study_break_index-walk-around-block",
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
      "id": "study_break_index-desk-stretch",
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
      "id": "study_break_index-apple-and-peanut-butter",
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
      "id": "study_break_index-trail-mix",
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
      "id": "study_break_index-quiet-reset",
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
      "id": "study_break_index-short-nap",
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
      "id": "study_break_index-call-a-friend",
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
      "id": "study_break_index-study-group-check-in",
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
