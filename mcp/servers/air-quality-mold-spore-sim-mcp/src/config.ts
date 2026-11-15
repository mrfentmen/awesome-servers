import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "air-quality-mold-spore-sim-mcp",
  "title": "Mold Spore Simulator",
  "description": "Simulate mold spore by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "mold_spore_sim",
  "entity": "mold reading simulation",
  "categories": [
    {
      "id": "bath",
      "label": "Bath",
      "baseline": 2
    },
    {
      "id": "kitchen",
      "label": "Kitchen",
      "baseline": 1
    },
    {
      "id": "basement",
      "label": "Basement",
      "baseline": 1
    },
    {
      "id": "hvac",
      "label": "HVAC",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "spore_count",
    "label": "Spore count",
    "unit": "spores/m³",
    "target": 500,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 700,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "bath",
      "label": "Bath",
      "categories": [
        "bath"
      ]
    },
    {
      "id": "kitchen",
      "label": "Kitchen",
      "categories": [
        "kitchen"
      ]
    },
    {
      "id": "basement",
      "label": "Basement",
      "categories": [
        "basement"
      ]
    },
    {
      "id": "hvac",
      "label": "HVAC",
      "categories": [
        "hvac"
      ]
    }
  ],
  "sample": [
    {
      "id": "mold_spore_sim-bathroom-spores",
      "name": "Bathroom spores",
      "category": "bath",
      "tags": [
        "bath"
      ],
      "cost": 0,
      "quantity": 800,
      "condition": "worn"
    },
    {
      "id": "mold_spore_sim-kitchen-spores",
      "name": "Kitchen spores",
      "category": "kitchen",
      "tags": [
        "kitchen"
      ],
      "cost": 0,
      "quantity": 300,
      "condition": "fair"
    },
    {
      "id": "mold_spore_sim-basement-spores",
      "name": "Basement spores",
      "category": "basement",
      "tags": [
        "basement"
      ],
      "cost": 0,
      "quantity": 1200,
      "condition": "worn"
    },
    {
      "id": "mold_spore_sim-hvac-filter",
      "name": "HVAC filter",
      "category": "hvac",
      "tags": [
        "hvac"
      ],
      "cost": 40,
      "quantity": 1,
      "condition": "fair"
    }
  ]
}
