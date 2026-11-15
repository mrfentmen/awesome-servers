import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "earthquake-fault-distance-match-mcp",
  "title": "Fault Distance Match Audit",
  "description": "Match fault distance by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "fault_distance_match",
  "entity": "distance check match",
  "categories": [
    {
      "id": "home",
      "label": "Home",
      "baseline": 2
    },
    {
      "id": "route",
      "label": "Route",
      "baseline": 1
    },
    {
      "id": "shelter",
      "label": "Shelter",
      "baseline": 1
    },
    {
      "id": "supplies",
      "label": "Supplies",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "distance_miles",
    "label": "Distance",
    "unit": "mi",
    "target": 5,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 300,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "home",
      "label": "Home",
      "categories": [
        "home"
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
      "id": "shelter",
      "label": "Shelter",
      "categories": [
        "shelter"
      ]
    },
    {
      "id": "supplies",
      "label": "Supplies",
      "categories": [
        "supplies"
      ]
    }
  ],
  "sample": [
    {
      "id": "fault_distance_match-home-distance",
      "name": "Home distance",
      "category": "home",
      "tags": [
        "home"
      ],
      "cost": 0,
      "quantity": 2,
      "condition": "worn"
    },
    {
      "id": "fault_distance_match-evacuation-route",
      "name": "Evacuation route",
      "category": "route",
      "tags": [
        "route"
      ],
      "cost": 40,
      "quantity": 12,
      "condition": "good"
    },
    {
      "id": "fault_distance_match-shelter-distance",
      "name": "Shelter distance",
      "category": "shelter",
      "tags": [
        "shelter"
      ],
      "cost": 120,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "fault_distance_match-emergency-radio",
      "name": "Emergency radio",
      "category": "supplies",
      "tags": [
        "supplies"
      ],
      "cost": 60,
      "quantity": 1,
      "condition": "new"
    }
  ]
}
