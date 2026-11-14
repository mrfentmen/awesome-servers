import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "smart-home-device-compat-check-mcp",
  "title": "Smart Home Compatibility Audit",
  "description": "Audit hubs, lights, sensors and plugs for protocol overlap and compatibility. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "device_compat",
  "entity": "smart-home device",
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
    "id": "active_overlap",
    "label": "Protocol overlap",
    "unit": "duplicate tags",
    "target": 0,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 500,
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
      "id": "smart-hub",
      "name": "Matter hub",
      "category": "hub",
      "tags": [
        "wifi",
        "matter"
      ],
      "cost": 90,
      "quantity": 1,
      "condition": "new"
    },
    {
      "id": "smart-light",
      "name": "Wi-Fi bulb",
      "category": "light",
      "tags": [
        "wifi"
      ],
      "cost": 20,
      "quantity": 3,
      "condition": "good"
    },
    {
      "id": "smart-sensor",
      "name": "Zigbee sensor",
      "category": "sensor",
      "tags": [
        "zigbee"
      ],
      "cost": 15,
      "quantity": 4,
      "condition": "good"
    },
    {
      "id": "smart-plug",
      "name": "Matter plug",
      "category": "plug",
      "tags": [
        "matter"
      ],
      "cost": 25,
      "quantity": 2,
      "condition": "new"
    }
  ]
}
