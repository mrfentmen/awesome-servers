import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "travel-weather-window-check-mcp",
  "title": "Weather Window Audit",
  "description": "Audit travel days for dry hours, coverage and backup windows. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "weather_window",
  "entity": "weather window",
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
    "id": "service_gap",
    "label": "Dry hours",
    "unit": "hours",
    "target": 4,
    "direction": "higher"
  },
  "target": {
    "maxItems": 8,
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
      "id": "weather-day1",
      "name": "Saturday window",
      "category": "day1",
      "tags": [
        "clear"
      ],
      "cost": 0,
      "quantity": 6,
      "condition": "good"
    },
    {
      "id": "weather-day2",
      "name": "Sunday window",
      "category": "day2",
      "tags": [
        "cloud"
      ],
      "cost": 0,
      "quantity": 3,
      "condition": "fair"
    },
    {
      "id": "weather-day3",
      "name": "Monday window",
      "category": "day3",
      "tags": [
        "clear"
      ],
      "cost": 0,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "weather-backup",
      "name": "Indoor backup",
      "category": "backup",
      "tags": [
        "rain"
      ],
      "cost": 20,
      "quantity": 2,
      "condition": "good"
    }
  ]
}
