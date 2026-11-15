import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "rain-commute-rain-sim-mcp",
  "title": "Commute Rain Simulator",
  "description": "Simulate commute rain by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "commute_rain_sim",
  "entity": "rain commute item simulation",
  "categories": [
    {
      "id": "coat",
      "label": "Coat",
      "baseline": 2
    },
    {
      "id": "shoes",
      "label": "Shoes",
      "baseline": 1
    },
    {
      "id": "bag",
      "label": "Bag",
      "baseline": 1
    },
    {
      "id": "route",
      "label": "Route",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "rain_readiness",
    "label": "Rain readiness",
    "unit": "score",
    "target": 3,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 300,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "coat",
      "label": "Coat",
      "categories": [
        "coat"
      ]
    },
    {
      "id": "shoes",
      "label": "Shoes",
      "categories": [
        "shoes"
      ]
    },
    {
      "id": "bag",
      "label": "Bag",
      "categories": [
        "bag"
      ]
    },
    {
      "id": "route",
      "label": "Route",
      "categories": [
        "route"
      ]
    }
  ],
  "sample": [
    {
      "id": "commute_rain_sim-rain-shell",
      "name": "Rain shell",
      "category": "coat",
      "tags": [
        "coat"
      ],
      "cost": 80,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "commute_rain_sim-waterproof-shoes",
      "name": "Waterproof shoes",
      "category": "shoes",
      "tags": [
        "shoes"
      ],
      "cost": 100,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "commute_rain_sim-dry-bag",
      "name": "Dry bag",
      "category": "bag",
      "tags": [
        "bag"
      ],
      "cost": 30,
      "quantity": 1,
      "condition": "new"
    },
    {
      "id": "commute_rain_sim-covered-route",
      "name": "Covered route",
      "category": "route",
      "tags": [
        "route"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
