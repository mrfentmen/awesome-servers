import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "fashion-fabric-care-check-mcp",
  "title": "Fabric Care Audit",
  "description": "Audit fabric types for care burden, cost per wear, condition and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "fabric_care",
  "entity": "fabric item",
  "categories": [
    {
      "id": "cotton",
      "label": "Cotton",
      "baseline": 4
    },
    {
      "id": "wool",
      "label": "Wool",
      "baseline": 3
    },
    {
      "id": "silk",
      "label": "Silk",
      "baseline": 2
    },
    {
      "id": "synthetic",
      "label": "Synthetics",
      "baseline": 3
    }
  ],
  "metric": {
    "id": "cost_per_use",
    "label": "Cost per wear",
    "unit": "USD",
    "target": 8,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 800,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "cotton",
      "label": "Everyday cotton",
      "categories": [
        "cotton"
      ]
    },
    {
      "id": "wool",
      "label": "Wool layer",
      "categories": [
        "wool"
      ]
    },
    {
      "id": "silk",
      "label": "Silk piece",
      "categories": [
        "silk"
      ]
    },
    {
      "id": "synthetic",
      "label": "Technical layer",
      "categories": [
        "synthetic"
      ]
    }
  ],
  "sample": [
    {
      "id": "fabric-tee",
      "name": "Cotton tee",
      "category": "cotton",
      "tags": [
        "machine-wash"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "fabric-sweater",
      "name": "Wool sweater",
      "category": "wool",
      "tags": [
        "hand-wash"
      ],
      "cost": 90,
      "quantity": 5,
      "condition": "good"
    },
    {
      "id": "fabric-scarf",
      "name": "Silk scarf",
      "category": "silk",
      "tags": [
        "dry-clean"
      ],
      "cost": 60,
      "quantity": 10,
      "condition": "fair"
    },
    {
      "id": "fabric-jacket",
      "name": "Synthetic shell",
      "category": "synthetic",
      "tags": [
        "technical"
      ],
      "cost": 120,
      "quantity": 4,
      "condition": "good"
    }
  ]
}
