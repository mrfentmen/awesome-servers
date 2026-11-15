import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "fitness-sleep-debt-cost-mcp",
  "title": "Sleep Debt Budget Audit",
  "description": "Audit sleep debt budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "sleep_debt_budget",
  "entity": "sleep entry budget line",
  "categories": [
    {
      "id": "weekday",
      "label": "Weekdays",
      "baseline": 2
    },
    {
      "id": "weekend",
      "label": "Weekends",
      "baseline": 2
    },
    {
      "id": "nap",
      "label": "Naps",
      "baseline": 2
    },
    {
      "id": "bedtime",
      "label": "Bedtime",
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
    "budget": 100,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "weekday",
      "label": "Weekday sleep",
      "categories": [
        "weekday"
      ]
    },
    {
      "id": "weekend",
      "label": "Weekend sleep",
      "categories": [
        "weekend"
      ]
    },
    {
      "id": "nap",
      "label": "Naps",
      "categories": [
        "nap"
      ]
    },
    {
      "id": "bedtime",
      "label": "Bedtime",
      "categories": [
        "bedtime"
      ]
    }
  ],
  "sample": [
    {
      "id": "sleep_debt_budget-monday-night",
      "name": "Monday night",
      "category": "weekday",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "sleep_debt_budget-saturday-night",
      "name": "Saturday night",
      "category": "weekend",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "sleep_debt_budget-afternoon-nap",
      "name": "Afternoon nap",
      "category": "nap",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "sleep_debt_budget-bedtime-routine",
      "name": "Bedtime routine",
      "category": "bedtime",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    }
  ]
}
