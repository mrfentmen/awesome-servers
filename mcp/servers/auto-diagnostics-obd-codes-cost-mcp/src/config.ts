import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "auto-diagnostics-obd-codes-cost-mcp",
  "title": "OBD-II Codes Budget Audit",
  "description": "Audit obd-ii codes budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "obd_codes_budget",
  "entity": "fault code budget line",
  "categories": [
    {
      "id": "engine",
      "label": "Engine",
      "baseline": 2
    },
    {
      "id": "transmission",
      "label": "Transmission",
      "baseline": 2
    },
    {
      "id": "abs",
      "label": "ABS",
      "baseline": 2
    },
    {
      "id": "airbag",
      "label": "Airbag",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
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
      "id": "engine",
      "label": "Engine scan",
      "categories": [
        "engine"
      ]
    },
    {
      "id": "transmission",
      "label": "Transmission scan",
      "categories": [
        "transmission"
      ]
    },
    {
      "id": "abs",
      "label": "ABS scan",
      "categories": [
        "abs"
      ]
    },
    {
      "id": "airbag",
      "label": "Airbag scan",
      "categories": [
        "airbag"
      ]
    }
  ],
  "sample": [
    {
      "id": "obd_codes_budget-p0301-misfire",
      "name": "P0301 misfire",
      "category": "engine",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "obd_codes_budget-p0700-transmission",
      "name": "P0700 transmission",
      "category": "transmission",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "obd_codes_budget-c0035-abs-sensor",
      "name": "C0035 ABS sensor",
      "category": "abs",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "obd_codes_budget-b0001-airbag",
      "name": "B0001 airbag",
      "category": "airbag",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "worn"
    }
  ]
}
