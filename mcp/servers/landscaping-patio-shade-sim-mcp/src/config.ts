import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "landscaping-patio-shade-sim-mcp",
  "title": "Patio Shade Simulator",
  "description": "Simulate patio shade by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "patio_shade_sim",
  "entity": "shade element simulation",
  "categories": [
    {
      "id": "tree",
      "label": "Trees",
      "baseline": 1
    },
    {
      "id": "pergola",
      "label": "Pergolas",
      "baseline": 1
    },
    {
      "id": "sail",
      "label": "Shade sails",
      "baseline": 1
    },
    {
      "id": "umbrella",
      "label": "Umbrellas",
      "baseline": 1
    },
    {
      "id": "vine",
      "label": "Vines",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "shade_coverage",
    "label": "Shade coverage",
    "unit": "%",
    "target": 70,
    "direction": "higher"
  },
  "target": {
    "maxItems": 8,
    "budget": 900,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "overhead",
      "label": "Overhead structure",
      "categories": [
        "pergola",
        "sail",
        "umbrella"
      ]
    },
    {
      "id": "natural",
      "label": "Natural shade",
      "categories": [
        "tree",
        "vine"
      ]
    }
  ],
  "sample": [
    {
      "id": "patio_shade_sim-oak",
      "name": "Oak tree",
      "category": "tree",
      "tags": [
        "deciduous",
        "large"
      ],
      "cost": 250,
      "quantity": 45,
      "condition": "good"
    },
    {
      "id": "patio_shade_sim-pergola",
      "name": "Timber pergola",
      "category": "pergola",
      "tags": [
        "timber",
        "fixed"
      ],
      "cost": 1200,
      "quantity": 60,
      "condition": "good"
    },
    {
      "id": "patio_shade_sim-sail",
      "name": "Shade sail",
      "category": "sail",
      "tags": [
        "fabric",
        "removable"
      ],
      "cost": 180,
      "quantity": 55,
      "condition": "good"
    },
    {
      "id": "patio_shade_sim-umbrella",
      "name": "Patio umbrella",
      "category": "umbrella",
      "tags": [
        "market",
        "adjustable"
      ],
      "cost": 120,
      "quantity": 40,
      "condition": "good"
    },
    {
      "id": "patio_shade_sim-vine",
      "name": "Climbing vine",
      "category": "vine",
      "tags": [
        "perennial",
        "fast"
      ],
      "cost": 35,
      "quantity": 30,
      "condition": "good"
    },
    {
      "id": "patio_shade_sim-second-sail",
      "name": "Second sail",
      "category": "sail",
      "tags": [
        "fabric",
        "west"
      ],
      "cost": 160,
      "quantity": 50,
      "condition": "good"
    }
  ]
}
