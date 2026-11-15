import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "nasa-launch-window-cost-mcp",
  "title": "Launch Window Budget Audit",
  "description": "Audit launch window budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "launch_window_budget",
  "entity": "launch window budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 500,
    "direction": "lower"
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
      "id": "launch_window_budget_budget-range-fee",
      "name": "Range fee",
      "category": "date",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "launch_window_budget_budget-weather-brief",
      "name": "Weather brief",
      "category": "weather",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "launch_window_budget_budget-travel",
      "name": "Travel",
      "category": "range",
      "tags": [
        "budget"
      ],
      "cost": 400,
      "quantity": 400,
      "condition": "new"
    },
    {
      "id": "launch_window_budget_budget-backup-window",
      "name": "Backup window",
      "category": "backup",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
