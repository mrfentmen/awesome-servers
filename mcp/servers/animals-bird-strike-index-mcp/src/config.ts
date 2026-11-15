import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "animals-bird-strike-index-mcp",
  "title": "Bird Strike Archive",
  "description": "Archive bird strike by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "bird_strike_index",
  "entity": "window archive",
  "categories": [
    {
      "id": "windows",
      "label": "Windows",
      "baseline": 2
    },
    {
      "id": "decals",
      "label": "Decals",
      "baseline": 1
    },
    {
      "id": "lighting",
      "label": "Lighting",
      "baseline": 1
    },
    {
      "id": "feeders",
      "label": "Feeders",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "strike_risk",
    "label": "Strike risk",
    "unit": "points",
    "target": 2,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 250,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "windows",
      "label": "Windows",
      "categories": [
        "windows"
      ]
    },
    {
      "id": "decals",
      "label": "Decals",
      "categories": [
        "decals"
      ]
    },
    {
      "id": "lighting",
      "label": "Lighting",
      "categories": [
        "lighting"
      ]
    },
    {
      "id": "feeders",
      "label": "Feeders",
      "categories": [
        "feeders"
      ]
    }
  ],
  "sample": [
    {
      "id": "bird_strike_index-large-window",
      "name": "Large window",
      "category": "windows",
      "tags": [
        "windows"
      ],
      "cost": 120,
      "quantity": 4,
      "condition": "worn"
    },
    {
      "id": "bird_strike_index-decal-coverage",
      "name": "Decal coverage",
      "category": "decals",
      "tags": [
        "decals"
      ],
      "cost": 30,
      "quantity": 60,
      "condition": "fair"
    },
    {
      "id": "bird_strike_index-night-lighting",
      "name": "Night lighting",
      "category": "lighting",
      "tags": [
        "lighting"
      ],
      "cost": 0,
      "quantity": 2,
      "condition": "fair"
    },
    {
      "id": "bird_strike_index-feeder-distance",
      "name": "Feeder distance",
      "category": "feeders",
      "tags": [
        "feeders"
      ],
      "cost": 20,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
