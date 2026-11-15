import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "electronics-cable-test-cost-mcp",
  "title": "Cable Test Budget Audit",
  "description": "Audit cable test budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "cable_test_budget",
  "entity": "cable test budget line",
  "categories": [
    {
      "id": "usb-c",
      "label": "USB-C",
      "baseline": 1
    },
    {
      "id": "hdmi",
      "label": "HDMI",
      "baseline": 1
    },
    {
      "id": "ethernet",
      "label": "Ethernet",
      "baseline": 1
    },
    {
      "id": "power",
      "label": "Power",
      "baseline": 1
    },
    {
      "id": "adapter",
      "label": "Adapters",
      "baseline": 1
    },
    {
      "id": "usb-a",
      "label": "USB-A",
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
    "budget": 150,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "data",
      "label": "Data link",
      "categories": [
        "usb-c",
        "hdmi",
        "ethernet"
      ]
    },
    {
      "id": "power",
      "label": "Power link",
      "categories": [
        "power"
      ]
    },
    {
      "id": "conversion",
      "label": "Signal conversion",
      "categories": [
        "adapter"
      ]
    },
    {
      "id": "legacy",
      "label": "Legacy link",
      "categories": [
        "usb-a"
      ]
    }
  ],
  "sample": [
    {
      "id": "cable_test_budget-usb-c-100w-cable",
      "name": "USB-C 100W cable",
      "category": "usb-c",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "cable_test_budget-hdmi-2-1-cable",
      "name": "HDMI 2.1 cable",
      "category": "hdmi",
      "tags": [
        "budget"
      ],
      "cost": 18,
      "quantity": 18,
      "condition": "good"
    },
    {
      "id": "cable_test_budget-cat-6-patch-cable",
      "name": "Cat 6 patch cable",
      "category": "ethernet",
      "tags": [
        "budget"
      ],
      "cost": 12,
      "quantity": 12,
      "condition": "fair"
    },
    {
      "id": "cable_test_budget-figure-8-power-cable",
      "name": "Figure-8 power cable",
      "category": "power",
      "tags": [
        "budget"
      ],
      "cost": 8,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "cable_test_budget-usb-c-to-hdmi-adapter",
      "name": "USB-C to HDMI adapter",
      "category": "adapter",
      "tags": [
        "budget"
      ],
      "cost": 30,
      "quantity": 30,
      "condition": "fair"
    },
    {
      "id": "cable_test_budget-usb-a-legacy-cable",
      "name": "USB-A legacy cable",
      "category": "usb-a",
      "tags": [
        "budget"
      ],
      "cost": 10,
      "quantity": 10,
      "condition": "worn"
    }
  ]
}
