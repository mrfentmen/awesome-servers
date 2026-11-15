import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "flood-basement-flood-check-mcp",
  "title": "Basement Flood Audit",
  "description": "Audit sump, backflow, wall sealing and raised storage before flooding. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "basement_flood",
  "entity": "flood protection item",
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
    "id": "flood_protection",
    "label": "Protection points",
    "unit": "points",
    "target": 3,
    "direction": "higher"
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
      "id": "basement_flood-sump-pump",
      "name": "Sump pump",
      "category": "sump",
      "tags": [
        "sump"
      ],
      "cost": 300,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "basement_flood-backflow-valve",
      "name": "Backflow valve",
      "category": "backflow",
      "tags": [
        "backflow"
      ],
      "cost": 250,
      "quantity": 1,
      "condition": "new"
    },
    {
      "id": "basement_flood-wall-sealant",
      "name": "Wall sealant",
      "category": "sealant",
      "tags": [
        "sealant"
      ],
      "cost": 100,
      "quantity": 1,
      "condition": "fair"
    },
    {
      "id": "basement_flood-raised-storage",
      "name": "Raised storage",
      "category": "storage",
      "tags": [
        "storage"
      ],
      "cost": 150,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
