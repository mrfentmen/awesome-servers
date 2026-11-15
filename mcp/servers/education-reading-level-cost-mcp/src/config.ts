import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "education-reading-level-cost-mcp",
  "title": "Reading Level Budget Audit",
  "description": "Audit reading level budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "reading_level_budget",
  "entity": "reading resource budget line",
  "categories": [
    {
      "id": "phonics",
      "label": "Phonics",
      "baseline": 2
    },
    {
      "id": "vocabulary",
      "label": "Vocabulary",
      "baseline": 2
    },
    {
      "id": "fluency",
      "label": "Fluency",
      "baseline": 2
    },
    {
      "id": "comprehension",
      "label": "Comprehension",
      "baseline": 3
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
    "budget": 100,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "phonics",
      "label": "Phonics",
      "categories": [
        "phonics"
      ]
    },
    {
      "id": "vocabulary",
      "label": "Vocabulary",
      "categories": [
        "vocabulary"
      ]
    },
    {
      "id": "fluency",
      "label": "Fluency",
      "categories": [
        "fluency"
      ]
    },
    {
      "id": "comprehension",
      "label": "Comprehension",
      "categories": [
        "comprehension"
      ]
    }
  ],
  "sample": [
    {
      "id": "reading_level_budget-phonics-readers",
      "name": "Phonics readers",
      "category": "phonics",
      "tags": [
        "budget"
      ],
      "cost": 18,
      "quantity": 18,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "reading_level_budget-vocabulary-cards",
      "name": "Vocabulary cards",
      "category": "vocabulary",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "reading_level_budget-fluency-passages",
      "name": "Fluency passages",
      "category": "fluency",
      "tags": [
        "budget"
      ],
      "cost": 8,
      "quantity": 8,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "reading_level_budget-comprehension-sets",
      "name": "Comprehension sets",
      "category": "comprehension",
      "tags": [
        "budget"
      ],
      "cost": 24,
      "quantity": 24,
      "acquired": "2026-08-01",
      "condition": "new"
    }
  ]
}
