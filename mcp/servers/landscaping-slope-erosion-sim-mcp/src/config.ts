import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "landscaping-slope-erosion-sim-mcp",
  "title": "Slope Erosion Simulator",
  "description": "Simulate slope erosion by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "slope_erosion_sim",
  "entity": "slope treatment simulation",
  "categories": [
    {
      "id": "groundcover",
      "label": "Groundcover",
      "baseline": 2
    },
    {
      "id": "terrace",
      "label": "Terraces",
      "baseline": 1
    },
    {
      "id": "drainage",
      "label": "Drainage",
      "baseline": 1
    },
    {
      "id": "retaining",
      "label": "Retaining walls",
      "baseline": 1
    },
    {
      "id": "mulch",
      "label": "Mulch",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "erosion_risk",
    "label": "Erosion risk",
    "unit": "score",
    "target": 20,
    "direction": "lower"
  },
  "target": {
    "maxItems": 15,
    "budget": 1200,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "cover",
      "label": "Ground cover",
      "categories": [
        "groundcover",
        "mulch"
      ]
    },
    {
      "id": "structure",
      "label": "Slope structure",
      "categories": [
        "terrace",
        "retaining"
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
      "id": "slope_erosion_sim-thyme",
      "name": "Creeping thyme",
      "category": "groundcover",
      "tags": [
        "perennial",
        "low"
      ],
      "cost": 60,
      "quantity": 15,
      "condition": "good"
    },
    {
      "id": "slope_erosion_sim-blanket",
      "name": "Erosion blanket",
      "category": "groundcover",
      "tags": [
        "jute",
        "temporary"
      ],
      "cost": 120,
      "quantity": 30,
      "condition": "good"
    },
    {
      "id": "slope_erosion_sim-terrace",
      "name": "Timber terrace",
      "category": "terrace",
      "tags": [
        "timber",
        "steps"
      ],
      "cost": 450,
      "quantity": 35,
      "condition": "good"
    },
    {
      "id": "slope_erosion_sim-drain",
      "name": "French drain",
      "category": "drainage",
      "tags": [
        "gravel",
        "buried"
      ],
      "cost": 320,
      "quantity": 40,
      "condition": "good"
    },
    {
      "id": "slope_erosion_sim-wall",
      "name": "Retaining wall",
      "category": "retaining",
      "tags": [
        "stone",
        "low"
      ],
      "cost": 900,
      "quantity": 55,
      "condition": "good"
    },
    {
      "id": "slope_erosion_sim-mulch",
      "name": "Bark mulch",
      "category": "mulch",
      "tags": [
        "bark",
        "spring"
      ],
      "cost": 80,
      "quantity": 25,
      "condition": "good"
    }
  ]
}
