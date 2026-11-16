import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "transit-park-and-ride-sim-mcp",
  "title": "Park and Ride Simulator",
  "description": "Simulate park and ride by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "park_and_ride_sim",
  "entity": "parking option simulation",
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
    "id": "walk_minutes",
    "label": "Walk time",
    "unit": "min",
    "target": 8,
    "direction": "lower"
  },
  "target": {
    "maxItems": 16,
    "budget": 100,
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
      "id": "park_and_ride_sim-main-lot",
      "name": "Main lot",
      "category": "lot",
      "tags": [
        "paved",
        "daily"
      ],
      "cost": 4,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "park_and_ride_sim-north-lot",
      "name": "North lot",
      "category": "lot",
      "tags": [
        "gravel",
        "overflow"
      ],
      "cost": 4,
      "quantity": 5,
      "condition": "good"
    },
    {
      "id": "park_and_ride_sim-garage",
      "name": "Station garage",
      "category": "garage",
      "tags": [
        "covered",
        "daily"
      ],
      "cost": 6,
      "quantity": 9,
      "condition": "fair"
    },
    {
      "id": "park_and_ride_sim-upper",
      "name": "Upper garage",
      "category": "garage",
      "tags": [
        "covered",
        "remote"
      ],
      "cost": 6,
      "quantity": 14,
      "condition": "worn"
    },
    {
      "id": "park_and_ride_sim-street",
      "name": "Street parking",
      "category": "street",
      "tags": [
        "metered",
        "limited"
      ],
      "cost": 0,
      "quantity": 3,
      "condition": "good"
    },
    {
      "id": "park_and_ride_sim-side-street",
      "name": "Side street",
      "category": "street",
      "tags": [
        "free",
        "limited"
      ],
      "cost": 0,
      "quantity": 7,
      "condition": "good"
    },
    {
      "id": "park_and_ride_sim-overflow",
      "name": "Overflow field",
      "category": "overflow",
      "tags": [
        "event",
        "distant"
      ],
      "cost": 0,
      "quantity": 11,
      "condition": "good"
    },
    {
      "id": "park_and_ride_sim-ev",
      "name": "EV charger",
      "category": "ev",
      "tags": [
        "level-2",
        "four-spots"
      ],
      "cost": 6,
      "quantity": 6,
      "condition": "good"
    }
  ]
}
