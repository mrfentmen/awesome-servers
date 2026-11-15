import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "electronics-repair-parts-cost-mcp",
  "title": "Repair Parts Budget Audit",
  "description": "Audit repair parts budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "repair_parts_budget",
  "entity": "repair part budget line",
  "categories": [
    {
      "id": "screen",
      "label": "Screens",
      "baseline": 2
    },
    {
      "id": "battery",
      "label": "Batteries",
      "baseline": 2
    },
    {
      "id": "port",
      "label": "Ports",
      "baseline": 2
    },
    {
      "id": "board",
      "label": "Boards",
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
    "budget": 150,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "screen",
      "label": "Screen stock",
      "categories": [
        "screen"
      ]
    },
    {
      "id": "battery",
      "label": "Battery stock",
      "categories": [
        "battery"
      ]
    },
    {
      "id": "port",
      "label": "Port stock",
      "categories": [
        "port"
      ]
    },
    {
      "id": "board",
      "label": "Board stock",
      "categories": [
        "board"
      ]
    }
  ],
  "sample": [
    {
      "id": "repair_parts_budget-phone-screen",
      "name": "Phone screen",
      "category": "screen",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "new"
    },
    {
      "id": "repair_parts_budget-phone-battery",
      "name": "Phone battery",
      "category": "battery",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "new"
    },
    {
      "id": "repair_parts_budget-usb-c-port",
      "name": "USB-C port",
      "category": "port",
      "tags": [
        "budget"
      ],
      "cost": 10,
      "quantity": 10,
      "condition": "new"
    },
    {
      "id": "repair_parts_budget-charging-board",
      "name": "Charging board",
      "category": "board",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "fair"
    }
  ]
}
