import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "cats-cat-adoption-match-mcp",
  "title": "Cat Adoption Match Audit",
  "description": "Match cat adoption by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "cat_adoption_match",
  "entity": "adoption item match",
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
    "budget": 1200,
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
      "id": "cat_adoption_match-home",
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
      "id": "cat_adoption_match-litter",
      "name": "Litter routine",
      "category": "schedule",
      "tags": [
        "daily",
        "two-boxes"
      ],
      "cost": 0,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "cat_adoption_match-insurance",
      "name": "Cat insurance",
      "category": "cost",
      "tags": [
        "annual",
        "accident"
      ],
      "cost": 420,
      "quantity": 72,
      "condition": "fair"
    },
    {
      "id": "cat_adoption_match-vet",
      "name": "Vet contact",
      "category": "care",
      "tags": [
        "local",
        "feline"
      ],
      "cost": 0,
      "quantity": 88,
      "condition": "good"
    },
    {
      "id": "cat_adoption_match-tree",
      "name": "Cat tree",
      "category": "supplies",
      "tags": [
        "tall",
        "stable"
      ],
      "cost": 120,
      "quantity": 85,
      "condition": "new"
    },
    {
      "id": "cat_adoption_match-perch",
      "name": "Window perch",
      "category": "supplies",
      "tags": [
        "window",
        "sun"
      ],
      "cost": 45,
      "quantity": 70,
      "condition": "fair"
    }
  ]
}
