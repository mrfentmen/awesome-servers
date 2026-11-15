import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "disaster-shelter-route-cost-mcp",
  "title": "Shelter Route Budget Audit",
  "description": "Audit shelter route budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "shelter_route_budget",
  "entity": "shelter route budget line",
  "categories": [
    {
      "id": "home",
      "label": "Home",
      "baseline": 1
    },
    {
      "id": "neighborhood",
      "label": "Neighborhood",
      "baseline": 1
    },
    {
      "id": "transit",
      "label": "Transit",
      "baseline": 1
    },
    {
      "id": "accessible",
      "label": "Accessible",
      "baseline": 1
    },
    {
      "id": "supply",
      "label": "Supplies",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 100,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "local",
      "label": "Local shelter",
      "categories": [
        "home",
        "neighborhood"
      ]
    },
    {
      "id": "transit",
      "label": "Transit route",
      "categories": [
        "transit"
      ]
    },
    {
      "id": "access",
      "label": "Accessible route",
      "categories": [
        "accessible"
      ]
    },
    {
      "id": "supplies",
      "label": "Route supplies",
      "categories": [
        "supply"
      ]
    }
  ],
  "sample": [
    {
      "id": "shelter_route_budget-home-shelter",
      "name": "Home shelter",
      "category": "home",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "shelter_route_budget-neighborhood-school",
      "name": "Neighborhood school",
      "category": "neighborhood",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "shelter_route_budget-bus-route",
      "name": "Bus route",
      "category": "transit",
      "tags": [
        "budget"
      ],
      "cost": 3,
      "quantity": 3,
      "condition": "fair"
    },
    {
      "id": "shelter_route_budget-accessible-shelter",
      "name": "Accessible shelter",
      "category": "accessible",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "shelter_route_budget-go-bag",
      "name": "Go-bag",
      "category": "supply",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    },
    {
      "id": "shelter_route_budget-community-centre",
      "name": "Community centre",
      "category": "neighborhood",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    }
  ]
}
