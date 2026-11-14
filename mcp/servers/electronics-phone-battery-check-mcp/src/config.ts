import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "electronics-phone-battery-check-mcp",
  "title": "Phone Battery Health Audit",
  "description": "Audit phone, tablet and laptop battery health, replacement risk and accessory coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "phone_battery",
  "entity": "device",
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
    "id": "battery_health",
    "label": "Battery health",
    "unit": "%",
    "target": 80,
    "direction": "higher"
  },
  "target": {
    "maxItems": 12,
    "budget": 2000,
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
      "id": "device-phone",
      "name": "Main phone",
      "category": "phone",
      "tags": [
        "daily"
      ],
      "cost": 900,
      "quantity": 92,
      "acquired": "2024-09-01",
      "condition": "good"
    },
    {
      "id": "device-tablet",
      "name": "Drawing tablet",
      "category": "tablet",
      "tags": [
        "creative"
      ],
      "cost": 500,
      "quantity": 78,
      "acquired": "2024-03-01",
      "condition": "fair"
    },
    {
      "id": "device-laptop",
      "name": "Work laptop",
      "category": "laptop",
      "tags": [
        "work"
      ],
      "cost": 1200,
      "quantity": 65,
      "acquired": "2023-06-01",
      "condition": "fair"
    },
    {
      "id": "device-charger",
      "name": "USB-C charger",
      "category": "accessory",
      "tags": [
        "power"
      ],
      "cost": 30,
      "quantity": 100,
      "acquired": "2025-01-01",
      "condition": "good"
    },
    {
      "id": "device-cable",
      "name": "Braided cable",
      "category": "accessory",
      "tags": [
        "power"
      ],
      "cost": 15,
      "quantity": 88,
      "acquired": "2025-06-01",
      "condition": "good"
    },
    {
      "id": "device-powerbank",
      "name": "Power bank",
      "category": "accessory",
      "tags": [
        "travel"
      ],
      "cost": 60,
      "quantity": 70,
      "acquired": "2024-11-01",
      "condition": "fair"
    }
  ]
}
