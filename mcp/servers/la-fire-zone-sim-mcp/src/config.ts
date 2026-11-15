import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "la-fire-zone-sim-mcp",
  "title": "Wildfire Zone Simulator",
  "description": "Simulate wildfire zone by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "fire_zone_sim",
  "entity": "fire zone item simulation",
  "categories": [
    {
      "id": "zone",
      "label": "Zone",
      "baseline": 2
    },
    {
      "id": "defensible-space",
      "label": "Defensible Space",
      "baseline": 1
    },
    {
      "id": "route",
      "label": "Route",
      "baseline": 1
    },
    {
      "id": "insurance",
      "label": "Insurance",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "defensible_ft",
    "label": "Defensible space",
    "unit": "ft",
    "target": 100,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 700,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "zone",
      "label": "Zone",
      "categories": [
        "zone"
      ]
    },
    {
      "id": "defensible-space",
      "label": "Defensible Space",
      "categories": [
        "defensible-space"
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
      "id": "insurance",
      "label": "Insurance",
      "categories": [
        "insurance"
      ]
    }
  ],
  "sample": [
    {
      "id": "fire_zone_sim-zone-map",
      "name": "Zone map",
      "category": "zone",
      "tags": [
        "zone"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "fire_zone_sim-defensible-space",
      "name": "Defensible space",
      "category": "defensible-space",
      "tags": [
        "defensible-space"
      ],
      "cost": 500,
      "quantity": 100,
      "condition": "good"
    },
    {
      "id": "fire_zone_sim-evacuation-route",
      "name": "Evacuation route",
      "category": "route",
      "tags": [
        "route"
      ],
      "cost": 0,
      "quantity": 12,
      "condition": "good"
    },
    {
      "id": "fire_zone_sim-insurance-policy",
      "name": "Insurance policy",
      "category": "insurance",
      "tags": [
        "insurance"
      ],
      "cost": 1800,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
