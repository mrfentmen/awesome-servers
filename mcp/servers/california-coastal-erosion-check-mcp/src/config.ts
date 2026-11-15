import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "california-coastal-erosion-check-mcp",
  "title": "Coastal Erosion Audit",
  "description": "Audit bluff condition, drainage, vegetation and coastal access. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "coastal_erosion",
  "entity": "coastal item",
  "categories": [
    {
      "id": "bluff",
      "label": "Bluff",
      "baseline": 2
    },
    {
      "id": "drainage",
      "label": "Drainage",
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
    "id": "erosion_ft",
    "label": "Erosion",
    "unit": "ft",
    "target": 2,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 1150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "bluff",
      "label": "Bluff",
      "categories": [
        "bluff"
      ]
    },
    {
      "id": "drainage",
      "label": "Drainage",
      "categories": [
        "drainage"
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
      "id": "coastal_erosion-bluff-edge",
      "name": "Bluff edge",
      "category": "bluff",
      "tags": [
        "bluff"
      ],
      "cost": 0,
      "quantity": 3,
      "condition": "worn"
    },
    {
      "id": "coastal_erosion-drainage-outlet",
      "name": "Drainage outlet",
      "category": "drainage",
      "tags": [
        "drainage"
      ],
      "cost": 300,
      "quantity": 1,
      "condition": "fair"
    },
    {
      "id": "coastal_erosion-vegetation-cover",
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
      "id": "coastal_erosion-access-path",
      "name": "Access path",
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
