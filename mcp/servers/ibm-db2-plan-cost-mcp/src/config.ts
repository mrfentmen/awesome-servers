import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "ibm-db2-plan-cost-mcp",
  "title": "Db2 Plan Budget Audit",
  "description": "Audit db2 plan budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "db2_plan_budget",
  "entity": "Db2 plan budget line",
  "categories": [
    {
      "id": "plans",
      "label": "Plans",
      "baseline": 2
    },
    {
      "id": "packages",
      "label": "Packages",
      "baseline": 1
    },
    {
      "id": "bind",
      "label": "Bind",
      "baseline": 1
    },
    {
      "id": "access",
      "label": "Access",
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
    "budget": 250,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "plans",
      "label": "Plans",
      "categories": [
        "plans"
      ]
    },
    {
      "id": "packages",
      "label": "Packages",
      "categories": [
        "packages"
      ]
    },
    {
      "id": "bind",
      "label": "Bind",
      "categories": [
        "bind"
      ]
    },
    {
      "id": "access",
      "label": "Access",
      "categories": [
        "access"
      ]
    }
  ],
  "sample": [
    {
      "id": "db2_plan_budget_budget-plan-analysis",
      "name": "Plan analysis",
      "category": "plans",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "db2_plan_budget_budget-bind-test",
      "name": "Bind test",
      "category": "packages",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "db2_plan_budget_budget-dba-review",
      "name": "DBA review",
      "category": "bind",
      "tags": [
        "budget"
      ],
      "cost": 200,
      "quantity": 200,
      "condition": "new"
    },
    {
      "id": "db2_plan_budget_budget-documentation",
      "name": "Documentation",
      "category": "access",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
