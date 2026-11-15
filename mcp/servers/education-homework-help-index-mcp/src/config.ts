import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "education-homework-help-index-mcp",
  "title": "Homework Help Archive",
  "description": "Archive homework help by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "homework_help_index",
  "entity": "homework support resource archive",
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
    "id": "help_minutes",
    "label": "Help minutes",
    "unit": "min",
    "target": 30,
    "direction": "lower"
  },
  "target": {
    "maxItems": 30,
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
      "id": "homework_help_index-fraction-worked-example",
      "name": "Fraction worked example",
      "category": "math",
      "tags": [
        "math",
        "example"
      ],
      "cost": 0,
      "quantity": 20,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "homework_help_index-algebra-hint-card",
      "name": "Algebra hint card",
      "category": "math",
      "tags": [
        "math",
        "hint"
      ],
      "cost": 0,
      "quantity": 35,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "homework_help_index-lab-report-template",
      "name": "Lab report template",
      "category": "science",
      "tags": [
        "science",
        "template"
      ],
      "cost": 0,
      "quantity": 25,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "homework_help_index-science-vocabulary-sheet",
      "name": "Science vocabulary sheet",
      "category": "science",
      "tags": [
        "science",
        "vocabulary"
      ],
      "cost": 0,
      "quantity": 18,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "homework_help_index-paragraph-outline",
      "name": "Paragraph outline",
      "category": "language",
      "tags": [
        "writing",
        "outline"
      ],
      "cost": 0,
      "quantity": 28,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "homework_help_index-grammar-checklist",
      "name": "Grammar checklist",
      "category": "language",
      "tags": [
        "language",
        "checklist"
      ],
      "cost": 0,
      "quantity": 16,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "homework_help_index-weekly-planner",
      "name": "Weekly planner",
      "category": "study-skills",
      "tags": [
        "study-skills",
        "planner"
      ],
      "cost": 5,
      "quantity": 12,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "new"
    },
    {
      "id": "homework_help_index-flashcard-routine",
      "name": "Flashcard routine",
      "category": "study-skills",
      "tags": [
        "study-skills",
        "memory"
      ],
      "cost": 0,
      "quantity": 22,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    }
  ]
}
