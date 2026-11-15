import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "rain-cistern-sizing-check-mcp",
  "title": "Cistern Sizing Audit",
  "description": "Audit roof catchment, tank size, filtration and overflow for a cistern. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "cistern_sizing",
  "entity": "cistern item",
  "categories": [
    {
      "id": "roof",
      "label": "Roof",
      "baseline": 2
    },
    {
      "id": "tank",
      "label": "Tank",
      "baseline": 1
    },
    {
      "id": "filter",
      "label": "Filter",
      "baseline": 1
    },
    {
      "id": "overflow",
      "label": "Overflow",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "storage_gallons",
    "label": "Storage gallons",
    "unit": "gal",
    "target": 500,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 1250,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "roof",
      "label": "Roof",
      "categories": [
        "roof"
      ]
    },
    {
      "id": "tank",
      "label": "Tank",
      "categories": [
        "tank"
      ]
    },
    {
      "id": "filter",
      "label": "Filter",
      "categories": [
        "filter"
      ]
    },
    {
      "id": "overflow",
      "label": "Overflow",
      "categories": [
        "overflow"
      ]
    }
  ],
  "sample": [
    {
      "id": "cistern_sizing-roof-catchment",
      "name": "Roof catchment",
      "category": "roof",
      "tags": [
        "roof"
      ],
      "cost": 0,
      "quantity": 800,
      "condition": "good"
    },
    {
      "id": "cistern_sizing-cistern",
      "name": "Cistern",
      "category": "tank",
      "tags": [
        "tank"
      ],
      "cost": 900,
      "quantity": 500,
      "condition": "new"
    },
    {
      "id": "cistern_sizing-filter",
      "name": "Filter",
      "category": "filter",
      "tags": [
        "filter"
      ],
      "cost": 80,
      "quantity": 1,
      "condition": "new"
    },
    {
      "id": "cistern_sizing-overflow",
      "name": "Overflow",
      "category": "overflow",
      "tags": [
        "overflow"
      ],
      "cost": 60,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
