import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "education-study-break-cost-mcp",
  "title": "Study Break Budget Audit",
  "description": "Audit study break budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "study_break_budget",
  "entity": "study break option budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
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
      "id": "study_break_budget-movement",
      "name": "Movement",
      "category": "movement",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "study_break_budget-snacks",
      "name": "Snacks",
      "category": "snack",
      "tags": [
        "budget"
      ],
      "cost": 5,
      "quantity": 5,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "study_break_budget-rest",
      "name": "Rest",
      "category": "rest",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "study_break_budget-social",
      "name": "Social",
      "category": "social",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "acquired": "2026-08-01",
      "condition": "new"
    }
  ]
}
