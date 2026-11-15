import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "weather-microclimate-match-mcp",
  "title": "Microclimate Match Audit",
  "description": "Match microclimate by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "microclimate_match",
  "entity": "microclimate reading match",
  "categories": [
    {
      "id": "north",
      "label": "North",
      "baseline": 2
    },
    {
      "id": "south",
      "label": "South",
      "baseline": 1
    },
    {
      "id": "east",
      "label": "East",
      "baseline": 1
    },
    {
      "id": "west",
      "label": "West",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "temp_delta",
    "label": "Temperature delta",
    "unit": "°F",
    "target": 5,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 200,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "north",
      "label": "North",
      "categories": [
        "north"
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
      "id": "east",
      "label": "East",
      "categories": [
        "east"
      ]
    },
    {
      "id": "west",
      "label": "West",
      "categories": [
        "west"
      ]
    }
  ],
  "sample": [
    {
      "id": "microclimate_match-north-wall-sensor",
      "name": "North wall sensor",
      "category": "north",
      "tags": [
        "north"
      ],
      "cost": 40,
      "quantity": 8,
      "condition": "fair"
    },
    {
      "id": "microclimate_match-south-wall-sensor",
      "name": "South wall sensor",
      "category": "south",
      "tags": [
        "south"
      ],
      "cost": 40,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "microclimate_match-east-window-sensor",
      "name": "East window sensor",
      "category": "east",
      "tags": [
        "east"
      ],
      "cost": 40,
      "quantity": 6,
      "condition": "fair"
    },
    {
      "id": "microclimate_match-west-patio-sensor",
      "name": "West patio sensor",
      "category": "west",
      "tags": [
        "west"
      ],
      "cost": 40,
      "quantity": 3,
      "condition": "good"
    }
  ]
}
