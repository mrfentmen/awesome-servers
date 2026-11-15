import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "dogs-puppy-schedule-sim-mcp",
  "title": "Puppy Schedule Simulator",
  "description": "Simulate puppy schedule by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "puppy_schedule_sim",
  "entity": "puppy routine simulation",
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
    "id": "routine_gaps",
    "label": "Routine gaps",
    "unit": "gaps",
    "target": 0,
    "direction": "lower"
  },
  "target": {
    "maxItems": 24,
    "budget": 300,
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
      "id": "puppy_schedule_sim-breakfast",
      "name": "Breakfast",
      "category": "feeding",
      "tags": [
        "7am",
        "puppy"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "puppy_schedule_sim-potty",
      "name": "Potty break",
      "category": "potty",
      "tags": [
        "every-2h",
        "outdoor"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "puppy_schedule_sim-nap",
      "name": "Morning nap",
      "category": "sleep",
      "tags": [
        "crate",
        "90min"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "fair"
    },
    {
      "id": "puppy_schedule_sim-sit",
      "name": "Sit training",
      "category": "training",
      "tags": [
        "5min",
        "treats"
      ],
      "cost": 12,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "puppy_schedule_sim-play",
      "name": "Puzzle play",
      "category": "play",
      "tags": [
        "mental",
        "10min"
      ],
      "cost": 20,
      "quantity": 1,
      "condition": "fair"
    },
    {
      "id": "puppy_schedule_sim-dinner",
      "name": "Dinner",
      "category": "feeding",
      "tags": [
        "6pm",
        "puppy"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    }
  ]
}
