import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "dogs-dog-adoption-cost-mcp",
  "title": "Dog Adoption Budget Audit",
  "description": "Audit dog adoption budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "dog_adoption_budget",
  "entity": "adoption item budget line",
  "categories": [
    {
      "id": "housing",
      "label": "Housing",
      "baseline": 1
    },
    {
      "id": "schedule",
      "label": "Schedule",
      "baseline": 1
    },
    {
      "id": "cost",
      "label": "Cost",
      "baseline": 1
    },
    {
      "id": "care",
      "label": "Care",
      "baseline": 1
    },
    {
      "id": "supplies",
      "label": "Supplies",
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
    "budget": 1050,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "stable_home",
      "label": "Stable home",
      "categories": [
        "housing"
      ]
    },
    {
      "id": "routine",
      "label": "Daily routine",
      "categories": [
        "schedule"
      ]
    },
    {
      "id": "budget",
      "label": "Adoption budget",
      "categories": [
        "cost"
      ]
    },
    {
      "id": "health",
      "label": "Health plan",
      "categories": [
        "care"
      ]
    },
    {
      "id": "gear",
      "label": "Supplies",
      "categories": [
        "supplies"
      ]
    }
  ],
  "sample": [
    {
      "id": "dog_adoption_budget-landlord-approval",
      "name": "Landlord approval",
      "category": "housing",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "dog_adoption_budget-daily-walk-plan",
      "name": "Daily walk plan",
      "category": "schedule",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "dog_adoption_budget-pet-insurance",
      "name": "Pet insurance",
      "category": "cost",
      "tags": [
        "budget"
      ],
      "cost": 600,
      "quantity": 600,
      "condition": "fair"
    },
    {
      "id": "dog_adoption_budget-vet-contact",
      "name": "Vet contact",
      "category": "care",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "dog_adoption_budget-crate",
      "name": "Crate",
      "category": "supplies",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    },
    {
      "id": "dog_adoption_budget-training-class",
      "name": "Training class",
      "category": "care",
      "tags": [
        "budget"
      ],
      "cost": 180,
      "quantity": 180,
      "condition": "fair"
    }
  ]
}
