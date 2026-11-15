import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "car-buying-used-listing-plan-mcp",
  "title": "Used Car Listing Planning Audit",
  "description": "Plan used car listing by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "used_listing_plan",
  "entity": "used car listing plan",
  "categories": [
    {
      "id": "sedan",
      "label": "Sedans",
      "baseline": 2
    },
    {
      "id": "suv",
      "label": "SUVs",
      "baseline": 2
    },
    {
      "id": "truck",
      "label": "Trucks",
      "baseline": 2
    },
    {
      "id": "ev",
      "label": "EVs",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Price",
    "unit": "USD",
    "target": 15000,
    "direction": "lower"
  },
  "target": {
    "maxItems": 12,
    "budget": 40000,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "sedan",
      "label": "Sedan option",
      "categories": [
        "sedan"
      ]
    },
    {
      "id": "suv",
      "label": "SUV option",
      "categories": [
        "suv"
      ]
    },
    {
      "id": "truck",
      "label": "Truck option",
      "categories": [
        "truck"
      ]
    },
    {
      "id": "ev",
      "label": "EV option",
      "categories": [
        "ev"
      ]
    }
  ],
  "sample": [
    {
      "id": "listing-sedan",
      "name": "2019 sedan",
      "category": "sedan",
      "tags": [
        "petrol"
      ],
      "cost": 12000,
      "quantity": 45000,
      "condition": "good"
    },
    {
      "id": "listing-suv",
      "name": "2018 SUV",
      "category": "suv",
      "tags": [
        "awd"
      ],
      "cost": 18000,
      "quantity": 60000,
      "condition": "good"
    },
    {
      "id": "listing-truck",
      "name": "2017 truck",
      "category": "truck",
      "tags": [
        "4x4"
      ],
      "cost": 22000,
      "quantity": 80000,
      "condition": "fair"
    },
    {
      "id": "listing-ev",
      "name": "2020 EV",
      "category": "ev",
      "tags": [
        "electric"
      ],
      "cost": 16000,
      "quantity": 30000,
      "condition": "good"
    }
  ]
}
