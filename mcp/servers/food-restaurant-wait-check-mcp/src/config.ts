import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "food-restaurant-wait-check-mcp",
  "title": "Restaurant Wait Audit",
  "description": "Audit restaurant options by wait time, category coverage, spend and service gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "restaurant_wait",
  "entity": "restaurant",
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
    "id": "service_gap",
    "label": "Wait time",
    "unit": "minutes",
    "target": 20,
    "direction": "lower"
  },
  "target": {
    "maxItems": 15,
    "budget": 300,
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
      "id": "wait-taco",
      "name": "Taco stand",
      "category": "quick",
      "tags": [
        "walk-in"
      ],
      "cost": 12,
      "quantity": 10,
      "condition": "good"
    },
    {
      "id": "wait-diner",
      "name": "Corner diner",
      "category": "casual",
      "tags": [
        "table"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "wait-bistro",
      "name": "Neighborhood bistro",
      "category": "fine",
      "tags": [
        "reservation"
      ],
      "cost": 60,
      "quantity": 40,
      "condition": "fair"
    },
    {
      "id": "wait-cafe",
      "name": "Espresso bar",
      "category": "cafe",
      "tags": [
        "counter"
      ],
      "cost": 6,
      "quantity": 8,
      "condition": "good"
    }
  ]
}
