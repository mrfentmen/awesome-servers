import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "petco-prescription-refill-index-mcp",
  "title": "Prescription Refill Archive",
  "description": "Archive prescription refill by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "prescription_refill_index",
  "entity": "prescription refill archive",
  "categories": [
    {
      "id": "medication",
      "label": "Medication",
      "baseline": 1
    },
    {
      "id": "food",
      "label": "Prescription food",
      "baseline": 1
    },
    {
      "id": "supplement",
      "label": "Supplements",
      "baseline": 1
    },
    {
      "id": "document",
      "label": "Documents",
      "baseline": 1
    },
    {
      "id": "schedule",
      "label": "Schedule",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "days_supply",
    "label": "Days supply",
    "unit": "days",
    "target": 14,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 300,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "medicine",
      "label": "Medicine",
      "categories": [
        "medication"
      ]
    },
    {
      "id": "diet",
      "label": "Prescription diet",
      "categories": [
        "food"
      ]
    },
    {
      "id": "support",
      "label": "Supplement support",
      "categories": [
        "supplement"
      ]
    },
    {
      "id": "authorisation",
      "label": "Authorisation",
      "categories": [
        "document"
      ]
    },
    {
      "id": "reminder",
      "label": "Refill reminder",
      "categories": [
        "schedule"
      ]
    }
  ],
  "sample": [
    {
      "id": "prescription_refill_index-heartworm",
      "name": "Heartworm chew",
      "category": "medication",
      "tags": [
        "monthly",
        "vet"
      ],
      "cost": 35,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "prescription_refill_index-kidney",
      "name": "Kidney diet",
      "category": "food",
      "tags": [
        "prescription",
        "wet"
      ],
      "cost": 55,
      "quantity": 12,
      "condition": "fair"
    },
    {
      "id": "prescription_refill_index-joint",
      "name": "Joint supplement",
      "category": "supplement",
      "tags": [
        "daily",
        "chew"
      ],
      "cost": 28,
      "quantity": 30,
      "condition": "good"
    },
    {
      "id": "prescription_refill_index-label",
      "name": "Vet label",
      "category": "document",
      "tags": [
        "dose",
        "current"
      ],
      "cost": 0,
      "quantity": 10,
      "condition": "fair"
    },
    {
      "id": "prescription_refill_index-schedule",
      "name": "Refill reminder",
      "category": "schedule",
      "tags": [
        "14-days",
        "sms"
      ],
      "cost": 0,
      "quantity": 14,
      "condition": "good"
    },
    {
      "id": "prescription_refill_index-pain",
      "name": "Pain medication",
      "category": "medication",
      "tags": [
        "post-op",
        "limited"
      ],
      "cost": 40,
      "quantity": 5,
      "condition": "worn"
    }
  ]
}
