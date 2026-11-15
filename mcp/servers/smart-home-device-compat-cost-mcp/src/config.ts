import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "smart-home-device-compat-cost-mcp",
  "title": "Smart Home Compatibility Budget Audit",
  "description": "Audit smart home compatibility budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "device_compat_budget",
  "entity": "smart-home device budget line",
  "categories": [
    {
      "id": "hub",
      "label": "Hubs",
      "baseline": 1
    },
    {
      "id": "light",
      "label": "Lights",
      "baseline": 3
    },
    {
      "id": "sensor",
      "label": "Sensors",
      "baseline": 3
    },
    {
      "id": "plug",
      "label": "Plugs",
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
    "budget": 200,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "hub",
      "label": "Hub",
      "categories": [
        "hub"
      ]
    },
    {
      "id": "light",
      "label": "Lighting",
      "categories": [
        "light"
      ]
    },
    {
      "id": "sensor",
      "label": "Sensors",
      "categories": [
        "sensor"
      ]
    },
    {
      "id": "plug",
      "label": "Plugs",
      "categories": [
        "plug"
      ]
    }
  ],
  "sample": [
    {
      "id": "device_compat_budget-matter-hub",
      "name": "Matter hub",
      "category": "hub",
      "tags": [
        "budget"
      ],
      "cost": 90,
      "quantity": 90,
      "condition": "new"
    },
    {
      "id": "device_compat_budget-wi-fi-bulb",
      "name": "Wi-Fi bulb",
      "category": "light",
      "tags": [
        "budget"
      ],
      "cost": 20,
      "quantity": 20,
      "condition": "good"
    },
    {
      "id": "device_compat_budget-zigbee-sensor",
      "name": "Zigbee sensor",
      "category": "sensor",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "good"
    },
    {
      "id": "device_compat_budget-matter-plug",
      "name": "Matter plug",
      "category": "plug",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "new"
    }
  ]
}
