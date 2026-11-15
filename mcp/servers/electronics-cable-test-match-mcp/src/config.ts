import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "electronics-cable-test-match-mcp",
  "title": "Cable Test Match Audit",
  "description": "Match cable test by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "cable_test_match",
  "entity": "cable test match",
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
    "id": "continuity_score",
    "label": "Continuity score",
    "unit": "%",
    "target": 90,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 120,
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
      "id": "cable_test_match-usbc",
      "name": "USB-C 100W cable",
      "category": "usb-c",
      "tags": [
        "100w",
        "braided"
      ],
      "cost": 25,
      "quantity": 96,
      "condition": "good"
    },
    {
      "id": "cable_test_match-hdmi",
      "name": "HDMI 2.1 cable",
      "category": "hdmi",
      "tags": [
        "8k",
        "certified"
      ],
      "cost": 18,
      "quantity": 92,
      "condition": "good"
    },
    {
      "id": "cable_test_match-ethernet",
      "name": "Cat 6 patch cable",
      "category": "ethernet",
      "tags": [
        "cat6",
        "snagless"
      ],
      "cost": 12,
      "quantity": 88,
      "condition": "fair"
    },
    {
      "id": "cable_test_match-power",
      "name": "Figure-8 power cable",
      "category": "power",
      "tags": [
        "2m",
        "moulded"
      ],
      "cost": 8,
      "quantity": 95,
      "condition": "good"
    },
    {
      "id": "cable_test_match-adapter",
      "name": "USB-C to HDMI adapter",
      "category": "adapter",
      "tags": [
        "4k",
        "bus-powered"
      ],
      "cost": 30,
      "quantity": 78,
      "condition": "fair"
    },
    {
      "id": "cable_test_match-usba",
      "name": "USB-A legacy cable",
      "category": "usb-a",
      "tags": [
        "charging",
        "old"
      ],
      "cost": 10,
      "quantity": 62,
      "condition": "worn"
    }
  ]
}
