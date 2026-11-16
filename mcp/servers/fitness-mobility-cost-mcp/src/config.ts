import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "fitness-mobility-cost-mcp",
  "title": "Mobility Budget Audit",
  "description": "Audit mobility budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "mobility_budget",
  "entity": "mobility movement budget line",
  "categories": [
    {
      "id": "hips",
      "label": "Hips",
      "baseline": 2
    },
    {
      "id": "shoulders",
      "label": "Shoulders",
      "baseline": 2
    },
    {
      "id": "ankles",
      "label": "Ankles",
      "baseline": 2
    },
    {
      "id": "spine",
      "label": "Spine",
      "baseline": 2
    },
    {
      "id": "wrists",
      "label": "Wrists",
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
      "id": "deep-squat",
      "label": "Deep squat",
      "categories": [
        "hips",
        "ankles"
      ]
    },
    {
      "id": "overhead",
      "label": "Overhead reach",
      "categories": [
        "shoulders",
        "spine"
      ]
    },
    {
      "id": "floor",
      "label": "Floor work",
      "categories": [
        "hips",
        "wrists"
      ]
    },
    {
      "id": "rotation",
      "label": "Rotation",
      "categories": [
        "spine",
        "shoulders"
      ]
    }
  ],
  "sample": [
    {
      "id": "mobility_budget-hip-flexor-stretch",
      "name": "Hip flexor stretch",
      "category": "hips",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "mobility_budget-90-90-switch",
      "name": "90/90 switch",
      "category": "hips",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "mobility_budget-wall-shoulder-slide",
      "name": "Wall shoulder slide",
      "category": "shoulders",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "mobility_budget-thoracic-opener",
      "name": "Thoracic opener",
      "category": "shoulders",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "mobility_budget-calf-stretch",
      "name": "Calf stretch",
      "category": "ankles",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "mobility_budget-ankle-rocks",
      "name": "Ankle rocks",
      "category": "ankles",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "mobility_budget-cat-cow",
      "name": "Cat-cow",
      "category": "spine",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "mobility_budget-wrist-circles",
      "name": "Wrist circles",
      "category": "wrists",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    }
  ]
}
