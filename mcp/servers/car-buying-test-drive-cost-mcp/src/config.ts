import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "car-buying-test-drive-cost-mcp",
  "title": "Test Drive Budget Audit",
  "description": "Audit test drive budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "test_drive_budget",
  "entity": "test drive item budget line",
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
    "id": "line_cost",
    "label": "Line cost",
    "unit": "USD",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 100,
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
      "id": "test_drive_budget-blind-spot-check",
      "name": "Blind spot check",
      "category": "visibility",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "test_drive_budget-mirror-adjustment",
      "name": "Mirror adjustment",
      "category": "visibility",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "test_drive_budget-seat-comfort",
      "name": "Seat comfort",
      "category": "seating",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "test_drive_budget-headroom",
      "name": "Headroom",
      "category": "seating",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "test_drive_budget-touchscreen-controls",
      "name": "Touchscreen controls",
      "category": "controls",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "worn"
    },
    {
      "id": "test_drive_budget-climate-controls",
      "name": "Climate controls",
      "category": "controls",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "test_drive_budget-road-noise",
      "name": "Road noise",
      "category": "noise",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "test_drive_budget-cargo-test",
      "name": "Cargo test",
      "category": "cargo",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    }
  ]
}
