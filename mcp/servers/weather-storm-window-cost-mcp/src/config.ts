import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "weather-storm-window-cost-mcp",
  "title": "Storm Window Budget Audit",
  "description": "Audit storm window budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "storm_window_budget",
  "entity": "window item budget line",
  "categories": [
    {
      "id": "glass",
      "label": "Glass",
      "baseline": 2
    },
    {
      "id": "frame",
      "label": "Frame",
      "baseline": 1
    },
    {
      "id": "seal",
      "label": "Seal",
      "baseline": 1
    },
    {
      "id": "drain",
      "label": "Drain",
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
    "budget": 950,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "glass",
      "label": "Glass",
      "categories": [
        "glass"
      ]
    },
    {
      "id": "frame",
      "label": "Frame",
      "categories": [
        "frame"
      ]
    },
    {
      "id": "seal",
      "label": "Seal",
      "categories": [
        "seal"
      ]
    },
    {
      "id": "drain",
      "label": "Drain",
      "categories": [
        "drain"
      ]
    }
  ],
  "sample": [
    {
      "id": "storm_window_budget-window-replacement",
      "name": "Window replacement",
      "category": "glass",
      "tags": [
        "budget"
      ],
      "cost": 400,
      "quantity": 400,
      "condition": "new"
    },
    {
      "id": "storm_window_budget-frame-repair",
      "name": "Frame repair",
      "category": "frame",
      "tags": [
        "budget"
      ],
      "cost": 250,
      "quantity": 250,
      "condition": "new"
    },
    {
      "id": "storm_window_budget-weatherstrip",
      "name": "Weatherstrip",
      "category": "seal",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "new"
    },
    {
      "id": "storm_window_budget-drain-clearing",
      "name": "Drain clearing",
      "category": "drain",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    }
  ]
}
