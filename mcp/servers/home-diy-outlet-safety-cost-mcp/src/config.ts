import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "home-diy-outlet-safety-cost-mcp",
  "title": "Outlet Safety Budget Audit",
  "description": "Audit outlet safety budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "outlet_safety_budget",
  "entity": "electrical item budget line",
  "categories": [
    {
      "id": "outlet",
      "label": "Outlets",
      "baseline": 5
    },
    {
      "id": "gfci",
      "label": "GFCI outlets",
      "baseline": 3
    },
    {
      "id": "surge",
      "label": "Surge protectors",
      "baseline": 2
    },
    {
      "id": "cable",
      "label": "Cords and cables",
      "baseline": 4
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
      "id": "outlets",
      "label": "Outlet coverage",
      "categories": [
        "outlet",
        "gfci"
      ]
    },
    {
      "id": "protection",
      "label": "Surge protection",
      "categories": [
        "surge"
      ]
    },
    {
      "id": "cables",
      "label": "Cable safety",
      "categories": [
        "cable"
      ]
    }
  ],
  "sample": [
    {
      "id": "outlet_safety_budget-kitchen-counter-outlet",
      "name": "Kitchen counter outlet",
      "category": "outlet",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "outlet_safety_budget-bathroom-gfci",
      "name": "Bathroom GFCI",
      "category": "gfci",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "fair"
    },
    {
      "id": "outlet_safety_budget-desk-surge-protector",
      "name": "Desk surge protector",
      "category": "surge",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "good"
    },
    {
      "id": "outlet_safety_budget-frayed-extension-cord",
      "name": "Frayed extension cord",
      "category": "cable",
      "tags": [
        "budget"
      ],
      "cost": 10,
      "quantity": 10,
      "condition": "worn"
    },
    {
      "id": "outlet_safety_budget-hallway-outlet",
      "name": "Hallway outlet",
      "category": "outlet",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    }
  ]
}
