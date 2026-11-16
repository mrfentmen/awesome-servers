import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "transit-bike-route-cost-mcp",
  "title": "Bike Route Budget Audit",
  "description": "Audit bike route budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "bike_route_budget",
  "entity": "route segment budget line",
  "categories": [
    {
      "id": "protected",
      "label": "Protected lane",
      "baseline": 3
    },
    {
      "id": "sharrow",
      "label": "Sharrow",
      "baseline": 2
    },
    {
      "id": "intersection",
      "label": "Intersections",
      "baseline": 2
    },
    {
      "id": "hill",
      "label": "Hills",
      "baseline": 1
    },
    {
      "id": "surface",
      "label": "Surface",
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
    "budget": 100,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "connect",
      "label": "Connected path",
      "categories": [
        "protected",
        "sharrow"
      ]
    },
    {
      "id": "crossing",
      "label": "Safe crossings",
      "categories": [
        "intersection"
      ]
    },
    {
      "id": "grade",
      "label": "Manageable grade",
      "categories": [
        "hill"
      ]
    },
    {
      "id": "surface",
      "label": "Rideable surface",
      "categories": [
        "surface"
      ]
    }
  ],
  "sample": [
    {
      "id": "bike_route_budget-river-path",
      "name": "River path",
      "category": "protected",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "bike_route_budget-greenway-connector",
      "name": "Greenway connector",
      "category": "protected",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "bike_route_budget-downtown-sharrow",
      "name": "Downtown sharrow",
      "category": "sharrow",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "bike_route_budget-avenue-sharrow",
      "name": "Avenue sharrow",
      "category": "sharrow",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "worn"
    },
    {
      "id": "bike_route_budget-major-intersection",
      "name": "Major intersection",
      "category": "intersection",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "bike_route_budget-roundabout",
      "name": "Roundabout",
      "category": "intersection",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "bike_route_budget-hill-climb",
      "name": "Hill climb",
      "category": "hill",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "bike_route_budget-cobblestone-block",
      "name": "Cobblestone block",
      "category": "surface",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    }
  ]
}
