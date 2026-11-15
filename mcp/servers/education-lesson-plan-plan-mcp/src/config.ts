import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "education-lesson-plan-plan-mcp",
  "title": "Lesson Plan Planning Audit",
  "description": "Plan lesson plan by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "lesson_plan_plan",
  "entity": "lesson component plan",
  "categories": [
    {
      "id": "objectives",
      "label": "Objectives",
      "baseline": 2
    },
    {
      "id": "activities",
      "label": "Activities",
      "baseline": 3
    },
    {
      "id": "assessment",
      "label": "Assessment",
      "baseline": 2
    },
    {
      "id": "materials",
      "label": "Materials",
      "baseline": 2
    },
    {
      "id": "differentiation",
      "label": "Differentiation",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "standards_coverage",
    "label": "Standards coverage",
    "unit": "%",
    "target": 80,
    "direction": "higher"
  },
  "target": {
    "maxItems": 30,
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "objectives",
      "label": "Objectives",
      "categories": [
        "objectives"
      ]
    },
    {
      "id": "activities",
      "label": "Activities",
      "categories": [
        "activities"
      ]
    },
    {
      "id": "assessment",
      "label": "Assessment",
      "categories": [
        "assessment"
      ]
    },
    {
      "id": "materials",
      "label": "Materials",
      "categories": [
        "materials"
      ]
    },
    {
      "id": "differentiation",
      "label": "Differentiation",
      "categories": [
        "differentiation"
      ]
    }
  ],
  "sample": [
    {
      "id": "lesson_plan_plan-fractions-objective",
      "name": "Fractions objective",
      "category": "objectives",
      "tags": [
        "math",
        "fractions"
      ],
      "cost": 0,
      "quantity": 94,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "new"
    },
    {
      "id": "lesson_plan_plan-reading-objective",
      "name": "Reading objective",
      "category": "objectives",
      "tags": [
        "reading",
        "vocabulary"
      ],
      "cost": 0,
      "quantity": 76,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "lesson_plan_plan-fraction-circles-activity",
      "name": "Fraction circles activity",
      "category": "activities",
      "tags": [
        "math",
        "hands-on"
      ],
      "cost": 18,
      "quantity": 88,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "lesson_plan_plan-partner-reading",
      "name": "Partner reading",
      "category": "activities",
      "tags": [
        "reading",
        "peer"
      ],
      "cost": 0,
      "quantity": 82,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "lesson_plan_plan-exit-ticket",
      "name": "Exit ticket",
      "category": "assessment",
      "tags": [
        "formative"
      ],
      "cost": 2,
      "quantity": 90,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "new"
    },
    {
      "id": "lesson_plan_plan-short-quiz",
      "name": "Short quiz",
      "category": "assessment",
      "tags": [
        "assessment"
      ],
      "cost": 0,
      "quantity": 72,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "lesson_plan_plan-fraction-circle-set",
      "name": "Fraction circle set",
      "category": "materials",
      "tags": [
        "manipulative"
      ],
      "cost": 24,
      "quantity": 85,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "lesson_plan_plan-leveled-readers",
      "name": "Leveled readers",
      "category": "materials",
      "tags": [
        "reading",
        "leveled"
      ],
      "cost": 30,
      "quantity": 78,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "lesson_plan_plan-language-support",
      "name": "Language support",
      "category": "differentiation",
      "tags": [
        "ell",
        "support"
      ],
      "cost": 0,
      "quantity": 68,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "lesson_plan_plan-extension-task",
      "name": "Extension task",
      "category": "differentiation",
      "tags": [
        "gifted",
        "extension"
      ],
      "cost": 0,
      "quantity": 74,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    }
  ]
}
