import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "ibm-db2-plan-sim-mcp",
  "title": "Db2 Plan Simulator",
  "description": "Simulate db2 plan by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "db2_plan_sim",
  "entity": "Db2 plan simulation",
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
    "id": "plan_count",
    "label": "Plan count",
    "unit": "plans",
    "target": 10,
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
      "id": "db2_plan_sim-online-plan",
      "name": "Online plan",
      "category": "plans",
      "tags": [
        "plans"
      ],
      "cost": 0,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "db2_plan_sim-batch-package",
      "name": "Batch package",
      "category": "packages",
      "tags": [
        "packages"
      ],
      "cost": 0,
      "quantity": 5,
      "condition": "good"
    },
    {
      "id": "db2_plan_sim-bind-options",
      "name": "Bind options",
      "category": "bind",
      "tags": [
        "bind"
      ],
      "cost": 0,
      "quantity": 3,
      "condition": "good"
    },
    {
      "id": "db2_plan_sim-access-path",
      "name": "Access path",
      "category": "access",
      "tags": [
        "access"
      ],
      "cost": 0,
      "quantity": 4,
      "condition": "good"
    }
  ]
}
