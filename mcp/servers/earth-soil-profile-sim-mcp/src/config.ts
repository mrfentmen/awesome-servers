import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "earth-soil-profile-sim-mcp",
  "title": "Soil Profile Simulator",
  "description": "Simulate soil profile by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "soil_profile_sim",
  "entity": "soil layer simulation",
  "categories": [
    {
      "id": "topsoil",
      "label": "Topsoil",
      "baseline": 2
    },
    {
      "id": "subsoil",
      "label": "Subsoil",
      "baseline": 1
    },
    {
      "id": "drainage",
      "label": "Drainage",
      "baseline": 1
    },
    {
      "id": "test",
      "label": "Test",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "soil_depth",
    "label": "Soil depth",
    "unit": "in",
    "target": 12,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 400,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "topsoil",
      "label": "Topsoil",
      "categories": [
        "topsoil"
      ]
    },
    {
      "id": "subsoil",
      "label": "Subsoil",
      "categories": [
        "subsoil"
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
      "id": "test",
      "label": "Test",
      "categories": [
        "test"
      ]
    }
  ],
  "sample": [
    {
      "id": "soil_profile_sim-topsoil-layer",
      "name": "Topsoil layer",
      "category": "topsoil",
      "tags": [
        "topsoil"
      ],
      "cost": 0,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "soil_profile_sim-subsoil-layer",
      "name": "Subsoil layer",
      "category": "subsoil",
      "tags": [
        "subsoil"
      ],
      "cost": 0,
      "quantity": 14,
      "condition": "good"
    },
    {
      "id": "soil_profile_sim-drainage-trench",
      "name": "Drainage trench",
      "category": "drainage",
      "tags": [
        "drainage"
      ],
      "cost": 120,
      "quantity": 6,
      "condition": "fair"
    },
    {
      "id": "soil_profile_sim-soil-test",
      "name": "Soil test",
      "category": "test",
      "tags": [
        "test"
      ],
      "cost": 40,
      "quantity": 1,
      "condition": "new"
    }
  ]
}
