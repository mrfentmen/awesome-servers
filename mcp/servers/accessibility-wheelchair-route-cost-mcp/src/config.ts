import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "accessibility-wheelchair-route-cost-mcp",
  "title": "Wheelchair Route Budget Audit",
  "description": "Audit wheelchair route budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "wheelchair_route_budget",
  "entity": "route segment budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 4450,
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
      "id": "wheelchair_route_budget-main-sidewalk",
      "name": "Main sidewalk",
      "category": "sidewalk",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "wheelchair_route_budget-side-sidewalk",
      "name": "Side sidewalk",
      "category": "sidewalk",
      "tags": [
        "budget"
      ],
      "cost": 300,
      "quantity": 300,
      "condition": "good"
    },
    {
      "id": "wheelchair_route_budget-corner-curb-ramp",
      "name": "Corner curb ramp",
      "category": "curb",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "wheelchair_route_budget-old-curb-ramp",
      "name": "Old curb ramp",
      "category": "curb",
      "tags": [
        "budget"
      ],
      "cost": 800,
      "quantity": 800,
      "condition": "fair"
    },
    {
      "id": "wheelchair_route_budget-signal-crossing",
      "name": "Signal crossing",
      "category": "crossing",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "wheelchair_route_budget-midblock-crossing",
      "name": "Midblock crossing",
      "category": "crossing",
      "tags": [
        "budget"
      ],
      "cost": 1500,
      "quantity": 1500,
      "condition": "worn"
    },
    {
      "id": "wheelchair_route_budget-building-door",
      "name": "Building door",
      "category": "door",
      "tags": [
        "budget"
      ],
      "cost": 200,
      "quantity": 200,
      "condition": "good"
    },
    {
      "id": "wheelchair_route_budget-elevator-access",
      "name": "Elevator access",
      "category": "elevator",
      "tags": [
        "budget"
      ],
      "cost": 900,
      "quantity": 900,
      "condition": "fair"
    }
  ]
}
