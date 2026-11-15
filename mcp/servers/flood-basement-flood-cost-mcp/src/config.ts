import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "flood-basement-flood-cost-mcp",
  "title": "Basement Flood Budget Audit",
  "description": "Audit basement flood budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "basement_flood_budget",
  "entity": "flood protection item budget line",
  "categories": [
    {
      "id": "sump",
      "label": "Sump",
      "baseline": 2
    },
    {
      "id": "backflow",
      "label": "Backflow",
      "baseline": 1
    },
    {
      "id": "sealant",
      "label": "Sealant",
      "baseline": 1
    },
    {
      "id": "storage",
      "label": "Storage",
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
    "budget": 1000,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "sump",
      "label": "Sump",
      "categories": [
        "sump"
      ]
    },
    {
      "id": "backflow",
      "label": "Backflow",
      "categories": [
        "backflow"
      ]
    },
    {
      "id": "sealant",
      "label": "Sealant",
      "categories": [
        "sealant"
      ]
    },
    {
      "id": "storage",
      "label": "Storage",
      "categories": [
        "storage"
      ]
    }
  ],
  "sample": [
    {
      "id": "basement_flood_budget-sump-pump",
      "name": "Sump pump",
      "category": "sump",
      "tags": [
        "budget"
      ],
      "cost": 300,
      "quantity": 300,
      "condition": "new"
    },
    {
      "id": "basement_flood_budget-backflow-valve",
      "name": "Backflow valve",
      "category": "backflow",
      "tags": [
        "budget"
      ],
      "cost": 250,
      "quantity": 250,
      "condition": "new"
    },
    {
      "id": "basement_flood_budget-wall-sealant",
      "name": "Wall sealant",
      "category": "sealant",
      "tags": [
        "budget"
      ],
      "cost": 100,
      "quantity": 100,
      "condition": "new"
    },
    {
      "id": "basement_flood_budget-raised-storage",
      "name": "Raised storage",
      "category": "storage",
      "tags": [
        "budget"
      ],
      "cost": 150,
      "quantity": 150,
      "condition": "new"
    }
  ]
}
