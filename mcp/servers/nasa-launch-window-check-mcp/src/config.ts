import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "nasa-launch-window-check-mcp",
  "title": "Launch Window Audit",
  "description": "Audit launch dates, weather constraints, range status and backup windows. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "launch_window",
  "entity": "launch window",
  "categories": [
    {
      "id": "date",
      "label": "Date",
      "baseline": 2
    },
    {
      "id": "weather",
      "label": "Weather",
      "baseline": 1
    },
    {
      "id": "range",
      "label": "Range",
      "baseline": 1
    },
    {
      "id": "backup",
      "label": "Backup",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "window_hours",
    "label": "Window hours",
    "unit": "h",
    "target": 2,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 500,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "date",
      "label": "Date",
      "categories": [
        "date"
      ]
    },
    {
      "id": "weather",
      "label": "Weather",
      "categories": [
        "weather"
      ]
    },
    {
      "id": "range",
      "label": "Range",
      "categories": [
        "range"
      ]
    },
    {
      "id": "backup",
      "label": "Backup",
      "categories": [
        "backup"
      ]
    }
  ],
  "sample": [
    {
      "id": "launch_window-primary-window",
      "name": "Primary window",
      "category": "date",
      "tags": [
        "date"
      ],
      "cost": 0,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "launch_window-weather-check",
      "name": "Weather check",
      "category": "weather",
      "tags": [
        "weather"
      ],
      "cost": 0,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "launch_window-range-status",
      "name": "Range status",
      "category": "range",
      "tags": [
        "range"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "launch_window-backup-window",
      "name": "Backup window",
      "category": "backup",
      "tags": [
        "backup"
      ],
      "cost": 0,
      "quantity": 3,
      "condition": "good"
    }
  ]
}
