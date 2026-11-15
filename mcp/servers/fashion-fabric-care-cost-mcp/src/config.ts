import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "fashion-fabric-care-cost-mcp",
  "title": "Fabric Care Budget Audit",
  "description": "Audit fabric care budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "fabric_care_budget",
  "entity": "fabric item budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 350,
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
      "id": "fabric_care_budget-cotton-tee",
      "name": "Cotton tee",
      "category": "cotton",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "fabric_care_budget-wool-sweater",
      "name": "Wool sweater",
      "category": "wool",
      "tags": [
        "budget"
      ],
      "cost": 90,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "fabric_care_budget-silk-scarf",
      "name": "Silk scarf",
      "category": "silk",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "fair"
    },
    {
      "id": "fabric_care_budget-synthetic-shell",
      "name": "Synthetic shell",
      "category": "synthetic",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "good"
    }
  ]
}
