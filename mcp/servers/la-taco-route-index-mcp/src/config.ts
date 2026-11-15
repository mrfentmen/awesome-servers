import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "la-taco-route-index-mcp",
  "title": "Taco Route Archive",
  "description": "Archive taco route by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "taco_route_index",
  "entity": "taco stop archive",
  "categories": [
    {
      "id": "stops",
      "label": "Stops",
      "baseline": 2
    },
    {
      "id": "walk",
      "label": "Walk",
      "baseline": 1
    },
    {
      "id": "price",
      "label": "Price",
      "baseline": 1
    },
    {
      "id": "hours",
      "label": "Hours",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "route_minutes",
    "label": "Route minutes",
    "unit": "min",
    "target": 60,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 100,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "stops",
      "label": "Stops",
      "categories": [
        "stops"
      ]
    },
    {
      "id": "walk",
      "label": "Walk",
      "categories": [
        "walk"
      ]
    },
    {
      "id": "price",
      "label": "Price",
      "categories": [
        "price"
      ]
    },
    {
      "id": "hours",
      "label": "Hours",
      "categories": [
        "hours"
      ]
    }
  ],
  "sample": [
    {
      "id": "taco_route_index-taco-stand",
      "name": "Taco stand",
      "category": "stops",
      "tags": [
        "stops"
      ],
      "cost": 8,
      "quantity": 20,
      "condition": "new"
    },
    {
      "id": "taco_route_index-truck-stop",
      "name": "Truck stop",
      "category": "walk",
      "tags": [
        "walk"
      ],
      "cost": 10,
      "quantity": 15,
      "condition": "good"
    },
    {
      "id": "taco_route_index-walk-link",
      "name": "Walk link",
      "category": "price",
      "tags": [
        "price"
      ],
      "cost": 0,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "taco_route_index-late-stop",
      "name": "Late stop",
      "category": "hours",
      "tags": [
        "hours"
      ],
      "cost": 9,
      "quantity": 10,
      "condition": "good"
    }
  ]
}
