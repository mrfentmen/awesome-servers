import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "music-sample-clearance-cost-mcp",
  "title": "Sample Clearance Budget Audit",
  "description": "Audit sample clearance budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "sample_clearance_budget",
  "entity": "sample budget line",
  "categories": [
    {
      "id": "sample",
      "label": "Samples",
      "baseline": 4
    },
    {
      "id": "loop",
      "label": "Loops",
      "baseline": 3
    },
    {
      "id": "vocal",
      "label": "Vocals",
      "baseline": 2
    },
    {
      "id": "fx",
      "label": "Sound effects",
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
    "budget": 100,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "source",
      "label": "Musical source",
      "categories": [
        "sample",
        "loop",
        "vocal"
      ]
    },
    {
      "id": "fx",
      "label": "Sound design",
      "categories": [
        "fx"
      ]
    }
  ],
  "sample": [
    {
      "id": "sample_clearance_budget-vintage-drum-break",
      "name": "Vintage drum break",
      "category": "sample",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "sample_clearance_budget-synth-arpeggio-loop",
      "name": "Synth arpeggio loop",
      "category": "loop",
      "tags": [
        "budget"
      ],
      "cost": 25,
      "quantity": 25,
      "condition": "good"
    },
    {
      "id": "sample_clearance_budget-vocal-chop",
      "name": "Vocal chop",
      "category": "vocal",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "sample_clearance_budget-tension-riser",
      "name": "Tension riser",
      "category": "fx",
      "tags": [
        "budget"
      ],
      "cost": 10,
      "quantity": 10,
      "condition": "good"
    },
    {
      "id": "sample_clearance_budget-bass-loop",
      "name": "Bass loop",
      "category": "loop",
      "tags": [
        "budget"
      ],
      "cost": 15,
      "quantity": 15,
      "condition": "good"
    },
    {
      "id": "sample_clearance_budget-impact-hit",
      "name": "Impact hit",
      "category": "fx",
      "tags": [
        "budget"
      ],
      "cost": 8,
      "quantity": 8,
      "condition": "good"
    }
  ]
}
