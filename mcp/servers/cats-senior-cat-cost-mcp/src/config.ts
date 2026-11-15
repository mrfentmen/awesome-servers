import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "cats-senior-cat-cost-mcp",
  "title": "Senior Cat Care Budget Audit",
  "description": "Audit senior cat care budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "senior_cat_budget",
  "entity": "senior cat care item budget line",
  "categories": [
    {
      "id": "mobility",
      "label": "Mobility",
      "baseline": 1
    },
    {
      "id": "kidney",
      "label": "Kidney",
      "baseline": 1
    },
    {
      "id": "dental",
      "label": "Dental",
      "baseline": 1
    },
    {
      "id": "vet",
      "label": "Veterinary",
      "baseline": 1
    },
    {
      "id": "comfort",
      "label": "Comfort",
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
    "budget": 600,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "movement",
      "label": "Movement",
      "categories": [
        "mobility"
      ]
    },
    {
      "id": "kidney",
      "label": "Kidney support",
      "categories": [
        "kidney"
      ]
    },
    {
      "id": "dental",
      "label": "Dental support",
      "categories": [
        "dental"
      ]
    },
    {
      "id": "health",
      "label": "Health checks",
      "categories": [
        "vet"
      ]
    },
    {
      "id": "rest",
      "label": "Rest",
      "categories": [
        "comfort"
      ]
    }
  ],
  "sample": [
    {
      "id": "senior_cat_budget-low-stairs",
      "name": "Low stairs",
      "category": "mobility",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "new"
    },
    {
      "id": "senior_cat_budget-water-fountain",
      "name": "Water fountain",
      "category": "kidney",
      "tags": [
        "budget"
      ],
      "cost": 50,
      "quantity": 50,
      "condition": "good"
    },
    {
      "id": "senior_cat_budget-dental-chews",
      "name": "Dental chews",
      "category": "dental",
      "tags": [
        "budget"
      ],
      "cost": 18,
      "quantity": 18,
      "condition": "fair"
    },
    {
      "id": "senior_cat_budget-senior-blood-panel",
      "name": "Senior blood panel",
      "category": "vet",
      "tags": [
        "budget"
      ],
      "cost": 220,
      "quantity": 220,
      "condition": "good"
    },
    {
      "id": "senior_cat_budget-heated-bed",
      "name": "Heated bed",
      "category": "comfort",
      "tags": [
        "budget"
      ],
      "cost": 75,
      "quantity": 75,
      "condition": "good"
    },
    {
      "id": "senior_cat_budget-low-entry-litter-box",
      "name": "Low-entry litter box",
      "category": "mobility",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "good"
    }
  ]
}
