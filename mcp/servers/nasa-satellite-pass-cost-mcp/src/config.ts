import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "nasa-satellite-pass-cost-mcp",
  "title": "Satellite Pass Budget Audit",
  "description": "Audit satellite pass budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "satellite_pass_budget",
  "entity": "satellite pass budget line",
  "categories": [
    {
      "id": "time",
      "label": "Time",
      "baseline": 2
    },
    {
      "id": "elevation",
      "label": "Elevation",
      "baseline": 1
    },
    {
      "id": "visibility",
      "label": "Visibility",
      "baseline": 1
    },
    {
      "id": "radio",
      "label": "Radio",
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
    "budget": 300,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "time",
      "label": "Time",
      "categories": [
        "time"
      ]
    },
    {
      "id": "elevation",
      "label": "Elevation",
      "categories": [
        "elevation"
      ]
    },
    {
      "id": "visibility",
      "label": "Visibility",
      "categories": [
        "visibility"
      ]
    },
    {
      "id": "radio",
      "label": "Radio",
      "categories": [
        "radio"
      ]
    }
  ],
  "sample": [
    {
      "id": "satellite_pass_budget_budget-antenna",
      "name": "Antenna",
      "category": "time",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "new"
    },
    {
      "id": "satellite_pass_budget_budget-radio",
      "name": "Radio",
      "category": "elevation",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    },
    {
      "id": "satellite_pass_budget_budget-tracking-app",
      "name": "Tracking app",
      "category": "visibility",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "satellite_pass_budget_budget-cable",
      "name": "Cable",
      "category": "radio",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "new"
    }
  ]
}
