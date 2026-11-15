import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "weather-wind-corridor-check-mcp",
  "title": "Wind Corridor Audit",
  "description": "Audit roof edges, fences, trees and anchors in a known wind corridor. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "wind_corridor",
  "entity": "wind item",
  "categories": [
    {
      "id": "roof",
      "label": "Roof",
      "baseline": 2
    },
    {
      "id": "fence",
      "label": "Fence",
      "baseline": 1
    },
    {
      "id": "trees",
      "label": "Trees",
      "baseline": 1
    },
    {
      "id": "anchors",
      "label": "Anchors",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "wind_rating",
    "label": "Wind rating",
    "unit": "points",
    "target": 3,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 1600,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "roof",
      "label": "Roof",
      "categories": [
        "roof"
      ]
    },
    {
      "id": "fence",
      "label": "Fence",
      "categories": [
        "fence"
      ]
    },
    {
      "id": "trees",
      "label": "Trees",
      "categories": [
        "trees"
      ]
    },
    {
      "id": "anchors",
      "label": "Anchors",
      "categories": [
        "anchors"
      ]
    }
  ],
  "sample": [
    {
      "id": "wind_corridor-roof-edge",
      "name": "Roof edge",
      "category": "roof",
      "tags": [
        "roof"
      ],
      "cost": 500,
      "quantity": 2,
      "condition": "fair"
    },
    {
      "id": "wind_corridor-fence-line",
      "name": "Fence line",
      "category": "fence",
      "tags": [
        "fence"
      ],
      "cost": 300,
      "quantity": 1,
      "condition": "worn"
    },
    {
      "id": "wind_corridor-tree-trim",
      "name": "Tree trim",
      "category": "trees",
      "tags": [
        "trees"
      ],
      "cost": 400,
      "quantity": 2,
      "condition": "fair"
    },
    {
      "id": "wind_corridor-guy-anchors",
      "name": "Guy anchors",
      "category": "anchors",
      "tags": [
        "anchors"
      ],
      "cost": 100,
      "quantity": 3,
      "condition": "good"
    }
  ]
}
