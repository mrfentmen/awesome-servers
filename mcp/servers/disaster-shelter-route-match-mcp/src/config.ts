import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "disaster-shelter-route-match-mcp",
  "title": "Shelter Route Match Audit",
  "description": "Match shelter route by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "shelter_route_match",
  "entity": "shelter route match",
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
    "id": "travel_minutes",
    "label": "Travel minutes",
    "unit": "min",
    "target": 30,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 250,
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
      "id": "shelter_route_match-home",
      "name": "Home shelter",
      "category": "home",
      "tags": [
        "interior",
        "basement"
      ],
      "cost": 0,
      "quantity": 5,
      "condition": "good"
    },
    {
      "id": "shelter_route_match-school",
      "name": "Neighborhood school",
      "category": "neighborhood",
      "tags": [
        "walk",
        "pet-friendly"
      ],
      "cost": 0,
      "quantity": 18,
      "condition": "good"
    },
    {
      "id": "shelter_route_match-bus",
      "name": "Bus route",
      "category": "transit",
      "tags": [
        "bus",
        "off-peak"
      ],
      "cost": 3,
      "quantity": 35,
      "condition": "fair"
    },
    {
      "id": "shelter_route_match-accessible",
      "name": "Accessible shelter",
      "category": "accessible",
      "tags": [
        "step-free",
        "elevator"
      ],
      "cost": 0,
      "quantity": 22,
      "condition": "good"
    },
    {
      "id": "shelter_route_match-kit",
      "name": "Go-bag",
      "category": "supply",
      "tags": [
        "water",
        "radio"
      ],
      "cost": 80,
      "quantity": 15,
      "condition": "new"
    },
    {
      "id": "shelter_route_match-community",
      "name": "Community centre",
      "category": "neighborhood",
      "tags": [
        "backup",
        "generator"
      ],
      "cost": 0,
      "quantity": 25,
      "condition": "good"
    }
  ]
}
