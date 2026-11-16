import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "transit-micromobility-index-mcp",
  "title": "Micromobility Archive",
  "description": "Archive micromobility by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "micromobility_index",
  "entity": "micromobility option archive",
  "categories": [
    {
      "id": "scooter",
      "label": "Scooter",
      "baseline": 2
    },
    {
      "id": "bike-share",
      "label": "Bike share",
      "baseline": 2
    },
    {
      "id": "dockless",
      "label": "Dockless",
      "baseline": 2
    },
    {
      "id": "cargo",
      "label": "Cargo bike",
      "baseline": 1
    },
    {
      "id": "route",
      "label": "Route",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "cost_per_trip_usd",
    "label": "Cost per trip",
    "unit": "USD",
    "target": 5,
    "direction": "lower"
  },
  "target": {
    "maxItems": 14,
    "budget": 60,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "availability",
      "label": "Vehicle availability",
      "categories": [
        "scooter",
        "bike-share",
        "dockless"
      ]
    },
    {
      "id": "docking",
      "label": "Docking",
      "categories": [
        "bike-share",
        "dockless"
      ]
    },
    {
      "id": "safety",
      "label": "Safe route",
      "categories": [
        "route"
      ]
    },
    {
      "id": "capacity",
      "label": "Carrying capacity",
      "categories": [
        "cargo"
      ]
    }
  ],
  "sample": [
    {
      "id": "micromobility_index-scooter",
      "name": "Scooter ride",
      "category": "scooter",
      "tags": [
        "unlock",
        "short-trip"
      ],
      "cost": 3.5,
      "quantity": 3.5,
      "condition": "good"
    },
    {
      "id": "micromobility_index-scooter-pass",
      "name": "Scooter pass",
      "category": "scooter",
      "tags": [
        "monthly",
        "commute"
      ],
      "cost": 4,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "micromobility_index-bike",
      "name": "Bike-share ride",
      "category": "bike-share",
      "tags": [
        "dock",
        "short-trip"
      ],
      "cost": 7,
      "quantity": 7,
      "condition": "fair"
    },
    {
      "id": "micromobility_index-bike-pass",
      "name": "Bike-share pass",
      "category": "bike-share",
      "tags": [
        "annual",
        "commute"
      ],
      "cost": 9,
      "quantity": 9,
      "condition": "worn"
    },
    {
      "id": "micromobility_index-dockless",
      "name": "Dockless bike",
      "category": "dockless",
      "tags": [
        "app",
        "short-trip"
      ],
      "cost": 5,
      "quantity": 5,
      "condition": "good"
    },
    {
      "id": "micromobility_index-dockless-long",
      "name": "Dockless long trip",
      "category": "dockless",
      "tags": [
        "app",
        "long-trip"
      ],
      "cost": 6,
      "quantity": 6,
      "condition": "good"
    },
    {
      "id": "micromobility_index-cargo",
      "name": "Cargo bike rental",
      "category": "cargo",
      "tags": [
        "hourly",
        "groceries"
      ],
      "cost": 2.5,
      "quantity": 2.5,
      "condition": "good"
    },
    {
      "id": "micromobility_index-route",
      "name": "Station connector",
      "category": "route",
      "tags": [
        "protected",
        "short"
      ],
      "cost": 4.5,
      "quantity": 4.5,
      "condition": "good"
    }
  ]
}
