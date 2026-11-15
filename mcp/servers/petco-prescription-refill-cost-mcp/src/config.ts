import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "petco-prescription-refill-cost-mcp",
  "title": "Prescription Refill Budget Audit",
  "description": "Audit prescription refill budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "prescription_refill_budget",
  "entity": "prescription refill budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 200,
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
      "id": "prescription_refill_budget-heartworm-chew",
      "name": "Heartworm chew",
      "category": "medication",
      "tags": [
        "budget"
      ],
      "cost": 35,
      "quantity": 35,
      "condition": "good"
    },
    {
      "id": "prescription_refill_budget-kidney-diet",
      "name": "Kidney diet",
      "category": "food",
      "tags": [
        "budget"
      ],
      "cost": 55,
      "quantity": 55,
      "condition": "fair"
    },
    {
      "id": "prescription_refill_budget-joint-supplement",
      "name": "Joint supplement",
      "category": "supplement",
      "tags": [
        "budget"
      ],
      "cost": 28,
      "quantity": 28,
      "condition": "good"
    },
    {
      "id": "prescription_refill_budget-vet-label",
      "name": "Vet label",
      "category": "document",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "prescription_refill_budget-refill-reminder",
      "name": "Refill reminder",
      "category": "schedule",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "prescription_refill_budget-pain-medication",
      "name": "Pain medication",
      "category": "medication",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "worn"
    }
  ]
}
