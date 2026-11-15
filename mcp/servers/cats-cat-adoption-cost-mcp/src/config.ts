import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "cats-cat-adoption-cost-mcp",
  "title": "Cat Adoption Budget Audit",
  "description": "Audit cat adoption budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "cat_adoption_budget",
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
    "budget": 750,
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
      "id": "cat_adoption_budget-landlord-approval",
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
      "id": "cat_adoption_budget-litter-routine",
      "name": "Litter routine",
      "category": "schedule",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "cat_adoption_budget-cat-insurance",
      "name": "Cat insurance",
      "category": "cost",
      "tags": [
        "budget"
      ],
      "cost": 420,
      "quantity": 420,
      "condition": "fair"
    },
    {
      "id": "cat_adoption_budget-vet-contact",
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
      "id": "cat_adoption_budget-cat-tree",
      "name": "Cat tree",
      "category": "supplies",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "new"
    },
    {
      "id": "cat_adoption_budget-window-perch",
      "name": "Window perch",
      "category": "supplies",
      "tags": [
        "budget"
      ],
      "cost": 45,
      "quantity": 45,
      "condition": "fair"
    }
  ]
}
