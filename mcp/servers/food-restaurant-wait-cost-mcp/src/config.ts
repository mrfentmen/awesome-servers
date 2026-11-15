import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "food-restaurant-wait-cost-mcp",
  "title": "Restaurant Wait Budget Audit",
  "description": "Audit restaurant wait budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "restaurant_wait_budget",
  "entity": "restaurant budget line",
  "categories": [
    {
      "id": "quick",
      "label": "Quick service",
      "baseline": 3
    },
    {
      "id": "casual",
      "label": "Casual",
      "baseline": 3
    },
    {
      "id": "fine",
      "label": "Fine dining",
      "baseline": 2
    },
    {
      "id": "cafe",
      "label": "Cafes",
      "baseline": 2
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
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "quick",
      "label": "Quick meal",
      "categories": [
        "quick"
      ]
    },
    {
      "id": "casual",
      "label": "Casual meal",
      "categories": [
        "casual"
      ]
    },
    {
      "id": "fine",
      "label": "Special meal",
      "categories": [
        "fine"
      ]
    },
    {
      "id": "cafe",
      "label": "Coffee stop",
      "categories": [
        "cafe"
      ]
    }
  ],
  "sample": [
    {
      "id": "restaurant_wait_budget-taco-stand",
      "name": "Taco stand",
      "category": "quick",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "good"
    },
    {
      "id": "restaurant_wait_budget-corner-diner",
      "name": "Corner diner",
      "category": "casual",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "restaurant_wait_budget-neighborhood-bistro",
      "name": "Neighborhood bistro",
      "category": "fine",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "fair"
    },
    {
      "id": "restaurant_wait_budget-espresso-bar",
      "name": "Espresso bar",
      "category": "cafe",
      "tags": [
        "budget"
      ],
      "cost": 6,
      "quantity": 6,
      "condition": "good"
    }
  ]
}
