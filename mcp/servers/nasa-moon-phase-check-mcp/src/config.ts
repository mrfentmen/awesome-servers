import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "nasa-moon-phase-check-mcp",
  "title": "Moon Phase Audit",
  "description": "Audit moon phase, rise time, cloud cover and viewing location for a night observation. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "moon_phase",
  "entity": "moon observation",
  "categories": [
    {
      "id": "phase",
      "label": "Phase",
      "baseline": 2
    },
    {
      "id": "rise",
      "label": "Rise",
      "baseline": 1
    },
    {
      "id": "cloud",
      "label": "Cloud",
      "baseline": 1
    },
    {
      "id": "location",
      "label": "Location",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "illumination_pct",
    "label": "Illumination",
    "unit": "%",
    "target": 50,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 200,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "phase",
      "label": "Phase",
      "categories": [
        "phase"
      ]
    },
    {
      "id": "rise",
      "label": "Rise",
      "categories": [
        "rise"
      ]
    },
    {
      "id": "cloud",
      "label": "Cloud",
      "categories": [
        "cloud"
      ]
    },
    {
      "id": "location",
      "label": "Location",
      "categories": [
        "location"
      ]
    }
  ],
  "sample": [
    {
      "id": "moon_phase-waxing-moon",
      "name": "Waxing moon",
      "category": "phase",
      "tags": [
        "phase"
      ],
      "cost": 0,
      "quantity": 62,
      "condition": "good"
    },
    {
      "id": "moon_phase-moonrise",
      "name": "Moonrise",
      "category": "rise",
      "tags": [
        "rise"
      ],
      "cost": 0,
      "quantity": 19,
      "condition": "good"
    },
    {
      "id": "moon_phase-cloud-cover",
      "name": "Cloud cover",
      "category": "cloud",
      "tags": [
        "cloud"
      ],
      "cost": 0,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "moon_phase-viewing-spot",
      "name": "Viewing spot",
      "category": "location",
      "tags": [
        "location"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
