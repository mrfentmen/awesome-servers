import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "air-quality-purifier-sizing-cost-mcp",
  "title": "Purifier Sizing Budget Audit",
  "description": "Audit purifier sizing budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "purifier_sizing_budget",
  "entity": "purifier setup budget line",
  "categories": [
    {
      "id": "room",
      "label": "Room",
      "baseline": 2
    },
    {
      "id": "filter",
      "label": "Filter",
      "baseline": 1
    },
    {
      "id": "airflow",
      "label": "Airflow",
      "baseline": 1
    },
    {
      "id": "power",
      "label": "Power",
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
    "budget": 600,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "room",
      "label": "Room",
      "categories": [
        "room"
      ]
    },
    {
      "id": "filter",
      "label": "Filter",
      "categories": [
        "filter"
      ]
    },
    {
      "id": "airflow",
      "label": "Airflow",
      "categories": [
        "airflow"
      ]
    },
    {
      "id": "power",
      "label": "Power",
      "categories": [
        "power"
      ]
    }
  ],
  "sample": [
    {
      "id": "purifier_sizing_budget-purifier",
      "name": "Purifier",
      "category": "room",
      "tags": [
        "budget"
      ],
      "cost": 300,
      "quantity": 300,
      "condition": "new"
    },
    {
      "id": "purifier_sizing_budget-hepa-filter",
      "name": "HEPA filter",
      "category": "filter",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "new"
    },
    {
      "id": "purifier_sizing_budget-airflow-test",
      "name": "Airflow test",
      "category": "airflow",
      "tags": [
        "budget"
      ],
      "cost": 50,
      "quantity": 50,
      "condition": "new"
    },
    {
      "id": "purifier_sizing_budget-smart-plug",
      "name": "Smart plug",
      "category": "power",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "new"
    }
  ]
}
