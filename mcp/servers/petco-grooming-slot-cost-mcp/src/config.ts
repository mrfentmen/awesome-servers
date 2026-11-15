import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "petco-grooming-slot-cost-mcp",
  "title": "Grooming Slot Budget Audit",
  "description": "Audit grooming slot budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "grooming_slot_budget",
  "entity": "grooming appointment budget line",
  "categories": [
    {
      "id": "bath",
      "label": "Bath",
      "baseline": 1
    },
    {
      "id": "haircut",
      "label": "Haircut",
      "baseline": 1
    },
    {
      "id": "nails",
      "label": "Nails",
      "baseline": 1
    },
    {
      "id": "teeth",
      "label": "Teeth",
      "baseline": 1
    },
    {
      "id": "deshed",
      "label": "De-shed",
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
    "budget": 350,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "wash",
      "label": "Wash slot",
      "categories": [
        "bath"
      ]
    },
    {
      "id": "coat",
      "label": "Coat slot",
      "categories": [
        "haircut",
        "deshed"
      ]
    },
    {
      "id": "claws",
      "label": "Nail slot",
      "categories": [
        "nails"
      ]
    },
    {
      "id": "dental",
      "label": "Dental slot",
      "categories": [
        "teeth"
      ]
    }
  ],
  "sample": [
    {
      "id": "grooming_slot_budget-bath-appointment",
      "name": "Bath appointment",
      "category": "bath",
      "tags": [
        "budget"
      ],
      "cost": 55,
      "quantity": 55,
      "condition": "fair"
    },
    {
      "id": "grooming_slot_budget-full-haircut",
      "name": "Full haircut",
      "category": "haircut",
      "tags": [
        "budget"
      ],
      "cost": 90,
      "quantity": 90,
      "condition": "worn"
    },
    {
      "id": "grooming_slot_budget-nail-trim",
      "name": "Nail trim",
      "category": "nails",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "grooming_slot_budget-teeth-cleaning",
      "name": "Teeth cleaning",
      "category": "teeth",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "good"
    },
    {
      "id": "grooming_slot_budget-de-shed-treatment",
      "name": "De-shed treatment",
      "category": "deshed",
      "tags": [
        "budget"
      ],
      "cost": 45,
      "quantity": 45,
      "condition": "fair"
    },
    {
      "id": "grooming_slot_budget-cat-bath",
      "name": "Cat bath",
      "category": "bath",
      "tags": [
        "budget"
      ],
      "cost": 65,
      "quantity": 65,
      "condition": "fair"
    }
  ]
}
