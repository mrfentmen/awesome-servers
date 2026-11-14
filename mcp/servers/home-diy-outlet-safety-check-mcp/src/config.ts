import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "home-diy-outlet-safety-check-mcp",
  "title": "Outlet Safety Audit",
  "description": "Audit outlets, GFCIs, surge protection and cords for safety severity and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "outlet_safety",
  "entity": "electrical item",
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
    "id": "dtc_severity",
    "label": "Safety severity",
    "unit": "score",
    "target": 2,
    "direction": "lower"
  },
  "target": {
    "maxItems": 25,
    "budget": 400,
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
      "id": "outlet-kitchen",
      "name": "Kitchen counter outlet",
      "category": "outlet",
      "tags": [
        "clean"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "outlet-bath-gfci",
      "name": "Bathroom GFCI",
      "category": "gfci",
      "tags": [
        "warning"
      ],
      "cost": 25,
      "quantity": 1,
      "condition": "fair"
    },
    {
      "id": "outlet-surge",
      "name": "Desk surge protector",
      "category": "surge",
      "tags": [
        "clean"
      ],
      "cost": 30,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "outlet-cable",
      "name": "Frayed extension cord",
      "category": "cable",
      "tags": [
        "critical"
      ],
      "cost": 10,
      "quantity": 1,
      "condition": "worn"
    },
    {
      "id": "outlet-hall",
      "name": "Hallway outlet",
      "category": "outlet",
      "tags": [
        "info"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
