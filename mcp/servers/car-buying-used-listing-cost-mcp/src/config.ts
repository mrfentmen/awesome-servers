import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "car-buying-used-listing-cost-mcp",
  "title": "Used Car Listing Budget Audit",
  "description": "Audit used car listing budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "used_listing_budget",
  "entity": "used car listing budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 81600,
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
      "id": "used_listing_budget-2019-sedan",
      "name": "2019 sedan",
      "category": "sedan",
      "tags": [
        "budget"
      ],
      "cost": 12000,
      "quantity": 12000,
      "condition": "good"
    },
    {
      "id": "used_listing_budget-2018-suv",
      "name": "2018 SUV",
      "category": "suv",
      "tags": [
        "budget"
      ],
      "cost": 18000,
      "quantity": 18000,
      "condition": "good"
    },
    {
      "id": "used_listing_budget-2017-truck",
      "name": "2017 truck",
      "category": "truck",
      "tags": [
        "budget"
      ],
      "cost": 22000,
      "quantity": 22000,
      "condition": "fair"
    },
    {
      "id": "used_listing_budget-2020-ev",
      "name": "2020 EV",
      "category": "ev",
      "tags": [
        "budget"
      ],
      "cost": 16000,
      "quantity": 16000,
      "condition": "good"
    }
  ]
}
