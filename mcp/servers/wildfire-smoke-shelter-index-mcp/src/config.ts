import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "wildfire-smoke-shelter-index-mcp",
  "title": "Smoke Shelter Archive",
  "description": "Archive smoke shelter by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "smoke_shelter_index",
  "entity": "shelter item archive",
  "categories": [
    {
      "id": "room",
      "label": "Room",
      "baseline": 2
    },
    {
      "id": "filter",
      "label": "Filter",
      "baseline": 1
    },
    {
      "id": "seal",
      "label": "Seal",
      "baseline": 1
    },
    {
      "id": "monitor",
      "label": "Monitor",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "clean_air",
    "label": "Clean-air points",
    "unit": "points",
    "target": 3,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 500,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "room",
      "label": "Room",
      "categories": [
        "room"
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
      "id": "seal",
      "label": "Seal",
      "categories": [
        "seal"
      ]
    },
    {
      "id": "monitor",
      "label": "Monitor",
      "categories": [
        "monitor"
      ]
    }
  ],
  "sample": [
    {
      "id": "smoke_shelter_index-clean-room",
      "name": "Clean room",
      "category": "room",
      "tags": [
        "room"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "smoke_shelter_index-hepa-filter",
      "name": "HEPA filter",
      "category": "filter",
      "tags": [
        "filter"
      ],
      "cost": 250,
      "quantity": 1,
      "condition": "new"
    },
    {
      "id": "smoke_shelter_index-door-seal",
      "name": "Door seal",
      "category": "seal",
      "tags": [
        "seal"
      ],
      "cost": 40,
      "quantity": 1,
      "condition": "fair"
    },
    {
      "id": "smoke_shelter_index-air-monitor",
      "name": "Air monitor",
      "category": "monitor",
      "tags": [
        "monitor"
      ],
      "cost": 120,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
