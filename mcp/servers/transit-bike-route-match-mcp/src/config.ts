import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "transit-bike-route-match-mcp",
  "title": "Bike Route Match Audit",
  "description": "Match bike route by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "bike_route_match",
  "entity": "route segment match",
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
    "id": "risk_score",
    "label": "Risk score",
    "unit": "points",
    "target": 3,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 120,
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
      "id": "bike_route_match-river",
      "name": "River path",
      "category": "protected",
      "tags": [
        "off-street",
        "flat"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "bike_route_match-greenway",
      "name": "Greenway connector",
      "category": "protected",
      "tags": [
        "barrier",
        "flat"
      ],
      "cost": 0,
      "quantity": 3,
      "condition": "good"
    },
    {
      "id": "bike_route_match-sharrow",
      "name": "Downtown sharrow",
      "category": "sharrow",
      "tags": [
        "painted",
        "traffic"
      ],
      "cost": 0,
      "quantity": 6,
      "condition": "fair"
    },
    {
      "id": "bike_route_match-avenue",
      "name": "Avenue sharrow",
      "category": "sharrow",
      "tags": [
        "painted",
        "parked-cars"
      ],
      "cost": 0,
      "quantity": 8,
      "condition": "worn"
    },
    {
      "id": "bike_route_match-crossing",
      "name": "Major intersection",
      "category": "intersection",
      "tags": [
        "signal",
        "turn-lane"
      ],
      "cost": 0,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "bike_route_match-roundabout",
      "name": "Roundabout",
      "category": "intersection",
      "tags": [
        "yield",
        "traffic"
      ],
      "cost": 0,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "bike_route_match-hill",
      "name": "Hill climb",
      "category": "hill",
      "tags": [
        "short",
        "steep"
      ],
      "cost": 0,
      "quantity": 5,
      "condition": "good"
    },
    {
      "id": "bike_route_match-cobbles",
      "name": "Cobblestone block",
      "category": "surface",
      "tags": [
        "rough",
        "historic"
      ],
      "cost": 0,
      "quantity": 3,
      "condition": "good"
    }
  ]
}
