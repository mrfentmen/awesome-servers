import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "ibm-zos-dataset-cost-mcp",
  "title": "z/OS Dataset Budget Audit",
  "description": "Audit z/os dataset budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "zos_dataset_budget",
  "entity": "z/OS dataset budget line",
  "categories": [
    {
      "id": "names",
      "label": "Names",
      "baseline": 2
    },
    {
      "id": "space",
      "label": "Space",
      "baseline": 1
    },
    {
      "id": "retention",
      "label": "Retention",
      "baseline": 1
    },
    {
      "id": "backup",
      "label": "Backup",
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
    "budget": 100,
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
      "id": "space",
      "label": "Space",
      "categories": [
        "space"
      ]
    },
    {
      "id": "retention",
      "label": "Retention",
      "categories": [
        "retention"
      ]
    },
    {
      "id": "backup",
      "label": "Backup",
      "categories": [
        "backup"
      ]
    }
  ],
  "sample": [
    {
      "id": "zos_dataset_budget_budget-storage",
      "name": "Storage",
      "category": "names",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "new"
    },
    {
      "id": "zos_dataset_budget_budget-backup",
      "name": "Backup",
      "category": "space",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "new"
    },
    {
      "id": "zos_dataset_budget_budget-cleanup",
      "name": "Cleanup",
      "category": "retention",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "zos_dataset_budget_budget-review",
      "name": "Review",
      "category": "backup",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
