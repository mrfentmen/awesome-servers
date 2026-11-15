import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "education-homework-help-cost-mcp",
  "title": "Homework Help Budget Audit",
  "description": "Audit homework help budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "homework_help_budget",
  "entity": "homework support resource budget line",
  "categories": [
    {
      "id": "math",
      "label": "Math",
      "baseline": 2
    },
    {
      "id": "science",
      "label": "Science",
      "baseline": 2
    },
    {
      "id": "language",
      "label": "Language",
      "baseline": 2
    },
    {
      "id": "study-skills",
      "label": "Study skills",
      "baseline": 2
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
      "id": "math",
      "label": "Math",
      "categories": [
        "math"
      ]
    },
    {
      "id": "science",
      "label": "Science",
      "categories": [
        "science"
      ]
    },
    {
      "id": "language",
      "label": "Language",
      "categories": [
        "language"
      ]
    },
    {
      "id": "study-skills",
      "label": "Study skills",
      "categories": [
        "study-skills"
      ]
    }
  ],
  "sample": [
    {
      "id": "homework_help_budget-math-support",
      "name": "Math support",
      "category": "math",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "homework_help_budget-science-support",
      "name": "Science support",
      "category": "science",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "homework_help_budget-language-support",
      "name": "Language support",
      "category": "language",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "homework_help_budget-study-skills",
      "name": "Study skills",
      "category": "study-skills",
      "tags": [
        "budget"
      ],
      "cost": 5,
      "quantity": 5,
      "acquired": "2026-08-01",
      "condition": "new"
    }
  ]
}
