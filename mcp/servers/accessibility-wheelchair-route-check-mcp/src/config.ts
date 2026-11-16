import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "accessibility-wheelchair-route-check-mcp",
  "title": "Wheelchair Route Audit",
  "description": "Audit wheelchair route by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "wheelchair_route",
  "entity": "route segment",
  "categories": [
    {
      "id": "sidewalk",
      "label": "Sidewalk",
      "baseline": 2
    },
    {
      "id": "curb",
      "label": "Curb ramp",
      "baseline": 2
    },
    {
      "id": "crossing",
      "label": "Crossing",
      "baseline": 2
    },
    {
      "id": "door",
      "label": "Door",
      "baseline": 1
    },
    {
      "id": "elevator",
      "label": "Elevator",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "barrier_count",
    "label": "Barrier count",
    "unit": "barriers",
    "target": 0,
    "direction": "lower"
  },
  "target": {
    "maxItems": 18,
    "budget": 5000,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "path",
      "label": "Continuous path",
      "categories": [
        "sidewalk"
      ]
    },
    {
      "id": "crossing",
      "label": "Accessible crossing",
      "categories": [
        "curb",
        "crossing"
      ]
    },
    {
      "id": "entrance",
      "label": "Accessible entrance",
      "categories": [
        "door"
      ]
    },
    {
      "id": "vertical",
      "label": "Vertical access",
      "categories": [
        "elevator"
      ]
    }
  ],
  "sample": [
    {
      "id": "wheelchair_route-main",
      "name": "Main sidewalk",
      "category": "sidewalk",
      "tags": [
        "wide",
        "paved"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "wheelchair_route-side",
      "name": "Side sidewalk",
      "category": "sidewalk",
      "tags": [
        "narrow",
        "cracked"
      ],
      "cost": 300,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "wheelchair_route-curb",
      "name": "Corner curb ramp",
      "category": "curb",
      "tags": [
        "flush",
        "wide"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "wheelchair_route-old-curb",
      "name": "Old curb ramp",
      "category": "curb",
      "tags": [
        "steep",
        "narrow"
      ],
      "cost": 800,
      "quantity": 2,
      "condition": "fair"
    },
    {
      "id": "wheelchair_route-signal",
      "name": "Signal crossing",
      "category": "crossing",
      "tags": [
        "audible",
        "level"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "wheelchair_route-midblock",
      "name": "Midblock crossing",
      "category": "crossing",
      "tags": [
        "painted",
        "no-signal"
      ],
      "cost": 1500,
      "quantity": 4,
      "condition": "worn"
    },
    {
      "id": "wheelchair_route-door",
      "name": "Building door",
      "category": "door",
      "tags": [
        "automatic",
        "wide"
      ],
      "cost": 200,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "wheelchair_route-elevator",
      "name": "Elevator access",
      "category": "elevator",
      "tags": [
        "working",
        "braille"
      ],
      "cost": 900,
      "quantity": 3,
      "condition": "fair"
    }
  ]
}
