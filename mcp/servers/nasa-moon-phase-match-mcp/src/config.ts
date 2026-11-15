import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "nasa-moon-phase-match-mcp",
  "title": "Moon Phase Match Audit",
  "description": "Match moon phase by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "moon_phase_match",
  "entity": "moon observation match",
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
      "id": "moon_phase_match-waxing-moon",
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
      "id": "moon_phase_match-moonrise",
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
      "id": "moon_phase_match-cloud-cover",
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
      "id": "moon_phase_match-viewing-spot",
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
