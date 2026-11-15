import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "nyc-subway-access-index-mcp",
  "title": "Subway Access Archive",
  "description": "Archive subway access by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "subway_access_index",
  "entity": "station access item archive",
  "categories": [
    {
      "id": "entrances",
      "label": "Entrances",
      "baseline": 2
    },
    {
      "id": "elevators",
      "label": "Elevators",
      "baseline": 1
    },
    {
      "id": "fare",
      "label": "Fare",
      "baseline": 1
    },
    {
      "id": "transfers",
      "label": "Transfers",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "access_minutes",
    "label": "Access minutes",
    "unit": "min",
    "target": 15,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 600,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "entrances",
      "label": "Entrances",
      "categories": [
        "entrances"
      ]
    },
    {
      "id": "elevators",
      "label": "Elevators",
      "categories": [
        "elevators"
      ]
    },
    {
      "id": "fare",
      "label": "Fare",
      "categories": [
        "fare"
      ]
    },
    {
      "id": "transfers",
      "label": "Transfers",
      "categories": [
        "transfers"
      ]
    }
  ],
  "sample": [
    {
      "id": "subway_access_index-main-entrance",
      "name": "Main entrance",
      "category": "entrances",
      "tags": [
        "entrances"
      ],
      "cost": 0,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "subway_access_index-elevator-status",
      "name": "Elevator status",
      "category": "elevators",
      "tags": [
        "elevators"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "fair"
    },
    {
      "id": "subway_access_index-omny-card",
      "name": "OMNY card",
      "category": "fare",
      "tags": [
        "fare"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "subway_access_index-transfer-walk",
      "name": "Transfer walk",
      "category": "transfers",
      "tags": [
        "transfers"
      ],
      "cost": 0,
      "quantity": 12,
      "condition": "good"
    }
  ]
}
