import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "transit-micromobility-cost-mcp",
  "title": "Micromobility Budget Audit",
  "description": "Audit micromobility budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "micromobility_budget",
  "entity": "micromobility option budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 50,
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
      "id": "micromobility_budget-scooter-ride",
      "name": "Scooter ride",
      "category": "scooter",
      "tags": [
        "budget"
      ],
      "cost": 3.5,
      "quantity": 3.5,
      "condition": "good"
    },
    {
      "id": "micromobility_budget-scooter-pass",
      "name": "Scooter pass",
      "category": "scooter",
      "tags": [
        "budget"
      ],
      "cost": 4,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "micromobility_budget-bike-share-ride",
      "name": "Bike-share ride",
      "category": "bike-share",
      "tags": [
        "budget"
      ],
      "cost": 7,
      "quantity": 7,
      "condition": "fair"
    },
    {
      "id": "micromobility_budget-bike-share-pass",
      "name": "Bike-share pass",
      "category": "bike-share",
      "tags": [
        "budget"
      ],
      "cost": 9,
      "quantity": 9,
      "condition": "worn"
    },
    {
      "id": "micromobility_budget-dockless-bike",
      "name": "Dockless bike",
      "category": "dockless",
      "tags": [
        "budget"
      ],
      "cost": 5,
      "quantity": 5,
      "condition": "good"
    },
    {
      "id": "micromobility_budget-dockless-long-trip",
      "name": "Dockless long trip",
      "category": "dockless",
      "tags": [
        "budget"
      ],
      "cost": 6,
      "quantity": 6,
      "condition": "good"
    },
    {
      "id": "micromobility_budget-cargo-bike-rental",
      "name": "Cargo bike rental",
      "category": "cargo",
      "tags": [
        "budget"
      ],
      "cost": 2.5,
      "quantity": 2.5,
      "condition": "good"
    },
    {
      "id": "micromobility_budget-station-connector",
      "name": "Station connector",
      "category": "route",
      "tags": [
        "budget"
      ],
      "cost": 4.5,
      "quantity": 4.5,
      "condition": "good"
    }
  ]
}
