import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "snow-winter-travel-sim-mcp",
  "title": "Winter Travel Simulator",
  "description": "Simulate winter travel by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "winter_travel_sim",
  "entity": "winter travel item simulation",
  "categories": [
    {
      "id": "vehicle",
      "label": "Vehicle",
      "baseline": 2
    },
    {
      "id": "emergency",
      "label": "Emergency",
      "baseline": 1
    },
    {
      "id": "route",
      "label": "Route",
      "baseline": 1
    },
    {
      "id": "clothing",
      "label": "Clothing",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "tread_depth",
    "label": "Tire tread",
    "unit": "mm",
    "target": 4,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 1000,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "vehicle",
      "label": "Vehicle",
      "categories": [
        "vehicle"
      ]
    },
    {
      "id": "emergency",
      "label": "Emergency",
      "categories": [
        "emergency"
      ]
    },
    {
      "id": "route",
      "label": "Route",
      "categories": [
        "route"
      ]
    },
    {
      "id": "clothing",
      "label": "Clothing",
      "categories": [
        "clothing"
      ]
    }
  ],
  "sample": [
    {
      "id": "winter_travel_sim-winter-tires",
      "name": "Winter tires",
      "category": "vehicle",
      "tags": [
        "vehicle"
      ],
      "cost": 600,
      "quantity": 6,
      "condition": "good"
    },
    {
      "id": "winter_travel_sim-emergency-kit",
      "name": "Emergency kit",
      "category": "emergency",
      "tags": [
        "emergency"
      ],
      "cost": 80,
      "quantity": 1,
      "condition": "new"
    },
    {
      "id": "winter_travel_sim-mountain-pass",
      "name": "Mountain pass",
      "category": "route",
      "tags": [
        "route"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "fair"
    },
    {
      "id": "winter_travel_sim-insulated-coat",
      "name": "Insulated coat",
      "category": "clothing",
      "tags": [
        "clothing"
      ],
      "cost": 150,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
