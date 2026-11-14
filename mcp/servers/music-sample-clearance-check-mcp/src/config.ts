import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "music-sample-clearance-check-mcp",
  "title": "Sample Clearance Audit",
  "description": "Audit music samples for clearance status, denied sources, pending licenses and category coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "sample_clearance",
  "entity": "sample",
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
    "id": "clearance_risk",
    "label": "Clearance risk",
    "unit": "score",
    "target": 2,
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
      "id": "music-drum-break",
      "name": "Vintage drum break",
      "category": "sample",
      "tags": [
        "cleared"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-01-01",
      "condition": "good"
    },
    {
      "id": "music-synth-loop",
      "name": "Synth arpeggio loop",
      "category": "loop",
      "tags": [
        "pending"
      ],
      "cost": 25,
      "quantity": 1,
      "acquired": "2026-04-01",
      "condition": "good"
    },
    {
      "id": "music-vocal-chop",
      "name": "Vocal chop",
      "category": "vocal",
      "tags": [
        "denied"
      ],
      "cost": 0,
      "quantity": 1,
      "acquired": "2026-02-01",
      "condition": "fair"
    },
    {
      "id": "music-riser",
      "name": "Tension riser",
      "category": "fx",
      "tags": [
        "cleared"
      ],
      "cost": 10,
      "quantity": 1,
      "acquired": "2026-03-01",
      "condition": "good"
    },
    {
      "id": "music-bass-loop",
      "name": "Bass loop",
      "category": "loop",
      "tags": [
        "cleared"
      ],
      "cost": 15,
      "quantity": 1,
      "acquired": "2026-05-01",
      "condition": "good"
    },
    {
      "id": "music-impact",
      "name": "Impact hit",
      "category": "fx",
      "tags": [
        "pending"
      ],
      "cost": 8,
      "quantity": 1,
      "acquired": "2026-06-01",
      "condition": "good"
    }
  ]
}
