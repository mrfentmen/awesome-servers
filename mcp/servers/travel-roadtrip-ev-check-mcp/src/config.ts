import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "travel-roadtrip-ev-check-mcp",
  "title": "Road Trip EV Audit",
  "description": "Audit EV trip charging stops, range, route and backup plans. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "roadtrip_ev",
  "entity": "EV trip item",
  "categories": [
    {
      "id": "charger",
      "label": "Chargers",
      "baseline": 2
    },
    {
      "id": "route",
      "label": "Routes",
      "baseline": 2
    },
    {
      "id": "vehicle",
      "label": "Vehicle",
      "baseline": 1
    },
    {
      "id": "plan",
      "label": "Backup plans",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Range",
    "unit": "miles",
    "target": 200,
    "direction": "higher"
  },
  "target": {
    "maxItems": 15,
    "budget": 300,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "charger",
      "label": "Charging stop",
      "categories": [
        "charger"
      ]
    },
    {
      "id": "route",
      "label": "Route",
      "categories": [
        "route"
      ]
    },
    {
      "id": "vehicle",
      "label": "Vehicle",
      "categories": [
        "vehicle"
      ]
    },
    {
      "id": "plan",
      "label": "Backup plan",
      "categories": [
        "plan"
      ]
    }
  ],
  "sample": [
    {
      "id": "ev-charger",
      "name": "Fast charger stop",
      "category": "charger",
      "tags": [
        "dc"
      ],
      "cost": 20,
      "quantity": 250,
      "condition": "good"
    },
    {
      "id": "ev-route",
      "name": "Highway route",
      "category": "route",
      "tags": [
        "direct"
      ],
      "cost": 0,
      "quantity": 180,
      "condition": "good"
    },
    {
      "id": "ev-vehicle",
      "name": "Long-range EV",
      "category": "vehicle",
      "tags": [
        "electric"
      ],
      "cost": 0,
      "quantity": 300,
      "condition": "new"
    },
    {
      "id": "ev-backup",
      "name": "Backup charger",
      "category": "plan",
      "tags": [
        "backup"
      ],
      "cost": 0,
      "quantity": 220,
      "condition": "good"
    }
  ]
}
