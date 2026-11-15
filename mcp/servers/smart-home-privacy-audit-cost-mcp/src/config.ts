import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "smart-home-privacy-audit-cost-mcp",
  "title": "Smart Home Privacy Budget Audit",
  "description": "Audit smart home privacy budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "privacy_audit_budget",
  "entity": "smart device budget line",
  "categories": [
    {
      "id": "camera",
      "label": "Cameras",
      "baseline": 1
    },
    {
      "id": "speaker",
      "label": "Speakers",
      "baseline": 1
    },
    {
      "id": "sensor",
      "label": "Sensors",
      "baseline": 1
    },
    {
      "id": "hub",
      "label": "Hubs",
      "baseline": 1
    },
    {
      "id": "display",
      "label": "Displays",
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
    "budget": 1050,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "video",
      "label": "Video capture",
      "categories": [
        "camera"
      ]
    },
    {
      "id": "voice",
      "label": "Voice capture",
      "categories": [
        "speaker"
      ]
    },
    {
      "id": "sensing",
      "label": "Sensing",
      "categories": [
        "sensor"
      ]
    },
    {
      "id": "local",
      "label": "Local control",
      "categories": [
        "hub"
      ]
    },
    {
      "id": "screen",
      "label": "Screen services",
      "categories": [
        "display"
      ]
    }
  ],
  "sample": [
    {
      "id": "privacy_audit_budget-indoor-camera",
      "name": "Indoor camera",
      "category": "camera",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "fair"
    },
    {
      "id": "privacy_audit_budget-video-doorbell",
      "name": "Video doorbell",
      "category": "camera",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "fair"
    },
    {
      "id": "privacy_audit_budget-voice-assistant",
      "name": "Voice assistant",
      "category": "speaker",
      "tags": [
        "budget"
      ],
      "cost": 90,
      "quantity": 90,
      "condition": "worn"
    },
    {
      "id": "privacy_audit_budget-motion-sensor",
      "name": "Motion sensor",
      "category": "sensor",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "privacy_audit_budget-local-hub",
      "name": "Local hub",
      "category": "hub",
      "tags": [
        "budget"
      ],
      "cost": 80,
      "quantity": 80,
      "condition": "good"
    },
    {
      "id": "privacy_audit_budget-smart-tv",
      "name": "Smart TV",
      "category": "display",
      "tags": [
        "budget"
      ],
      "cost": 500,
      "quantity": 500,
      "condition": "worn"
    }
  ]
}
