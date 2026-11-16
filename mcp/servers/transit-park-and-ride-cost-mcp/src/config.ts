import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "transit-park-and-ride-cost-mcp",
  "title": "Park and Ride Budget Audit",
  "description": "Audit park and ride budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "park_and_ride_budget",
  "entity": "parking option budget line",
  "categories": [
    {
      "id": "lot",
      "label": "Lot",
      "baseline": 2
    },
    {
      "id": "garage",
      "label": "Garage",
      "baseline": 2
    },
    {
      "id": "street",
      "label": "Street",
      "baseline": 2
    },
    {
      "id": "overflow",
      "label": "Overflow",
      "baseline": 1
    },
    {
      "id": "ev",
      "label": "EV",
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
      "id": "lot",
      "label": "Primary parking",
      "categories": [
        "lot",
        "garage"
      ]
    },
    {
      "id": "overflow",
      "label": "Overflow parking",
      "categories": [
        "overflow"
      ]
    },
    {
      "id": "access",
      "label": "Station access",
      "categories": [
        "street"
      ]
    },
    {
      "id": "charging",
      "label": "EV charging",
      "categories": [
        "ev"
      ]
    }
  ],
  "sample": [
    {
      "id": "park_and_ride_budget-main-lot",
      "name": "Main lot",
      "category": "lot",
      "tags": [
        "budget"
      ],
      "cost": 4,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "park_and_ride_budget-north-lot",
      "name": "North lot",
      "category": "lot",
      "tags": [
        "budget"
      ],
      "cost": 4,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "park_and_ride_budget-station-garage",
      "name": "Station garage",
      "category": "garage",
      "tags": [
        "budget"
      ],
      "cost": 6,
      "quantity": 6,
      "condition": "fair"
    },
    {
      "id": "park_and_ride_budget-upper-garage",
      "name": "Upper garage",
      "category": "garage",
      "tags": [
        "budget"
      ],
      "cost": 6,
      "quantity": 6,
      "condition": "worn"
    },
    {
      "id": "park_and_ride_budget-street-parking",
      "name": "Street parking",
      "category": "street",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "park_and_ride_budget-side-street",
      "name": "Side street",
      "category": "street",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "park_and_ride_budget-overflow-field",
      "name": "Overflow field",
      "category": "overflow",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "park_and_ride_budget-ev-charger",
      "name": "EV charger",
      "category": "ev",
      "tags": [
        "budget"
      ],
      "cost": 6,
      "quantity": 6,
      "condition": "good"
    }
  ]
}
