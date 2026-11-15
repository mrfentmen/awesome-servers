import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "ibm-jcl-job-plan-mcp",
  "title": "JCL Job Planning Audit",
  "description": "Plan jcl job by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "jcl_job_plan",
  "entity": "JCL job plan",
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
    "id": "step_count",
    "label": "Step count",
    "unit": "steps",
    "target": 6,
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
      "id": "jcl_job_plan-compile-step",
      "name": "Compile step",
      "category": "steps",
      "tags": [
        "steps"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "jcl_job_plan-condition-code",
      "name": "Condition code",
      "category": "condition",
      "tags": [
        "condition"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "jcl_job_plan-input-dataset",
      "name": "Input dataset",
      "category": "datasets",
      "tags": [
        "datasets"
      ],
      "cost": 0,
      "quantity": 3,
      "condition": "good"
    },
    {
      "id": "jcl_job_plan-restart-plan",
      "name": "Restart plan",
      "category": "restart",
      "tags": [
        "restart"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
