import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "petco-grooming-slot-plan-mcp",
  "title": "Grooming Slot Planning Audit",
  "description": "Plan grooming slot by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "grooming_slot_plan",
  "entity": "grooming appointment plan",
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
    "id": "wait_days",
    "label": "Wait days",
    "unit": "days",
    "target": 7,
    "direction": "lower"
  },
  "target": {
    "maxItems": 15,
    "budget": 250,
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
      "id": "grooming_slot_plan-bath",
      "name": "Bath appointment",
      "category": "bath",
      "tags": [
        "medium-dog",
        "weekend"
      ],
      "cost": 55,
      "quantity": 9,
      "condition": "fair"
    },
    {
      "id": "grooming_slot_plan-haircut",
      "name": "Full haircut",
      "category": "haircut",
      "tags": [
        "poodle",
        "standing"
      ],
      "cost": 90,
      "quantity": 14,
      "condition": "worn"
    },
    {
      "id": "grooming_slot_plan-nails",
      "name": "Nail trim",
      "category": "nails",
      "tags": [
        "quick",
        "small-dog"
      ],
      "cost": 20,
      "quantity": 3,
      "condition": "good"
    },
    {
      "id": "grooming_slot_plan-teeth",
      "name": "Teeth cleaning",
      "category": "teeth",
      "tags": [
        "add-on",
        "daily"
      ],
      "cost": 15,
      "quantity": 5,
      "condition": "good"
    },
    {
      "id": "grooming_slot_plan-deshed",
      "name": "De-shed treatment",
      "category": "deshed",
      "tags": [
        "double-coat",
        "spring"
      ],
      "cost": 45,
      "quantity": 12,
      "condition": "fair"
    },
    {
      "id": "grooming_slot_plan-cat",
      "name": "Cat bath",
      "category": "bath",
      "tags": [
        "cat",
        "quiet"
      ],
      "cost": 65,
      "quantity": 8,
      "condition": "fair"
    }
  ]
}
