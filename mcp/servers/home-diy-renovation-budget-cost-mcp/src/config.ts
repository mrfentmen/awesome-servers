import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "home-diy-renovation-budget-cost-mcp",
  "title": "Renovation Budget Budget Audit",
  "description": "Audit renovation budget budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "renovation_budget_budget",
  "entity": "budget line budget line",
  "categories": [
    {
      "id": "demo",
      "label": "Demolition",
      "baseline": 1
    },
    {
      "id": "materials",
      "label": "Materials",
      "baseline": 3
    },
    {
      "id": "labor",
      "label": "Labour",
      "baseline": 3
    },
    {
      "id": "permits",
      "label": "Permits",
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
    "budget": 8200,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "demo",
      "label": "Demolition",
      "categories": [
        "demo"
      ]
    },
    {
      "id": "materials",
      "label": "Materials",
      "categories": [
        "materials"
      ]
    },
    {
      "id": "labor",
      "label": "Labour",
      "categories": [
        "labor"
      ]
    },
    {
      "id": "permits",
      "label": "Permits",
      "categories": [
        "permits"
      ]
    }
  ],
  "sample": [
    {
      "id": "renovation_budget_budget-kitchen-demolition",
      "name": "Kitchen demolition",
      "category": "demo",
      "tags": [
        "budget"
      ],
      "cost": 800,
      "quantity": 800,
      "condition": "good"
    },
    {
      "id": "renovation_budget_budget-cabinet-package",
      "name": "Cabinet package",
      "category": "materials",
      "tags": [
        "budget"
      ],
      "cost": 2500,
      "quantity": 2500,
      "condition": "new"
    },
    {
      "id": "renovation_budget_budget-installer-labour",
      "name": "Installer labour",
      "category": "labor",
      "tags": [
        "budget"
      ],
      "cost": 3000,
      "quantity": 3000,
      "condition": "good"
    },
    {
      "id": "renovation_budget_budget-building-permit",
      "name": "Building permit",
      "category": "permits",
      "tags": [
        "budget"
      ],
      "cost": 500,
      "quantity": 500,
      "condition": "new"
    }
  ]
}
