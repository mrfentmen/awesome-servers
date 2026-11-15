import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "transit-bus-reliability-cost-mcp",
  "title": "Bus Reliability Budget Audit",
  "description": "Audit bus reliability budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "bus_reliability_budget",
  "entity": "transit route budget line",
  "categories": [
    {
      "id": "bus",
      "label": "Bus",
      "baseline": 2
    },
    {
      "id": "rail",
      "label": "Rail",
      "baseline": 2
    },
    {
      "id": "shuttle",
      "label": "Shuttle",
      "baseline": 2
    },
    {
      "id": "ferry",
      "label": "Ferry",
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
      "id": "bus",
      "label": "Bus route",
      "categories": [
        "bus"
      ]
    },
    {
      "id": "rail",
      "label": "Rail route",
      "categories": [
        "rail"
      ]
    },
    {
      "id": "shuttle",
      "label": "Shuttle",
      "categories": [
        "shuttle"
      ]
    },
    {
      "id": "ferry",
      "label": "Ferry",
      "categories": [
        "ferry"
      ]
    }
  ],
  "sample": [
    {
      "id": "bus_reliability_budget-downtown-bus",
      "name": "Downtown bus",
      "category": "bus",
      "tags": [
        "budget"
      ],
      "cost": 3,
      "quantity": 3,
      "condition": "good"
    },
    {
      "id": "bus_reliability_budget-commuter-rail",
      "name": "Commuter rail",
      "category": "rail",
      "tags": [
        "budget"
      ],
      "cost": 6,
      "quantity": 6,
      "condition": "good"
    },
    {
      "id": "bus_reliability_budget-airport-shuttle",
      "name": "Airport shuttle",
      "category": "shuttle",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "fair"
    },
    {
      "id": "bus_reliability_budget-harbour-ferry",
      "name": "Harbour ferry",
      "category": "ferry",
      "tags": [
        "budget"
      ],
      "cost": 8,
      "quantity": 8,
      "condition": "fair"
    }
  ]
}
