import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "ibm-jcl-job-cost-mcp",
  "title": "JCL Job Budget Audit",
  "description": "Audit jcl job budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "jcl_job_budget",
  "entity": "JCL job budget line",
  "categories": [
    {
      "id": "steps",
      "label": "Steps",
      "baseline": 2
    },
    {
      "id": "condition",
      "label": "Condition",
      "baseline": 1
    },
    {
      "id": "datasets",
      "label": "Datasets",
      "baseline": 1
    },
    {
      "id": "restart",
      "label": "Restart",
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
      "id": "steps",
      "label": "Steps",
      "categories": [
        "steps"
      ]
    },
    {
      "id": "condition",
      "label": "Condition",
      "categories": [
        "condition"
      ]
    },
    {
      "id": "datasets",
      "label": "Datasets",
      "categories": [
        "datasets"
      ]
    },
    {
      "id": "restart",
      "label": "Restart",
      "categories": [
        "restart"
      ]
    }
  ],
  "sample": [
    {
      "id": "jcl_job_budget_budget-job-run",
      "name": "Job run",
      "category": "steps",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "jcl_job_budget_budget-dataset-storage",
      "name": "Dataset storage",
      "category": "condition",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    },
    {
      "id": "jcl_job_budget_budget-restart-test",
      "name": "Restart test",
      "category": "datasets",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "jcl_job_budget_budget-documentation",
      "name": "Documentation",
      "category": "restart",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
