import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "california-state-park-plan-mcp",
  "title": "State Park Planning Audit",
  "description": "Plan state park by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "state_park_plan",
  "entity": "park item plan",
  "categories": [
    {
      "id": "access",
      "label": "Access",
      "baseline": 2
    },
    {
      "id": "trail",
      "label": "Trail",
      "baseline": 1
    },
    {
      "id": "wildlife",
      "label": "Wildlife",
      "baseline": 1
    },
    {
      "id": "permit",
      "label": "Permit",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "park_points",
    "label": "Park points",
    "unit": "points",
    "target": 1,
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
      "id": "access",
      "label": "Access",
      "categories": [
        "access"
      ]
    },
    {
      "id": "trail",
      "label": "Trail",
      "categories": [
        "trail"
      ]
    },
    {
      "id": "wildlife",
      "label": "Wildlife",
      "categories": [
        "wildlife"
      ]
    },
    {
      "id": "permit",
      "label": "Permit",
      "categories": [
        "permit"
      ]
    }
  ],
  "sample": [
    {
      "id": "state_park_plan-park-access",
      "name": "Park access",
      "category": "access",
      "tags": [
        "access"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "state_park_plan-trail-map",
      "name": "Trail map",
      "category": "trail",
      "tags": [
        "trail"
      ],
      "cost": 0,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "state_park_plan-wildlife-guide",
      "name": "Wildlife guide",
      "category": "wildlife",
      "tags": [
        "wildlife"
      ],
      "cost": 15,
      "quantity": 1,
      "condition": "new"
    },
    {
      "id": "state_park_plan-park-permit",
      "name": "Park permit",
      "category": "permit",
      "tags": [
        "permit"
      ],
      "cost": 10,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
