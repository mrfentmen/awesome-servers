import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "transit-bus-reliability-check-mcp",
  "title": "Bus Reliability Audit",
  "description": "Audit bus, rail, shuttle and ferry options by wait time and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "bus_reliability",
  "entity": "transit route",
  "categories": [
    {
      "id": "bus",
      "label": "Bus",
      "baseline": 2
    },
    {
      "id": "rail",
      "label": "Rail",
      "baseline": 2
    },
    {
      "id": "shuttle",
      "label": "Shuttle",
      "baseline": 2
    },
    {
      "id": "ferry",
      "label": "Ferry",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Wait time",
    "unit": "minutes",
    "target": 15,
    "direction": "lower"
  },
  "target": {
    "maxItems": 15,
    "budget": 100,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "bus",
      "label": "Bus route",
      "categories": [
        "bus"
      ]
    },
    {
      "id": "rail",
      "label": "Rail route",
      "categories": [
        "rail"
      ]
    },
    {
      "id": "shuttle",
      "label": "Shuttle",
      "categories": [
        "shuttle"
      ]
    },
    {
      "id": "ferry",
      "label": "Ferry",
      "categories": [
        "ferry"
      ]
    }
  ],
  "sample": [
    {
      "id": "transit-bus",
      "name": "Downtown bus",
      "category": "bus",
      "tags": [
        "frequent"
      ],
      "cost": 3,
      "quantity": 10,
      "condition": "good"
    },
    {
      "id": "transit-rail",
      "name": "Commuter rail",
      "category": "rail",
      "tags": [
        "fast"
      ],
      "cost": 6,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "transit-shuttle",
      "name": "Airport shuttle",
      "category": "shuttle",
      "tags": [
        "airport"
      ],
      "cost": 12,
      "quantity": 20,
      "condition": "fair"
    },
    {
      "id": "transit-ferry",
      "name": "Harbour ferry",
      "category": "ferry",
      "tags": [
        "scenic"
      ],
      "cost": 8,
      "quantity": 30,
      "condition": "fair"
    }
  ]
}
