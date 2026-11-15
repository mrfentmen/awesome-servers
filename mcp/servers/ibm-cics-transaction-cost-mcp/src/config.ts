import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "ibm-cics-transaction-cost-mcp",
  "title": "CICS Transaction Budget Audit",
  "description": "Audit cics transaction budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "cics_transaction_budget",
  "entity": "CICS transaction budget line",
  "categories": [
    {
      "id": "names",
      "label": "Names",
      "baseline": 2
    },
    {
      "id": "programs",
      "label": "Programs",
      "baseline": 1
    },
    {
      "id": "files",
      "label": "Files",
      "baseline": 1
    },
    {
      "id": "response",
      "label": "Response",
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
    "budget": 200,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "names",
      "label": "Names",
      "categories": [
        "names"
      ]
    },
    {
      "id": "programs",
      "label": "Programs",
      "categories": [
        "programs"
      ]
    },
    {
      "id": "files",
      "label": "Files",
      "categories": [
        "files"
      ]
    },
    {
      "id": "response",
      "label": "Response",
      "categories": [
        "response"
      ]
    }
  ],
  "sample": [
    {
      "id": "cics_transaction_budget_budget-cics-region",
      "name": "CICS region",
      "category": "names",
      "tags": [
        "budget"
      ],
      "cost": 100,
      "quantity": 100,
      "condition": "new"
    },
    {
      "id": "cics_transaction_budget_budget-monitoring",
      "name": "Monitoring",
      "category": "programs",
      "tags": [
        "budget"
      ],
      "cost": 50,
      "quantity": 50,
      "condition": "new"
    },
    {
      "id": "cics_transaction_budget_budget-test-cycle",
      "name": "Test cycle",
      "category": "files",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "cics_transaction_budget_budget-documentation",
      "name": "Documentation",
      "category": "response",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
