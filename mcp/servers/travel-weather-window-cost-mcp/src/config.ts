import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "travel-weather-window-cost-mcp",
  "title": "Weather Window Budget Audit",
  "description": "Audit weather window budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "weather_window_budget",
  "entity": "weather window budget line",
  "categories": [
    {
      "id": "day1",
      "label": "Day 1",
      "baseline": 1
    },
    {
      "id": "day2",
      "label": "Day 2",
      "baseline": 1
    },
    {
      "id": "day3",
      "label": "Day 3",
      "baseline": 1
    },
    {
      "id": "backup",
      "label": "Backup",
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
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "day1",
      "label": "Day 1 window",
      "categories": [
        "day1"
      ]
    },
    {
      "id": "day2",
      "label": "Day 2 window",
      "categories": [
        "day2"
      ]
    },
    {
      "id": "day3",
      "label": "Day 3 window",
      "categories": [
        "day3"
      ]
    },
    {
      "id": "backup",
      "label": "Backup window",
      "categories": [
        "backup"
      ]
    }
  ],
  "sample": [
    {
      "id": "weather_window_budget-saturday-window",
      "name": "Saturday window",
      "category": "day1",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "weather_window_budget-sunday-window",
      "name": "Sunday window",
      "category": "day2",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "weather_window_budget-monday-window",
      "name": "Monday window",
      "category": "day3",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "weather_window_budget-indoor-backup",
      "name": "Indoor backup",
      "category": "backup",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "good"
    }
  ]
}
