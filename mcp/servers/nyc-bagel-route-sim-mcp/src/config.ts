import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "nyc-bagel-route-sim-mcp",
  "title": "Bagel Route Simulator",
  "description": "Simulate bagel route by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "bagel_route_sim",
  "entity": "bagel stop simulation",
  "categories": [
    {
      "id": "stops",
      "label": "Stops",
      "baseline": 2
    },
    {
      "id": "walk",
      "label": "Walk",
      "baseline": 1
    },
    {
      "id": "freshness",
      "label": "Freshness",
      "baseline": 1
    },
    {
      "id": "budget",
      "label": "Budget",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "route_minutes",
    "label": "Route minutes",
    "unit": "min",
    "target": 45,
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
      "id": "stops",
      "label": "Stops",
      "categories": [
        "stops"
      ]
    },
    {
      "id": "walk",
      "label": "Walk",
      "categories": [
        "walk"
      ]
    },
    {
      "id": "freshness",
      "label": "Freshness",
      "categories": [
        "freshness"
      ]
    },
    {
      "id": "budget",
      "label": "Budget",
      "categories": [
        "budget"
      ]
    }
  ],
  "sample": [
    {
      "id": "bagel_route_sim-main-bagel-stop",
      "name": "Main bagel stop",
      "category": "stops",
      "tags": [
        "stops"
      ],
      "cost": 6,
      "quantity": 15,
      "condition": "new"
    },
    {
      "id": "bagel_route_sim-backup-bakery",
      "name": "Backup bakery",
      "category": "walk",
      "tags": [
        "walk"
      ],
      "cost": 5,
      "quantity": 12,
      "condition": "good"
    },
    {
      "id": "bagel_route_sim-walk-link",
      "name": "Walk link",
      "category": "freshness",
      "tags": [
        "freshness"
      ],
      "cost": 0,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "bagel_route_sim-coffee-stop",
      "name": "Coffee stop",
      "category": "budget",
      "tags": [
        "budget"
      ],
      "cost": 4,
      "quantity": 8,
      "condition": "good"
    }
  ]
}
