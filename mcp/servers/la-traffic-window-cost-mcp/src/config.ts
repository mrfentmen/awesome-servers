import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "la-traffic-window-cost-mcp",
  "title": "Traffic Window Budget Audit",
  "description": "Audit traffic window budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "traffic_window_budget",
  "entity": "traffic window budget line",
  "categories": [
    {
      "id": "departure",
      "label": "Departure",
      "baseline": 2
    },
    {
      "id": "freeway",
      "label": "Freeway",
      "baseline": 1
    },
    {
      "id": "incidents",
      "label": "Incidents",
      "baseline": 1
    },
    {
      "id": "alternate",
      "label": "Alternate",
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
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "departure",
      "label": "Departure",
      "categories": [
        "departure"
      ]
    },
    {
      "id": "freeway",
      "label": "Freeway",
      "categories": [
        "freeway"
      ]
    },
    {
      "id": "incidents",
      "label": "Incidents",
      "categories": [
        "incidents"
      ]
    },
    {
      "id": "alternate",
      "label": "Alternate",
      "categories": [
        "alternate"
      ]
    }
  ],
  "sample": [
    {
      "id": "traffic_window_budget_budget-route-survey",
      "name": "Route survey",
      "category": "departure",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "traffic_window_budget_budget-fuel",
      "name": "Fuel",
      "category": "freeway",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    },
    {
      "id": "traffic_window_budget_budget-toll-pass",
      "name": "Toll pass",
      "category": "incidents",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "new"
    },
    {
      "id": "traffic_window_budget_budget-transit-backup",
      "name": "Transit backup",
      "category": "alternate",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "new"
    }
  ]
}
