import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "flood-flood-insurance-cost-mcp",
  "title": "Flood Insurance Budget Audit",
  "description": "Audit flood insurance budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "flood_insurance_budget",
  "entity": "insurance item budget line",
  "categories": [
    {
      "id": "policy",
      "label": "Policy",
      "baseline": 2
    },
    {
      "id": "coverage",
      "label": "Coverage",
      "baseline": 1
    },
    {
      "id": "inventory",
      "label": "Inventory",
      "baseline": 1
    },
    {
      "id": "documents",
      "label": "Documents",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 500,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 1000,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "policy",
      "label": "Policy",
      "categories": [
        "policy"
      ]
    },
    {
      "id": "coverage",
      "label": "Coverage",
      "categories": [
        "coverage"
      ]
    },
    {
      "id": "inventory",
      "label": "Inventory",
      "categories": [
        "inventory"
      ]
    },
    {
      "id": "documents",
      "label": "Documents",
      "categories": [
        "documents"
      ]
    }
  ],
  "sample": [
    {
      "id": "flood_insurance_budget-policy-premium",
      "name": "Policy premium",
      "category": "policy",
      "tags": [
        "budget"
      ],
      "cost": 800,
      "quantity": 800,
      "condition": "new"
    },
    {
      "id": "flood_insurance_budget-coverage-review",
      "name": "Coverage review",
      "category": "coverage",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "flood_insurance_budget-contents-inventory",
      "name": "Contents inventory",
      "category": "inventory",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "flood_insurance_budget-document-scan",
      "name": "Document scan",
      "category": "documents",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
