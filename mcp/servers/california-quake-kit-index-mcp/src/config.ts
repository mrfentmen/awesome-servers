import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "california-quake-kit-index-mcp",
  "title": "Earthquake Kit Archive",
  "description": "Archive earthquake kit by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "quake_kit_index",
  "entity": "kit item archive",
  "categories": [
    {
      "id": "water",
      "label": "Water",
      "baseline": 2
    },
    {
      "id": "food",
      "label": "Food",
      "baseline": 1
    },
    {
      "id": "tools",
      "label": "Tools",
      "baseline": 1
    },
    {
      "id": "docs",
      "label": "Docs",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "kit_days",
    "label": "Kit days",
    "unit": "days",
    "target": 7,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 250,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "water",
      "label": "Water",
      "categories": [
        "water"
      ]
    },
    {
      "id": "food",
      "label": "Food",
      "categories": [
        "food"
      ]
    },
    {
      "id": "tools",
      "label": "Tools",
      "categories": [
        "tools"
      ]
    },
    {
      "id": "docs",
      "label": "Docs",
      "categories": [
        "docs"
      ]
    }
  ],
  "sample": [
    {
      "id": "quake_kit_index-drinking-water",
      "name": "Drinking water",
      "category": "water",
      "tags": [
        "water"
      ],
      "cost": 30,
      "quantity": 7,
      "condition": "new"
    },
    {
      "id": "quake_kit_index-emergency-food",
      "name": "Emergency food",
      "category": "food",
      "tags": [
        "food"
      ],
      "cost": 60,
      "quantity": 7,
      "condition": "new"
    },
    {
      "id": "quake_kit_index-multi-tool",
      "name": "Multi-tool",
      "category": "tools",
      "tags": [
        "tools"
      ],
      "cost": 80,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "quake_kit_index-document-copies",
      "name": "Document copies",
      "category": "docs",
      "tags": [
        "docs"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
