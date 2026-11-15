import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "fitness-sleep-debt-match-mcp",
  "title": "Sleep Debt Match Audit",
  "description": "Match sleep debt by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "sleep_debt_match",
  "entity": "sleep entry match",
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
    "id": "service_gap",
    "label": "Sleep hours",
    "unit": "hours",
    "target": 8,
    "direction": "higher"
  },
  "target": {
    "maxItems": 15,
    "budget": 0,
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
      "id": "sleep-weekday",
      "name": "Monday night",
      "category": "weekday",
      "tags": [
        "worknight"
      ],
      "cost": 0,
      "quantity": 6.5,
      "condition": "fair"
    },
    {
      "id": "sleep-weekend",
      "name": "Saturday night",
      "category": "weekend",
      "tags": [
        "recovery"
      ],
      "cost": 0,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "sleep-nap",
      "name": "Afternoon nap",
      "category": "nap",
      "tags": [
        "short"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "sleep-bedtime",
      "name": "Bedtime routine",
      "category": "bedtime",
      "tags": [
        "routine"
      ],
      "cost": 0,
      "quantity": 7,
      "condition": "fair"
    }
  ]
}
