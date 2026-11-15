import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "rain-basement-damp-sim-mcp",
  "title": "Basement Damp Simulator",
  "description": "Simulate basement damp by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "basement_damp_sim",
  "entity": "damp item simulation",
  "categories": [
    {
      "id": "wall",
      "label": "Wall",
      "baseline": 2
    },
    {
      "id": "floor",
      "label": "Floor",
      "baseline": 1
    },
    {
      "id": "dehumidifier",
      "label": "Dehumidifier",
      "baseline": 1
    },
    {
      "id": "drainage",
      "label": "Drainage",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "moisture",
    "label": "Moisture",
    "unit": "% RH",
    "target": 50,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 900,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "wall",
      "label": "Wall",
      "categories": [
        "wall"
      ]
    },
    {
      "id": "floor",
      "label": "Floor",
      "categories": [
        "floor"
      ]
    },
    {
      "id": "dehumidifier",
      "label": "Dehumidifier",
      "categories": [
        "dehumidifier"
      ]
    },
    {
      "id": "drainage",
      "label": "Drainage",
      "categories": [
        "drainage"
      ]
    }
  ],
  "sample": [
    {
      "id": "basement_damp_sim-wall-sealant",
      "name": "Wall sealant",
      "category": "wall",
      "tags": [
        "wall"
      ],
      "cost": 100,
      "quantity": 1,
      "condition": "fair"
    },
    {
      "id": "basement_damp_sim-floor-crack",
      "name": "Floor crack",
      "category": "floor",
      "tags": [
        "floor"
      ],
      "cost": 80,
      "quantity": 1,
      "condition": "worn"
    },
    {
      "id": "basement_damp_sim-dehumidifier",
      "name": "Dehumidifier",
      "category": "dehumidifier",
      "tags": [
        "dehumidifier"
      ],
      "cost": 250,
      "quantity": 55,
      "condition": "fair"
    },
    {
      "id": "basement_damp_sim-sump-pump",
      "name": "Sump pump",
      "category": "drainage",
      "tags": [
        "drainage"
      ],
      "cost": 300,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
