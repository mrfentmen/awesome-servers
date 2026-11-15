import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "flood-flood-route-match-mcp",
  "title": "Flood Route Match Audit",
  "description": "Match flood route by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "flood_route_match",
  "entity": "flood route item match",
  "categories": [
    {
      "id": "primary",
      "label": "Primary",
      "baseline": 2
    },
    {
      "id": "backup",
      "label": "Backup",
      "baseline": 1
    },
    {
      "id": "high-ground",
      "label": "High ground",
      "baseline": 1
    },
    {
      "id": "comms",
      "label": "Comms",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "route_options",
    "label": "Route options",
    "unit": "routes",
    "target": 2,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 50,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "primary",
      "label": "Primary",
      "categories": [
        "primary"
      ]
    },
    {
      "id": "backup",
      "label": "Backup",
      "categories": [
        "backup"
      ]
    },
    {
      "id": "high-ground",
      "label": "High ground",
      "categories": [
        "high-ground"
      ]
    },
    {
      "id": "comms",
      "label": "Comms",
      "categories": [
        "comms"
      ]
    }
  ],
  "sample": [
    {
      "id": "flood_route_match-primary-route",
      "name": "Primary route",
      "category": "primary",
      "tags": [
        "primary"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "flood_route_match-backup-route",
      "name": "Backup route",
      "category": "backup",
      "tags": [
        "backup"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "fair"
    },
    {
      "id": "flood_route_match-high-ground",
      "name": "High ground",
      "category": "high-ground",
      "tags": [
        "high-ground"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "flood_route_match-radio",
      "name": "Radio",
      "category": "comms",
      "tags": [
        "comms"
      ],
      "cost": 40,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
