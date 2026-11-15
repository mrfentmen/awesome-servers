import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "education-science-fair-cost-mcp",
  "title": "Science Fair Budget Audit",
  "description": "Audit science fair budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "science_fair_budget",
  "entity": "science fair project part budget line",
  "categories": [
    {
      "id": "question",
      "label": "Question",
      "baseline": 1
    },
    {
      "id": "method",
      "label": "Method",
      "baseline": 2
    },
    {
      "id": "data",
      "label": "Data",
      "baseline": 2
    },
    {
      "id": "display",
      "label": "Display",
      "baseline": 2
    },
    {
      "id": "safety",
      "label": "Safety",
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
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "question",
      "label": "Question",
      "categories": [
        "question"
      ]
    },
    {
      "id": "method",
      "label": "Method",
      "categories": [
        "method"
      ]
    },
    {
      "id": "data",
      "label": "Data",
      "categories": [
        "data"
      ]
    },
    {
      "id": "display",
      "label": "Display",
      "categories": [
        "display"
      ]
    },
    {
      "id": "safety",
      "label": "Safety",
      "categories": [
        "safety"
      ]
    }
  ],
  "sample": [
    {
      "id": "science_fair_budget-question-research",
      "name": "Question research",
      "category": "question",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "science_fair_budget-method-materials",
      "name": "Method materials",
      "category": "method",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "science_fair_budget-data-tools",
      "name": "Data tools",
      "category": "data",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "science_fair_budget-display-board",
      "name": "Display board",
      "category": "display",
      "tags": [
        "budget"
      ],
      "cost": 18,
      "quantity": 18,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "science_fair_budget-safety-supplies",
      "name": "Safety supplies",
      "category": "safety",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "acquired": "2026-08-01",
      "condition": "new"
    }
  ]
}
