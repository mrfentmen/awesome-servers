import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "accessibility-event-access-cost-mcp",
  "title": "Event Access Budget Audit",
  "description": "Audit event access budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "event_access_budget",
  "entity": "event access item budget line",
  "categories": [
    {
      "id": "seating",
      "label": "Seating",
      "baseline": 2
    },
    {
      "id": "entry",
      "label": "Entry",
      "baseline": 2
    },
    {
      "id": "restroom",
      "label": "Restroom",
      "baseline": 1
    },
    {
      "id": "parking",
      "label": "Parking",
      "baseline": 1
    },
    {
      "id": "captioning",
      "label": "Captioning",
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
    "budget": 5200,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "entry",
      "label": "Step-free entry",
      "categories": [
        "entry"
      ]
    },
    {
      "id": "seating",
      "label": "Accessible seating",
      "categories": [
        "seating"
      ]
    },
    {
      "id": "facilities",
      "label": "Accessible facilities",
      "categories": [
        "restroom"
      ]
    },
    {
      "id": "parking",
      "label": "Accessible parking",
      "categories": [
        "parking"
      ]
    },
    {
      "id": "info",
      "label": "Accessible information",
      "categories": [
        "captioning"
      ]
    }
  ],
  "sample": [
    {
      "id": "event_access_budget-accessible-seating",
      "name": "Accessible seating",
      "category": "seating",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "event_access_budget-extra-seating-row",
      "name": "Extra seating row",
      "category": "seating",
      "tags": [
        "budget"
      ],
      "cost": 500,
      "quantity": 500,
      "condition": "good"
    },
    {
      "id": "event_access_budget-step-free-entry",
      "name": "Step-free entry",
      "category": "entry",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "event_access_budget-side-entrance",
      "name": "Side entrance",
      "category": "entry",
      "tags": [
        "budget"
      ],
      "cost": 1000,
      "quantity": 1000,
      "condition": "fair"
    },
    {
      "id": "event_access_budget-accessible-restroom",
      "name": "Accessible restroom",
      "category": "restroom",
      "tags": [
        "budget"
      ],
      "cost": 300,
      "quantity": 300,
      "condition": "good"
    },
    {
      "id": "event_access_budget-portable-restroom",
      "name": "Portable restroom",
      "category": "restroom",
      "tags": [
        "budget"
      ],
      "cost": 1500,
      "quantity": 1500,
      "condition": "worn"
    },
    {
      "id": "event_access_budget-accessible-parking",
      "name": "Accessible parking",
      "category": "parking",
      "tags": [
        "budget"
      ],
      "cost": 200,
      "quantity": 200,
      "condition": "good"
    },
    {
      "id": "event_access_budget-live-captioning",
      "name": "Live captioning",
      "category": "captioning",
      "tags": [
        "budget"
      ],
      "cost": 800,
      "quantity": 800,
      "condition": "fair"
    }
  ]
}
