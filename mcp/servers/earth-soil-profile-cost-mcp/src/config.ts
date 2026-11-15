import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "earth-soil-profile-cost-mcp",
  "title": "Soil Profile Budget Audit",
  "description": "Audit soil profile budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "soil_profile_budget",
  "entity": "soil layer budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 500,
    "direction": "lower"
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
      "id": "soil_profile_budget-soil-test",
      "name": "Soil test",
      "category": "topsoil",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    },
    {
      "id": "soil_profile_budget-soil-auger",
      "name": "Soil auger",
      "category": "subsoil",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    },
    {
      "id": "soil_profile_budget-compost",
      "name": "Compost",
      "category": "drainage",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "new"
    },
    {
      "id": "soil_profile_budget-drainage-trench",
      "name": "Drainage trench",
      "category": "test",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "new"
    }
  ]
}
