import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "air-quality-mold-spore-cost-mcp",
  "title": "Mold Spore Budget Audit",
  "description": "Audit mold spore budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "mold_spore_budget",
  "entity": "mold reading budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
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
      "id": "mold_spore_budget-bath-fan",
      "name": "Bath fan",
      "category": "bath",
      "tags": [
        "budget"
      ],
      "cost": 180,
      "quantity": 180,
      "condition": "new"
    },
    {
      "id": "mold_spore_budget-kitchen-seal",
      "name": "Kitchen seal",
      "category": "kitchen",
      "tags": [
        "budget"
      ],
      "cost": 90,
      "quantity": 90,
      "condition": "new"
    },
    {
      "id": "mold_spore_budget-basement-dehumidifier",
      "name": "Basement dehumidifier",
      "category": "basement",
      "tags": [
        "budget"
      ],
      "cost": 250,
      "quantity": 250,
      "condition": "new"
    },
    {
      "id": "mold_spore_budget-hvac-filter",
      "name": "HVAC filter",
      "category": "hvac",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    }
  ]
}
