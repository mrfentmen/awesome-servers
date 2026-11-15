import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "landscaping-patio-shade-match-mcp",
  "title": "Patio Shade Match Audit",
  "description": "Match patio shade by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "patio_shade_match",
  "entity": "shade element match",
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
      "id": "patio_shade_match-oak",
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
      "id": "patio_shade_match-pergola",
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
      "id": "patio_shade_match-sail",
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
      "id": "patio_shade_match-umbrella",
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
      "id": "patio_shade_match-vine",
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
      "id": "patio_shade_match-second-sail",
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
