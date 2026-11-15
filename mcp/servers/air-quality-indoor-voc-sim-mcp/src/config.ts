import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "air-quality-indoor-voc-sim-mcp",
  "title": "Indoor VOC Simulator",
  "description": "Simulate indoor voc by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "indoor_voc_sim",
  "entity": "room reading simulation",
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
    "id": "voc_index",
    "label": "VOC index",
    "unit": "index",
    "target": 100,
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
      "id": "indoor_voc_sim-living-room-sensor",
      "name": "Living room sensor",
      "category": "living",
      "tags": [
        "living"
      ],
      "cost": 120,
      "quantity": 180,
      "condition": "fair"
    },
    {
      "id": "indoor_voc_sim-bedroom-sensor",
      "name": "Bedroom sensor",
      "category": "bedroom",
      "tags": [
        "bedroom"
      ],
      "cost": 120,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "indoor_voc_sim-kitchen-hood",
      "name": "Kitchen hood",
      "category": "kitchen",
      "tags": [
        "kitchen"
      ],
      "cost": 400,
      "quantity": 140,
      "condition": "fair"
    },
    {
      "id": "indoor_voc_sim-basement-monitor",
      "name": "Basement monitor",
      "category": "basement",
      "tags": [
        "basement"
      ],
      "cost": 150,
      "quantity": 220,
      "condition": "worn"
    }
  ]
}
