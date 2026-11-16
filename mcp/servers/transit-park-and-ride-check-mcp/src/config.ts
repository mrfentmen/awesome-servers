import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "transit-park-and-ride-check-mcp",
  "title": "Park and Ride Audit",
  "description": "Audit park and ride by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "park_and_ride",
  "entity": "parking option",
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
      "id": "park_and_ride-main-lot",
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
      "id": "park_and_ride-north-lot",
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
      "id": "park_and_ride-garage",
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
      "id": "park_and_ride-upper",
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
      "id": "park_and_ride-street",
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
      "id": "park_and_ride-side-street",
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
      "id": "park_and_ride-overflow",
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
      "id": "park_and_ride-ev",
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
