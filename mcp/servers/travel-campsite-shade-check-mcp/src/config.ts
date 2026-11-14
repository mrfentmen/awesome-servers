import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "travel-campsite-shade-check-mcp",
  "title": "Campsite Shade Audit",
  "description": "Audit campsite options for shade, water, spend and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "campsite_shade",
  "entity": "campsite",
  "categories": [
    {
      "id": "shaded",
      "label": "Shaded sites",
      "baseline": 2
    },
    {
      "id": "partial",
      "label": "Partial shade",
      "baseline": 3
    },
    {
      "id": "sunny",
      "label": "Sunny sites",
      "baseline": 2
    },
    {
      "id": "water",
      "label": "Water access",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Shade",
    "unit": "%",
    "target": 50,
    "direction": "higher"
  },
  "target": {
    "maxItems": 15,
    "budget": 200,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "shaded",
      "label": "Shaded site",
      "categories": [
        "shaded"
      ]
    },
    {
      "id": "partial",
      "label": "Partial shade",
      "categories": [
        "partial"
      ]
    },
    {
      "id": "water",
      "label": "Water access",
      "categories": [
        "water"
      ]
    }
  ],
  "sample": [
    {
      "id": "camp-oak",
      "name": "Oak flat",
      "category": "shaded",
      "tags": [
        "trees"
      ],
      "cost": 30,
      "quantity": 80,
      "condition": "good"
    },
    {
      "id": "camp-pine",
      "name": "Pine ridge",
      "category": "partial",
      "tags": [
        "breeze"
      ],
      "cost": 25,
      "quantity": 45,
      "condition": "good"
    },
    {
      "id": "camp-lake",
      "name": "Lake beach",
      "category": "water",
      "tags": [
        "swim"
      ],
      "cost": 35,
      "quantity": 20,
      "condition": "fair"
    },
    {
      "id": "camp-canyon",
      "name": "Canyon site",
      "category": "sunny",
      "tags": [
        "exposed"
      ],
      "cost": 15,
      "quantity": 10,
      "condition": "fair"
    }
  ]
}
