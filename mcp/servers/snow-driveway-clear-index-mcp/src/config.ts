import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "snow-driveway-clear-index-mcp",
  "title": "Driveway Clearing Archive",
  "description": "Archive driveway clearing by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "driveway_clear_index",
  "entity": "driveway item archive",
  "categories": [
    {
      "id": "driveway",
      "label": "Driveway",
      "baseline": 2
    },
    {
      "id": "walkway",
      "label": "Walkway",
      "baseline": 1
    },
    {
      "id": "equipment",
      "label": "Equipment",
      "baseline": 1
    },
    {
      "id": "deicer",
      "label": "Deicer",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "snow_depth",
    "label": "Snow depth",
    "unit": "in",
    "target": 2,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 650,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "driveway",
      "label": "Driveway",
      "categories": [
        "driveway"
      ]
    },
    {
      "id": "walkway",
      "label": "Walkway",
      "categories": [
        "walkway"
      ]
    },
    {
      "id": "equipment",
      "label": "Equipment",
      "categories": [
        "equipment"
      ]
    },
    {
      "id": "deicer",
      "label": "Deicer",
      "categories": [
        "deicer"
      ]
    }
  ],
  "sample": [
    {
      "id": "driveway_clear_index-driveway-snow",
      "name": "Driveway snow",
      "category": "driveway",
      "tags": [
        "driveway"
      ],
      "cost": 0,
      "quantity": 8,
      "condition": "fair"
    },
    {
      "id": "driveway_clear_index-front-walk-snow",
      "name": "Front walk snow",
      "category": "walkway",
      "tags": [
        "walkway"
      ],
      "cost": 0,
      "quantity": 4,
      "condition": "fair"
    },
    {
      "id": "driveway_clear_index-snow-blower",
      "name": "Snow blower",
      "category": "equipment",
      "tags": [
        "equipment"
      ],
      "cost": 900,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "driveway_clear_index-ice-melt",
      "name": "Ice melt",
      "category": "deicer",
      "tags": [
        "deicer"
      ],
      "cost": 30,
      "quantity": 20,
      "condition": "new"
    }
  ]
}
