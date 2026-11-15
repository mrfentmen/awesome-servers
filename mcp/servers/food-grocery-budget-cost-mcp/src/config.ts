import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "food-grocery-budget-cost-mcp",
  "title": "Grocery Budget Budget Audit",
  "description": "Audit grocery budget budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "grocery_budget_budget",
  "entity": "grocery item budget line",
  "categories": [
    {
      "id": "produce",
      "label": "Produce",
      "baseline": 3
    },
    {
      "id": "protein",
      "label": "Protein",
      "baseline": 3
    },
    {
      "id": "pantry",
      "label": "Pantry",
      "baseline": 3
    },
    {
      "id": "dairy",
      "label": "Dairy",
      "baseline": 2
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
    "budget": 50,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "produce",
      "label": "Produce",
      "categories": [
        "produce"
      ]
    },
    {
      "id": "protein",
      "label": "Protein",
      "categories": [
        "protein"
      ]
    },
    {
      "id": "pantry",
      "label": "Pantry",
      "categories": [
        "pantry"
      ]
    },
    {
      "id": "dairy",
      "label": "Dairy",
      "categories": [
        "dairy"
      ]
    }
  ],
  "sample": [
    {
      "id": "grocery_budget_budget-apples",
      "name": "Apples",
      "category": "produce",
      "tags": [
        "budget"
      ],
      "cost": 4,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "grocery_budget_budget-chicken-breast",
      "name": "Chicken breast",
      "category": "protein",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "good"
    },
    {
      "id": "grocery_budget_budget-rice-bag",
      "name": "Rice bag",
      "category": "pantry",
      "tags": [
        "budget"
      ],
      "cost": 3,
      "quantity": 3,
      "condition": "new"
    },
    {
      "id": "grocery_budget_budget-greek-yogurt",
      "name": "Greek yogurt",
      "category": "dairy",
      "tags": [
        "budget"
      ],
      "cost": 6,
      "quantity": 6,
      "condition": "good"
    }
  ]
}
