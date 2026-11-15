import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "weather-storm-window-check-mcp",
  "title": "Storm Window Audit",
  "description": "Audit glass, frames, seals and drainage before storm season. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "storm_window",
  "entity": "window item",
  "categories": [
    {
      "id": "glass",
      "label": "Glass",
      "baseline": 2
    },
    {
      "id": "frame",
      "label": "Frame",
      "baseline": 1
    },
    {
      "id": "seal",
      "label": "Seal",
      "baseline": 1
    },
    {
      "id": "drain",
      "label": "Drain",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "storm_rating",
    "label": "Storm rating",
    "unit": "points",
    "target": 3,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 950,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "glass",
      "label": "Glass",
      "categories": [
        "glass"
      ]
    },
    {
      "id": "frame",
      "label": "Frame",
      "categories": [
        "frame"
      ]
    },
    {
      "id": "seal",
      "label": "Seal",
      "categories": [
        "seal"
      ]
    },
    {
      "id": "drain",
      "label": "Drain",
      "categories": [
        "drain"
      ]
    }
  ],
  "sample": [
    {
      "id": "storm_window-double-pane-glass",
      "name": "Double pane glass",
      "category": "glass",
      "tags": [
        "glass"
      ],
      "cost": 400,
      "quantity": 3,
      "condition": "good"
    },
    {
      "id": "storm_window-window-frame",
      "name": "Window frame",
      "category": "frame",
      "tags": [
        "frame"
      ],
      "cost": 250,
      "quantity": 2,
      "condition": "fair"
    },
    {
      "id": "storm_window-weatherstrip",
      "name": "Weatherstrip",
      "category": "seal",
      "tags": [
        "seal"
      ],
      "cost": 30,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "storm_window-weep-holes",
      "name": "Weep holes",
      "category": "drain",
      "tags": [
        "drain"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
