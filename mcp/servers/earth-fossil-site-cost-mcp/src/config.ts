import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "earth-fossil-site-cost-mcp",
  "title": "Fossil Site Budget Audit",
  "description": "Audit fossil site budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "fossil_site_budget",
  "entity": "fossil site item budget line",
  "categories": [
    {
      "id": "access",
      "label": "Access",
      "baseline": 2
    },
    {
      "id": "layers",
      "label": "Layers",
      "baseline": 1
    },
    {
      "id": "tools",
      "label": "Tools",
      "baseline": 1
    },
    {
      "id": "records",
      "label": "Records",
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
      "id": "access",
      "label": "Access",
      "categories": [
        "access"
      ]
    },
    {
      "id": "layers",
      "label": "Layers",
      "categories": [
        "layers"
      ]
    },
    {
      "id": "tools",
      "label": "Tools",
      "categories": [
        "tools"
      ]
    },
    {
      "id": "records",
      "label": "Records",
      "categories": [
        "records"
      ]
    }
  ],
  "sample": [
    {
      "id": "fossil_site_budget-site-permit",
      "name": "Site permit",
      "category": "access",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    },
    {
      "id": "fossil_site_budget-geology-guide",
      "name": "Geology guide",
      "category": "layers",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "new"
    },
    {
      "id": "fossil_site_budget-field-tools",
      "name": "Field tools",
      "category": "tools",
      "tags": [
        "budget"
      ],
      "cost": 40,
      "quantity": 40,
      "condition": "new"
    },
    {
      "id": "fossil_site_budget-record-archive",
      "name": "Record archive",
      "category": "records",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "new"
    }
  ]
}
