import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "electronics-phone-battery-cost-mcp",
  "title": "Phone Battery Health Budget Audit",
  "description": "Audit phone battery health budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "phone_battery_budget",
  "entity": "device budget line",
  "categories": [
    {
      "id": "phone",
      "label": "Phones",
      "baseline": 1
    },
    {
      "id": "tablet",
      "label": "Tablets",
      "baseline": 2
    },
    {
      "id": "laptop",
      "label": "Laptops",
      "baseline": 2
    },
    {
      "id": "accessory",
      "label": "Accessories",
      "baseline": 3
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
    "budget": 3250,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "device",
      "label": "Computing device",
      "categories": [
        "phone",
        "tablet",
        "laptop"
      ]
    },
    {
      "id": "power",
      "label": "Charging accessory",
      "categories": [
        "accessory"
      ]
    }
  ],
  "sample": [
    {
      "id": "phone_battery_budget-main-phone",
      "name": "Main phone",
      "category": "phone",
      "tags": [
        "budget"
      ],
      "cost": 900,
      "quantity": 900,
      "condition": "good"
    },
    {
      "id": "phone_battery_budget-drawing-tablet",
      "name": "Drawing tablet",
      "category": "tablet",
      "tags": [
        "budget"
      ],
      "cost": 500,
      "quantity": 500,
      "condition": "fair"
    },
    {
      "id": "phone_battery_budget-work-laptop",
      "name": "Work laptop",
      "category": "laptop",
      "tags": [
        "budget"
      ],
      "cost": 1200,
      "quantity": 1200,
      "condition": "fair"
    },
    {
      "id": "phone_battery_budget-usb-c-charger",
      "name": "USB-C charger",
      "category": "accessory",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "good"
    },
    {
      "id": "phone_battery_budget-braided-cable",
      "name": "Braided cable",
      "category": "accessory",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "good"
    },
    {
      "id": "phone_battery_budget-power-bank",
      "name": "Power bank",
      "category": "accessory",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "fair"
    }
  ]
}
