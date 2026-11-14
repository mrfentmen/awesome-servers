import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "landscaping-yard-drainage-check-mcp",
  "title": "Yard Drainage Audit",
  "description": "Audit gutters, drains, soakaways and barrels for drainage capacity and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "yard_drainage",
  "entity": "drainage item",
  "categories": [
    {
      "id": "gutter",
      "label": "Gutters",
      "baseline": 3
    },
    {
      "id": "drain",
      "label": "Drains",
      "baseline": 2
    },
    {
      "id": "soakaway",
      "label": "Soakaways",
      "baseline": 2
    },
    {
      "id": "barrel",
      "label": "Barrels",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Drainage capacity",
    "unit": "L/min",
    "target": 20,
    "direction": "higher"
  },
  "target": {
    "maxItems": 15,
    "budget": 400,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "gutter",
      "label": "Gutter run",
      "categories": [
        "gutter"
      ]
    },
    {
      "id": "drain",
      "label": "Drain",
      "categories": [
        "drain"
      ]
    },
    {
      "id": "soakaway",
      "label": "Soakaway",
      "categories": [
        "soakaway"
      ]
    },
    {
      "id": "barrel",
      "label": "Water barrel",
      "categories": [
        "barrel"
      ]
    }
  ],
  "sample": [
    {
      "id": "drain-gutter",
      "name": "Front gutter run",
      "category": "gutter",
      "tags": [
        "roof"
      ],
      "cost": 80,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "drain-patio",
      "name": "Patio drain",
      "category": "drain",
      "tags": [
        "patio"
      ],
      "cost": 60,
      "quantity": 15,
      "condition": "fair"
    },
    {
      "id": "drain-soak",
      "name": "Soakaway",
      "category": "soakaway",
      "tags": [
        "ground"
      ],
      "cost": 120,
      "quantity": 10,
      "condition": "fair"
    },
    {
      "id": "drain-barrel",
      "name": "Rain barrel",
      "category": "barrel",
      "tags": [
        "water"
      ],
      "cost": 90,
      "quantity": 30,
      "condition": "good"
    }
  ]
}
