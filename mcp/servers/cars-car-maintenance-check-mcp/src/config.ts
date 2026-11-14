import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "cars-car-maintenance-check-mcp",
  "title": "Car Maintenance Audit",
  "description": "Audit oil, tires, brakes and filters by miles since service and replacement risk. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "car_maintenance",
  "entity": "maintenance item",
  "categories": [
    {
      "id": "oil",
      "label": "Oil",
      "baseline": 1
    },
    {
      "id": "tires",
      "label": "Tires",
      "baseline": 2
    },
    {
      "id": "brakes",
      "label": "Brakes",
      "baseline": 2
    },
    {
      "id": "filter",
      "label": "Filters",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Miles since service",
    "unit": "miles",
    "target": 5000,
    "direction": "lower"
  },
  "target": {
    "maxItems": 15,
    "budget": 300,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "oil",
      "label": "Oil service",
      "categories": [
        "oil"
      ]
    },
    {
      "id": "tires",
      "label": "Tire service",
      "categories": [
        "tires"
      ]
    },
    {
      "id": "brakes",
      "label": "Brake service",
      "categories": [
        "brakes"
      ]
    },
    {
      "id": "filter",
      "label": "Filter service",
      "categories": [
        "filter"
      ]
    }
  ],
  "sample": [
    {
      "id": "car-oil",
      "name": "Engine oil",
      "category": "oil",
      "tags": [
        "synthetic"
      ],
      "cost": 60,
      "quantity": 3000,
      "condition": "good"
    },
    {
      "id": "car-tires",
      "name": "All-season tires",
      "category": "tires",
      "tags": [
        "tread"
      ],
      "cost": 500,
      "quantity": 7000,
      "condition": "fair"
    },
    {
      "id": "car-brakes",
      "name": "Front brake pads",
      "category": "brakes",
      "tags": [
        "front"
      ],
      "cost": 180,
      "quantity": 4500,
      "condition": "fair"
    },
    {
      "id": "car-filter",
      "name": "Cabin filter",
      "category": "filter",
      "tags": [
        "cabin"
      ],
      "cost": 25,
      "quantity": 2000,
      "condition": "good"
    }
  ]
}
