import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "summer-window-shade-check-mcp",
  "title": "Window Shade Audit",
  "description": "Audit east, south, west and exterior window shading coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "window_shade",
  "entity": "window shade",
  "categories": [
    {
      "id": "east",
      "label": "East",
      "baseline": 2
    },
    {
      "id": "south",
      "label": "South",
      "baseline": 1
    },
    {
      "id": "west",
      "label": "West",
      "baseline": 1
    },
    {
      "id": "exterior",
      "label": "Exterior",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "shaded_windows",
    "label": "Shaded windows",
    "unit": "windows",
    "target": 3,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 700,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "east",
      "label": "East",
      "categories": [
        "east"
      ]
    },
    {
      "id": "south",
      "label": "South",
      "categories": [
        "south"
      ]
    },
    {
      "id": "west",
      "label": "West",
      "categories": [
        "west"
      ]
    },
    {
      "id": "exterior",
      "label": "Exterior",
      "categories": [
        "exterior"
      ]
    }
  ],
  "sample": [
    {
      "id": "window_shade-east-blinds",
      "name": "East blinds",
      "category": "east",
      "tags": [
        "east"
      ],
      "cost": 60,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "window_shade-south-shade",
      "name": "South shade",
      "category": "south",
      "tags": [
        "south"
      ],
      "cost": 80,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "window_shade-west-awning",
      "name": "West awning",
      "category": "west",
      "tags": [
        "west"
      ],
      "cost": 300,
      "quantity": 0,
      "condition": "worn"
    },
    {
      "id": "window_shade-exterior-shade",
      "name": "Exterior shade",
      "category": "exterior",
      "tags": [
        "exterior"
      ],
      "cost": 120,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
