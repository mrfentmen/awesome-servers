import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "fitness-strength-progress-check-mcp",
  "title": "Strength Progress Audit",
  "description": "Audit strength progress by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "strength_progress",
  "entity": "strength lift",
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
    "id": "progress_pct",
    "label": "Four-week progress",
    "unit": "%",
    "target": 2,
    "direction": "higher"
  },
  "target": {
    "maxItems": 15,
    "budget": 120,
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
      "id": "strength_progress-back-squat",
      "name": "Back squat",
      "category": "squat",
      "tags": [
        "barbell",
        "lower"
      ],
      "cost": 0,
      "quantity": 3.2,
      "condition": "good"
    },
    {
      "id": "strength_progress-front-squat",
      "name": "Front squat",
      "category": "squat",
      "tags": [
        "barbell",
        "quad"
      ],
      "cost": 0,
      "quantity": 1.8,
      "condition": "good"
    },
    {
      "id": "strength_progress-deadlift",
      "name": "Deadlift",
      "category": "hinge",
      "tags": [
        "barbell",
        "posterior"
      ],
      "cost": 0,
      "quantity": 2.6,
      "condition": "good"
    },
    {
      "id": "strength_progress-hip-thrust",
      "name": "Hip thrust",
      "category": "hinge",
      "tags": [
        "barbell",
        "glute"
      ],
      "cost": 0,
      "quantity": 1.1,
      "condition": "fair"
    },
    {
      "id": "strength_progress-bench",
      "name": "Bench press",
      "category": "push",
      "tags": [
        "barbell",
        "chest"
      ],
      "cost": 0,
      "quantity": 2.2,
      "condition": "good"
    },
    {
      "id": "strength_progress-overhead",
      "name": "Overhead press",
      "category": "push",
      "tags": [
        "barbell",
        "shoulder"
      ],
      "cost": 0,
      "quantity": 0.8,
      "condition": "fair"
    },
    {
      "id": "strength_progress-row",
      "name": "Barbell row",
      "category": "pull",
      "tags": [
        "barbell",
        "back"
      ],
      "cost": 0,
      "quantity": 1.9,
      "condition": "good"
    },
    {
      "id": "strength_progress-pullup",
      "name": "Pull-up",
      "category": "pull",
      "tags": [
        "bodyweight",
        "back"
      ],
      "cost": 0,
      "quantity": 0.3,
      "condition": "worn"
    },
    {
      "id": "strength_progress-plank",
      "name": "Plank",
      "category": "core",
      "tags": [
        "bodyweight",
        "trunk"
      ],
      "cost": 0,
      "quantity": 4,
      "condition": "good"
    }
  ]
}
