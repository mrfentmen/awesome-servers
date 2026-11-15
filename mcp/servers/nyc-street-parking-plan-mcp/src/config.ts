import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "nyc-street-parking-plan-mcp",
  "title": "Street Parking Planning Audit",
  "description": "Plan street parking by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "street_parking_plan",
  "entity": "parking block plan",
  "categories": [
    {
      "id": "signs",
      "label": "Signs",
      "baseline": 2
    },
    {
      "id": "meters",
      "label": "Meters",
      "baseline": 1
    },
    {
      "id": "sweep",
      "label": "Sweep",
      "baseline": 1
    },
    {
      "id": "garage",
      "label": "Garage",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "park_minutes",
    "label": "Park minutes",
    "unit": "min",
    "target": 20,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "signs",
      "label": "Signs",
      "categories": [
        "signs"
      ]
    },
    {
      "id": "meters",
      "label": "Meters",
      "categories": [
        "meters"
      ]
    },
    {
      "id": "sweep",
      "label": "Sweep",
      "categories": [
        "sweep"
      ]
    },
    {
      "id": "garage",
      "label": "Garage",
      "categories": [
        "garage"
      ]
    }
  ],
  "sample": [
    {
      "id": "street_parking_plan-sign-survey",
      "name": "Sign survey",
      "category": "signs",
      "tags": [
        "signs"
      ],
      "cost": 0,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "street_parking_plan-meter-zone",
      "name": "Meter zone",
      "category": "meters",
      "tags": [
        "meters"
      ],
      "cost": 0,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "street_parking_plan-sweep-window",
      "name": "Sweep window",
      "category": "sweep",
      "tags": [
        "sweep"
      ],
      "cost": 0,
      "quantity": 15,
      "condition": "fair"
    },
    {
      "id": "street_parking_plan-garage-fallback",
      "name": "Garage fallback",
      "category": "garage",
      "tags": [
        "garage"
      ],
      "cost": 40,
      "quantity": 6,
      "condition": "good"
    }
  ]
}
