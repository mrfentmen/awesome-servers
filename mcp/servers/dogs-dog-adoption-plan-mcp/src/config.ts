import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "dogs-dog-adoption-plan-mcp",
  "title": "Dog Adoption Planning Audit",
  "description": "Plan dog adoption by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "dog_adoption_plan",
  "entity": "adoption item plan",
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
    "id": "readiness_score",
    "label": "Readiness score",
    "unit": "%",
    "target": 80,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 1500,
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
      "id": "dog_adoption_plan-home",
      "name": "Landlord approval",
      "category": "housing",
      "tags": [
        "rental",
        "written"
      ],
      "cost": 0,
      "quantity": 100,
      "condition": "good"
    },
    {
      "id": "dog_adoption_plan-walk",
      "name": "Daily walk plan",
      "category": "schedule",
      "tags": [
        "morning",
        "evening"
      ],
      "cost": 0,
      "quantity": 85,
      "condition": "good"
    },
    {
      "id": "dog_adoption_plan-insurance",
      "name": "Pet insurance",
      "category": "cost",
      "tags": [
        "annual",
        "accident"
      ],
      "cost": 600,
      "quantity": 70,
      "condition": "fair"
    },
    {
      "id": "dog_adoption_plan-vet",
      "name": "Vet contact",
      "category": "care",
      "tags": [
        "local",
        "emergency"
      ],
      "cost": 0,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "dog_adoption_plan-crate",
      "name": "Crate",
      "category": "supplies",
      "tags": [
        "medium",
        "metal"
      ],
      "cost": 80,
      "quantity": 95,
      "condition": "new"
    },
    {
      "id": "dog_adoption_plan-training",
      "name": "Training class",
      "category": "care",
      "tags": [
        "puppy",
        "group"
      ],
      "cost": 180,
      "quantity": 65,
      "condition": "fair"
    }
  ]
}
