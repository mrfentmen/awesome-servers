import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "california-fire-insurance-cost-mcp",
  "title": "Wildfire Insurance Budget Audit",
  "description": "Audit wildfire insurance budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "fire_insurance_budget",
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
      "id": "defensible-space",
      "label": "Defensible Space",
      "baseline": 1
    },
    {
      "id": "docs",
      "label": "Docs",
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
    "budget": 2800,
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
      "id": "defensible-space",
      "label": "Defensible Space",
      "categories": [
        "defensible-space"
      ]
    },
    {
      "id": "docs",
      "label": "Docs",
      "categories": [
        "docs"
      ]
    }
  ],
  "sample": [
    {
      "id": "fire_insurance_budget-policy-premium",
      "name": "Policy premium",
      "category": "policy",
      "tags": [
        "budget"
      ],
      "cost": 1800,
      "quantity": 1800,
      "condition": "new"
    },
    {
      "id": "fire_insurance_budget-coverage-review",
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
      "id": "fire_insurance_budget-defensible-space",
      "name": "Defensible space",
      "category": "defensible-space",
      "tags": [
        "budget"
      ],
      "cost": 500,
      "quantity": 500,
      "condition": "new"
    },
    {
      "id": "fire_insurance_budget-document-scan",
      "name": "Document scan",
      "category": "docs",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
