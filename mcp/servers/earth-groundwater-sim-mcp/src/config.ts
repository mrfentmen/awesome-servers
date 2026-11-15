import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "earth-groundwater-sim-mcp",
  "title": "Groundwater Simulator",
  "description": "Simulate groundwater by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "groundwater_sim",
  "entity": "groundwater reading simulation",
  "categories": [
    {
      "id": "well",
      "label": "Well",
      "baseline": 2
    },
    {
      "id": "level",
      "label": "Level",
      "baseline": 1
    },
    {
      "id": "quality",
      "label": "Quality",
      "baseline": 1
    },
    {
      "id": "use",
      "label": "Use",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "water_depth_ft",
    "label": "Water depth",
    "unit": "ft",
    "target": 50,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 550,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "well",
      "label": "Well",
      "categories": [
        "well"
      ]
    },
    {
      "id": "level",
      "label": "Level",
      "categories": [
        "level"
      ]
    },
    {
      "id": "quality",
      "label": "Quality",
      "categories": [
        "quality"
      ]
    },
    {
      "id": "use",
      "label": "Use",
      "categories": [
        "use"
      ]
    }
  ],
  "sample": [
    {
      "id": "groundwater_sim-well-depth",
      "name": "Well depth",
      "category": "well",
      "tags": [
        "well"
      ],
      "cost": 0,
      "quantity": 35,
      "condition": "good"
    },
    {
      "id": "groundwater_sim-water-level-logger",
      "name": "Water level logger",
      "category": "level",
      "tags": [
        "level"
      ],
      "cost": 200,
      "quantity": 42,
      "condition": "good"
    },
    {
      "id": "groundwater_sim-lab-quality-test",
      "name": "Lab quality test",
      "category": "quality",
      "tags": [
        "quality"
      ],
      "cost": 80,
      "quantity": 1,
      "condition": "new"
    },
    {
      "id": "groundwater_sim-household-use-audit",
      "name": "Household use audit",
      "category": "use",
      "tags": [
        "use"
      ],
      "cost": 0,
      "quantity": 30,
      "condition": "good"
    }
  ]
}
