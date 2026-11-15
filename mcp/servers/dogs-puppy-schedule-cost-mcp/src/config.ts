import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "dogs-puppy-schedule-cost-mcp",
  "title": "Puppy Schedule Budget Audit",
  "description": "Audit puppy schedule budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "puppy_schedule_budget",
  "entity": "puppy routine budget line",
  "categories": [
    {
      "id": "feeding",
      "label": "Feeding",
      "baseline": 2
    },
    {
      "id": "potty",
      "label": "Potty",
      "baseline": 2
    },
    {
      "id": "sleep",
      "label": "Sleep",
      "baseline": 1
    },
    {
      "id": "training",
      "label": "Training",
      "baseline": 1
    },
    {
      "id": "play",
      "label": "Play",
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
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "meals",
      "label": "Meal routine",
      "categories": [
        "feeding"
      ]
    },
    {
      "id": "elimination",
      "label": "Potty routine",
      "categories": [
        "potty"
      ]
    },
    {
      "id": "rest",
      "label": "Rest routine",
      "categories": [
        "sleep"
      ]
    },
    {
      "id": "learning",
      "label": "Learning routine",
      "categories": [
        "training",
        "play"
      ]
    }
  ],
  "sample": [
    {
      "id": "puppy_schedule_budget-breakfast",
      "name": "Breakfast",
      "category": "feeding",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "puppy_schedule_budget-potty-break",
      "name": "Potty break",
      "category": "potty",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "puppy_schedule_budget-morning-nap",
      "name": "Morning nap",
      "category": "sleep",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "puppy_schedule_budget-sit-training",
      "name": "Sit training",
      "category": "training",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "good"
    },
    {
      "id": "puppy_schedule_budget-puzzle-play",
      "name": "Puzzle play",
      "category": "play",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "fair"
    },
    {
      "id": "puppy_schedule_budget-dinner",
      "name": "Dinner",
      "category": "feeding",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    }
  ]
}
