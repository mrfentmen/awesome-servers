import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "air-quality-mold-spore-check-mcp",
  "title": "Mold Spore Audit",
  "description": "Audit mold spore readings, damp rooms, filtration and moisture controls. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "mold_spore",
  "entity": "mold reading",
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
      "id": "mold_spore-bathroom-spores",
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
      "id": "mold_spore-kitchen-spores",
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
      "id": "mold_spore-basement-spores",
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
      "id": "mold_spore-hvac-filter",
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
