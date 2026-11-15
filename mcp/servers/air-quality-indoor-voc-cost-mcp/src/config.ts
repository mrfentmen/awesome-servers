import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "air-quality-indoor-voc-cost-mcp",
  "title": "Indoor VOC Budget Audit",
  "description": "Audit indoor voc budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "indoor_voc_budget",
  "entity": "room reading budget line",
  "categories": [
    {
      "id": "living",
      "label": "Living",
      "baseline": 2
    },
    {
      "id": "bedroom",
      "label": "Bedroom",
      "baseline": 1
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
    "budget": 1200,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "living",
      "label": "Living",
      "categories": [
        "living"
      ]
    },
    {
      "id": "bedroom",
      "label": "Bedroom",
      "categories": [
        "bedroom"
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
    }
  ],
  "sample": [
    {
      "id": "indoor_voc_budget-living-room-air-test",
      "name": "Living room air test",
      "category": "living",
      "tags": [
        "budget"
      ],
      "cost": 150,
      "quantity": 150,
      "condition": "new"
    },
    {
      "id": "indoor_voc_budget-bedroom-purifier",
      "name": "Bedroom purifier",
      "category": "bedroom",
      "tags": [
        "budget"
      ],
      "cost": 250,
      "quantity": 250,
      "condition": "new"
    },
    {
      "id": "indoor_voc_budget-kitchen-hood-service",
      "name": "Kitchen hood service",
      "category": "kitchen",
      "tags": [
        "budget"
      ],
      "cost": 180,
      "quantity": 180,
      "condition": "new"
    },
    {
      "id": "indoor_voc_budget-basement-ventilation",
      "name": "Basement ventilation",
      "category": "basement",
      "tags": [
        "budget"
      ],
      "cost": 400,
      "quantity": 400,
      "condition": "new"
    }
  ]
}
