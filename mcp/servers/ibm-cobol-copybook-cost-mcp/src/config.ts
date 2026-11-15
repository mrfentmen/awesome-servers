import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "ibm-cobol-copybook-cost-mcp",
  "title": "COBOL Copybook Budget Audit",
  "description": "Audit cobol copybook budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "cobol_copybook_budget",
  "entity": "copybook field budget line",
  "categories": [
    {
      "id": "fields",
      "label": "Fields",
      "baseline": 2
    },
    {
      "id": "pic",
      "label": "PIC",
      "baseline": 1
    },
    {
      "id": "redefines",
      "label": "Redefines",
      "baseline": 1
    },
    {
      "id": "length",
      "label": "Length",
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
    "budget": 50,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "fields",
      "label": "Fields",
      "categories": [
        "fields"
      ]
    },
    {
      "id": "pic",
      "label": "PIC",
      "categories": [
        "pic"
      ]
    },
    {
      "id": "redefines",
      "label": "Redefines",
      "categories": [
        "redefines"
      ]
    },
    {
      "id": "length",
      "label": "Length",
      "categories": [
        "length"
      ]
    }
  ],
  "sample": [
    {
      "id": "cobol_copybook_budget_budget-copybook-scan",
      "name": "Copybook scan",
      "category": "fields",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "cobol_copybook_budget_budget-parser",
      "name": "Parser",
      "category": "pic",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "cobol_copybook_budget_budget-test-data",
      "name": "Test data",
      "category": "redefines",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "new"
    },
    {
      "id": "cobol_copybook_budget_budget-review",
      "name": "Review",
      "category": "length",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
