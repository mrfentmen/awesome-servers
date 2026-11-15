import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "animals-amphibian-pond-sim-mcp",
  "title": "Amphibian Pond Simulator",
  "description": "Simulate amphibian pond by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "amphibian_pond_sim",
  "entity": "pond feature simulation",
  "categories": [
    {
      "id": "water",
      "label": "Water",
      "baseline": 2
    },
    {
      "id": "cover",
      "label": "Cover",
      "baseline": 1
    },
    {
      "id": "breeding",
      "label": "Breeding",
      "baseline": 1
    },
    {
      "id": "predators",
      "label": "Predators",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "pond_depth",
    "label": "Pond depth",
    "unit": "in",
    "target": 18,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 200,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "water",
      "label": "Water",
      "categories": [
        "water"
      ]
    },
    {
      "id": "cover",
      "label": "Cover",
      "categories": [
        "cover"
      ]
    },
    {
      "id": "breeding",
      "label": "Breeding",
      "categories": [
        "breeding"
      ]
    },
    {
      "id": "predators",
      "label": "Predators",
      "categories": [
        "predators"
      ]
    }
  ],
  "sample": [
    {
      "id": "amphibian_pond_sim-pond-water",
      "name": "Pond water",
      "category": "water",
      "tags": [
        "water"
      ],
      "cost": 0,
      "quantity": 24,
      "condition": "good"
    },
    {
      "id": "amphibian_pond_sim-plant-cover",
      "name": "Plant cover",
      "category": "cover",
      "tags": [
        "cover"
      ],
      "cost": 40,
      "quantity": 60,
      "condition": "good"
    },
    {
      "id": "amphibian_pond_sim-breeding-shelf",
      "name": "Breeding shelf",
      "category": "breeding",
      "tags": [
        "breeding"
      ],
      "cost": 30,
      "quantity": 12,
      "condition": "good"
    },
    {
      "id": "amphibian_pond_sim-predator-screen",
      "name": "Predator screen",
      "category": "predators",
      "tags": [
        "predators"
      ],
      "cost": 20,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
