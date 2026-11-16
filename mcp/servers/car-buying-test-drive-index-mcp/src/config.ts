import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "car-buying-test-drive-index-mcp",
  "title": "Test Drive Archive",
  "description": "Archive test drive by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "test_drive_index",
  "entity": "test drive item archive",
  "categories": [
    {
      "id": "visibility",
      "label": "Visibility",
      "baseline": 2
    },
    {
      "id": "seating",
      "label": "Seating",
      "baseline": 2
    },
    {
      "id": "controls",
      "label": "Controls",
      "baseline": 2
    },
    {
      "id": "noise",
      "label": "Noise",
      "baseline": 1
    },
    {
      "id": "cargo",
      "label": "Cargo",
      "baseline": 1
    }
  ],
  "metric": {
    "id": "issue_count",
    "label": "Issue count",
    "unit": "issues",
    "target": 1,
    "direction": "lower"
  },
  "target": {
    "maxItems": 16,
    "budget": 50,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "visibility",
      "label": "Visibility check",
      "categories": [
        "visibility"
      ]
    },
    {
      "id": "seating",
      "label": "Seating check",
      "categories": [
        "seating"
      ]
    },
    {
      "id": "controls",
      "label": "Control check",
      "categories": [
        "controls"
      ]
    },
    {
      "id": "practical",
      "label": "Practical checks",
      "categories": [
        "noise",
        "cargo"
      ]
    }
  ],
  "sample": [
    {
      "id": "test_drive_index-blind-spot",
      "name": "Blind spot check",
      "category": "visibility",
      "tags": [
        "mirror",
        "shoulder"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "test_drive_index-mirror",
      "name": "Mirror adjustment",
      "category": "visibility",
      "tags": [
        "power",
        "wide"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "test_drive_index-seat",
      "name": "Seat comfort",
      "category": "seating",
      "tags": [
        "lumbar",
        "long-drive"
      ],
      "cost": 0,
      "quantity": 2,
      "condition": "fair"
    },
    {
      "id": "test_drive_index-headroom",
      "name": "Headroom",
      "category": "seating",
      "tags": [
        "front",
        "rear"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "test_drive_index-touchscreen",
      "name": "Touchscreen controls",
      "category": "controls",
      "tags": [
        "climate",
        "media"
      ],
      "cost": 0,
      "quantity": 3,
      "condition": "worn"
    },
    {
      "id": "test_drive_index-climate",
      "name": "Climate controls",
      "category": "controls",
      "tags": [
        "physical",
        "auto"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    },
    {
      "id": "test_drive_index-road-noise",
      "name": "Road noise",
      "category": "noise",
      "tags": [
        "highway",
        "rough"
      ],
      "cost": 0,
      "quantity": 2,
      "condition": "good"
    },
    {
      "id": "test_drive_index-cargo",
      "name": "Cargo test",
      "category": "cargo",
      "tags": [
        "stroller",
        "weekly"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "good"
    }
  ]
}
