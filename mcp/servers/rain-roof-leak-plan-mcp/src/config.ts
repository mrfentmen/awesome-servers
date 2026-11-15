import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "rain-roof-leak-plan-mcp",
  "title": "Roof Leak Planning Audit",
  "description": "Plan roof leak by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "roof_leak_plan",
  "entity": "roof leak item plan",
  "categories": [
    {
      "id": "roof",
      "label": "Roof",
      "baseline": 2
    },
    {
      "id": "gutter",
      "label": "Gutter",
      "baseline": 1
    },
    {
      "id": "flashing",
      "label": "Flashing",
      "baseline": 1
    },
    {
      "id": "ceiling",
      "label": "Ceiling",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "leak_risk",
    "label": "Leak risk",
    "unit": "score",
    "target": 2,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 700,
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
      "id": "gutter",
      "label": "Gutter",
      "categories": [
        "gutter"
      ]
    },
    {
      "id": "flashing",
      "label": "Flashing",
      "categories": [
        "flashing"
      ]
    },
    {
      "id": "ceiling",
      "label": "Ceiling",
      "categories": [
        "ceiling"
      ]
    }
  ],
  "sample": [
    {
      "id": "roof_leak_plan-shingle-patch",
      "name": "Shingle patch",
      "category": "roof",
      "tags": [
        "roof"
      ],
      "cost": 80,
      "quantity": 3,
      "condition": "fair"
    },
    {
      "id": "roof_leak_plan-gutter-run",
      "name": "Gutter run",
      "category": "gutter",
      "tags": [
        "gutter"
      ],
      "cost": 120,
      "quantity": 20,
      "condition": "fair"
    },
    {
      "id": "roof_leak_plan-flashing",
      "name": "Flashing",
      "category": "flashing",
      "tags": [
        "flashing"
      ],
      "cost": 60,
      "quantity": 1,
      "condition": "worn"
    },
    {
      "id": "roof_leak_plan-ceiling-stain",
      "name": "Ceiling stain",
      "category": "ceiling",
      "tags": [
        "ceiling"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "worn"
    }
  ]
}
