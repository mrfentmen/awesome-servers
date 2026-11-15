import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "weather-storm-window-sim-mcp",
  "title": "Storm Window Simulator",
  "description": "Simulate storm window by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "storm_window_sim",
  "entity": "window item simulation",
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
      "id": "storm_window_sim-double-pane-glass",
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
      "id": "storm_window_sim-window-frame",
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
      "id": "storm_window_sim-weatherstrip",
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
      "id": "storm_window_sim-weep-holes",
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
