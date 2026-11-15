import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "earth-landslide-risk-check-mcp",
  "title": "Landslide Risk Audit",
  "description": "Audit slope angle, water, vegetation and access for landslide risk. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "landslide_risk",
  "entity": "slope item",
  "categories": [
    {
      "id": "slope",
      "label": "Slope",
      "baseline": 2
    },
    {
      "id": "water",
      "label": "Water",
      "baseline": 1
    },
    {
      "id": "vegetation",
      "label": "Vegetation",
      "baseline": 1
    },
    {
      "id": "access",
      "label": "Access",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "risk_points",
    "label": "Risk points",
    "unit": "points",
    "target": 2,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 1300,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "slope",
      "label": "Slope",
      "categories": [
        "slope"
      ]
    },
    {
      "id": "water",
      "label": "Water",
      "categories": [
        "water"
      ]
    },
    {
      "id": "vegetation",
      "label": "Vegetation",
      "categories": [
        "vegetation"
      ]
    },
    {
      "id": "access",
      "label": "Access",
      "categories": [
        "access"
      ]
    }
  ],
  "sample": [
    {
      "id": "landslide_risk-steep-slope",
      "name": "Steep slope",
      "category": "slope",
      "tags": [
        "slope"
      ],
      "cost": 0,
      "quantity": 4,
      "condition": "worn"
    },
    {
      "id": "landslide_risk-drainage-ditch",
      "name": "Drainage ditch",
      "category": "water",
      "tags": [
        "water"
      ],
      "cost": 300,
      "quantity": 3,
      "condition": "fair"
    },
    {
      "id": "landslide_risk-vegetation-cover",
      "name": "Vegetation cover",
      "category": "vegetation",
      "tags": [
        "vegetation"
      ],
      "cost": 150,
      "quantity": 2,
      "condition": "fair"
    },
    {
      "id": "landslide_risk-access-road",
      "name": "Access road",
      "category": "access",
      "tags": [
        "access"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
