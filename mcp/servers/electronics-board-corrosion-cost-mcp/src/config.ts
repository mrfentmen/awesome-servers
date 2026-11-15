import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "electronics-board-corrosion-cost-mcp",
  "title": "Board Corrosion Budget Audit",
  "description": "Audit board corrosion budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "board_corrosion_budget",
  "entity": "board inspection budget line",
  "categories": [
    {
      "id": "power",
      "label": "Power contacts",
      "baseline": 1
    },
    {
      "id": "connector",
      "label": "Connectors",
      "baseline": 1
    },
    {
      "id": "trace",
      "label": "Traces",
      "baseline": 1
    },
    {
      "id": "solder",
      "label": "Solder joints",
      "baseline": 1
    },
    {
      "id": "coating",
      "label": "Coatings",
      "baseline": 1
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
    "budget": 50,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "power",
      "label": "Power path",
      "categories": [
        "power"
      ]
    },
    {
      "id": "connector",
      "label": "Connector path",
      "categories": [
        "connector"
      ]
    },
    {
      "id": "conductor",
      "label": "Conductor path",
      "categories": [
        "trace",
        "solder"
      ]
    },
    {
      "id": "protection",
      "label": "Protection",
      "categories": [
        "coating"
      ]
    }
  ],
  "sample": [
    {
      "id": "board_corrosion_budget-battery-contacts",
      "name": "Battery contacts",
      "category": "power",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "board_corrosion_budget-usb-port",
      "name": "USB port",
      "category": "connector",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "board_corrosion_budget-clock-trace",
      "name": "Clock trace",
      "category": "trace",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "board_corrosion_budget-header-joint",
      "name": "Header joint",
      "category": "solder",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "board_corrosion_budget-conformal-coat",
      "name": "Conformal coat",
      "category": "coating",
      "tags": [
        "budget"
      ],
      "cost": 18,
      "quantity": 18,
      "condition": "new"
    },
    {
      "id": "board_corrosion_budget-board-edge",
      "name": "Board edge",
      "category": "trace",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "worn"
    }
  ]
}
