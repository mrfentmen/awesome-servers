import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "fitness-strength-progress-cost-mcp",
  "title": "Strength Progress Budget Audit",
  "description": "Audit strength progress budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "strength_progress_budget",
  "entity": "strength lift budget line",
  "categories": [
    {
      "id": "squat",
      "label": "Squat",
      "baseline": 2
    },
    {
      "id": "hinge",
      "label": "Hinge",
      "baseline": 2
    },
    {
      "id": "push",
      "label": "Push",
      "baseline": 2
    },
    {
      "id": "pull",
      "label": "Pull",
      "baseline": 2
    },
    {
      "id": "core",
      "label": "Core",
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
    "budget": 100,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "lower",
      "label": "Lower body",
      "categories": [
        "squat",
        "hinge"
      ]
    },
    {
      "id": "upper-push",
      "label": "Upper push",
      "categories": [
        "push"
      ]
    },
    {
      "id": "upper-pull",
      "label": "Upper pull",
      "categories": [
        "pull"
      ]
    },
    {
      "id": "trunk",
      "label": "Trunk stability",
      "categories": [
        "core"
      ]
    }
  ],
  "sample": [
    {
      "id": "strength_progress_budget-back-squat",
      "name": "Back squat",
      "category": "squat",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "strength_progress_budget-front-squat",
      "name": "Front squat",
      "category": "squat",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "strength_progress_budget-deadlift",
      "name": "Deadlift",
      "category": "hinge",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "strength_progress_budget-hip-thrust",
      "name": "Hip thrust",
      "category": "hinge",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "strength_progress_budget-bench-press",
      "name": "Bench press",
      "category": "push",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "strength_progress_budget-overhead-press",
      "name": "Overhead press",
      "category": "push",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "strength_progress_budget-barbell-row",
      "name": "Barbell row",
      "category": "pull",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "strength_progress_budget-pull-up",
      "name": "Pull-up",
      "category": "pull",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "worn"
    },
    {
      "id": "strength_progress_budget-plank",
      "name": "Plank",
      "category": "core",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    }
  ]
}
