import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "snow-roof-snow-load-index-mcp",
  "title": "Roof Snow Load Archive",
  "description": "Archive roof snow load by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "roof_snow_load_index",
  "entity": "roof check archive",
  "categories": [
    {
      "id": "roof",
      "label": "Roof",
      "baseline": 2
    },
    {
      "id": "drainage",
      "label": "Drainage",
      "baseline": 1
    },
    {
      "id": "structure",
      "label": "Structure",
      "baseline": 1
    },
    {
      "id": "access",
      "label": "Access",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "snow_depth",
    "label": "Snow depth",
    "unit": "in",
    "target": 12,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 2600,
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
      "id": "drainage",
      "label": "Drainage",
      "categories": [
        "drainage"
      ]
    },
    {
      "id": "structure",
      "label": "Structure",
      "categories": [
        "structure"
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
      "id": "roof_snow_load_index-roof-snow-depth",
      "name": "Roof snow depth",
      "category": "roof",
      "tags": [
        "roof"
      ],
      "cost": 0,
      "quantity": 18,
      "condition": "fair"
    },
    {
      "id": "roof_snow_load_index-ice-dam",
      "name": "Ice dam",
      "category": "drainage",
      "tags": [
        "drainage"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "worn"
    },
    {
      "id": "roof_snow_load_index-rafter-crack",
      "name": "Rafter crack",
      "category": "structure",
      "tags": [
        "structure"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "worn"
    },
    {
      "id": "roof_snow_load_index-roof-rake",
      "name": "Roof rake",
      "category": "access",
      "tags": [
        "access"
      ],
      "cost": 60,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
