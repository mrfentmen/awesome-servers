import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "nasa-satellite-pass-sim-mcp",
  "title": "Satellite Pass Simulator",
  "description": "Simulate satellite pass by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "satellite_pass_sim",
  "entity": "satellite pass simulation",
  "categories": [
    {
      "id": "time",
      "label": "Time",
      "baseline": 2
    },
    {
      "id": "elevation",
      "label": "Elevation",
      "baseline": 1
    },
    {
      "id": "visibility",
      "label": "Visibility",
      "baseline": 1
    },
    {
      "id": "radio",
      "label": "Radio",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "elevation_deg",
    "label": "Elevation",
    "unit": "deg",
    "target": 30,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 300,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "time",
      "label": "Time",
      "categories": [
        "time"
      ]
    },
    {
      "id": "elevation",
      "label": "Elevation",
      "categories": [
        "elevation"
      ]
    },
    {
      "id": "visibility",
      "label": "Visibility",
      "categories": [
        "visibility"
      ]
    },
    {
      "id": "radio",
      "label": "Radio",
      "categories": [
        "radio"
      ]
    }
  ],
  "sample": [
    {
      "id": "satellite_pass_sim-pass-time",
      "name": "Pass time",
      "category": "time",
      "tags": [
        "time"
      ],
      "cost": 0,
      "quantity": 19,
      "condition": "good"
    },
    {
      "id": "satellite_pass_sim-max-elevation",
      "name": "Max elevation",
      "category": "elevation",
      "tags": [
        "elevation"
      ],
      "cost": 0,
      "quantity": 45,
      "condition": "good"
    },
    {
      "id": "satellite_pass_sim-visibility-window",
      "name": "Visibility window",
      "category": "visibility",
      "tags": [
        "visibility"
      ],
      "cost": 0,
      "quantity": 8,
      "condition": "good"
    },
    {
      "id": "satellite_pass_sim-radio-setup",
      "name": "Radio setup",
      "category": "radio",
      "tags": [
        "radio"
      ],
      "cost": 120,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
