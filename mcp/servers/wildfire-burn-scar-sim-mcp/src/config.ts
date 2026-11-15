import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "wildfire-burn-scar-sim-mcp",
  "title": "Burn Scar Simulator",
  "description": "Simulate burn scar by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "burn_scar_sim",
  "entity": "burn scar item simulation",
  "categories": [
    {
      "id": "soil",
      "label": "Soil",
      "baseline": 2
    },
    {
      "id": "seed",
      "label": "Seed",
      "baseline": 1
    },
    {
      "id": "mulch",
      "label": "Mulch",
      "baseline": 1
    },
    {
      "id": "drainage",
      "label": "Drainage",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "erosion_control",
    "label": "Erosion control",
    "unit": "points",
    "target": 3,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 300,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "soil",
      "label": "Soil",
      "categories": [
        "soil"
      ]
    },
    {
      "id": "seed",
      "label": "Seed",
      "categories": [
        "seed"
      ]
    },
    {
      "id": "mulch",
      "label": "Mulch",
      "categories": [
        "mulch"
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
      "id": "burn_scar_sim-burned-slope",
      "name": "Burned slope",
      "category": "soil",
      "tags": [
        "soil"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "worn"
    },
    {
      "id": "burn_scar_sim-native-seed",
      "name": "Native seed",
      "category": "seed",
      "tags": [
        "seed"
      ],
      "cost": 100,
      "quantity": 5,
      "condition": "new"
    },
    {
      "id": "burn_scar_sim-straw-mulch",
      "name": "Straw mulch",
      "category": "mulch",
      "tags": [
        "mulch"
      ],
      "cost": 60,
      "quantity": 2,
      "condition": "new"
    },
    {
      "id": "burn_scar_sim-water-bar",
      "name": "Water bar",
      "category": "drainage",
      "tags": [
        "drainage"
      ],
      "cost": 80,
      "quantity": 3,
      "condition": "good"
    }
  ]
}
