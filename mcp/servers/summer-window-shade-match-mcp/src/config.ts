import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "summer-window-shade-match-mcp",
  "title": "Window Shade Match Audit",
  "description": "Match window shade by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "window_shade_match",
  "entity": "window shade match",
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
      "id": "window_shade_match-east-blinds",
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
      "id": "window_shade_match-south-shade",
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
      "id": "window_shade_match-west-awning",
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
      "id": "window_shade_match-exterior-shade",
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
