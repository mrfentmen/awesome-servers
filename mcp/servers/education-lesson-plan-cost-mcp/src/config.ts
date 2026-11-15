import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "education-lesson-plan-cost-mcp",
  "title": "Lesson Plan Budget Audit",
  "description": "Audit lesson plan budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "lesson_plan_budget",
  "entity": "lesson component budget line",
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
      "id": "lesson_plan_budget-objectives-planning",
      "name": "Objectives planning",
      "category": "objectives",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "lesson_plan_budget-activity-prep",
      "name": "Activity prep",
      "category": "activities",
      "tags": [
        "budget"
      ],
      "cost": 35,
      "quantity": 35,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "lesson_plan_budget-assessment-printing",
      "name": "Assessment printing",
      "category": "assessment",
      "tags": [
        "budget"
      ],
      "cost": 10,
      "quantity": 10,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "lesson_plan_budget-materials",
      "name": "Materials",
      "category": "materials",
      "tags": [
        "budget"
      ],
      "cost": 54,
      "quantity": 54,
      "acquired": "2026-08-01",
      "condition": "new"
    },
    {
      "id": "lesson_plan_budget-differentiation-prep",
      "name": "Differentiation prep",
      "category": "differentiation",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "acquired": "2026-08-01",
      "condition": "new"
    }
  ]
}
