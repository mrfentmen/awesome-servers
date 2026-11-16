import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "auto-diagnostics-ev-battery-cost-mcp",
  "title": "EV Battery Budget Audit",
  "description": "Audit ev battery budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "ev_battery_budget",
  "entity": "battery reading budget line",
  "categories": [
    {
      "id": "cells",
      "label": "Cells",
      "baseline": 3
    },
    {
      "id": "charging",
      "label": "Charging",
      "baseline": 2
    },
    {
      "id": "range",
      "label": "Range",
      "baseline": 2
    },
    {
      "id": "thermal",
      "label": "Thermal",
      "baseline": 1
    },
    {
      "id": "age",
      "label": "Age checks",
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
    "budget": 400,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "cells",
      "label": "Cell health",
      "categories": [
        "cells"
      ]
    },
    {
      "id": "charging",
      "label": "Charging behaviour",
      "categories": [
        "charging"
      ]
    },
    {
      "id": "range",
      "label": "Usable range",
      "categories": [
        "range"
      ]
    },
    {
      "id": "thermal",
      "label": "Thermal behaviour",
      "categories": [
        "thermal"
      ]
    }
  ],
  "sample": [
    {
      "id": "ev_battery_budget-pack-block-a",
      "name": "Pack block A",
      "category": "cells",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "ev_battery_budget-pack-block-b",
      "name": "Pack block B",
      "category": "cells",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "ev_battery_budget-pack-block-c",
      "name": "Pack block C",
      "category": "cells",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "ev_battery_budget-dc-fast-charging",
      "name": "DC fast charging",
      "category": "charging",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "good"
    },
    {
      "id": "ev_battery_budget-home-charging",
      "name": "Home charging",
      "category": "charging",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "ev_battery_budget-highway-range-test",
      "name": "Highway range test",
      "category": "range",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "fair"
    },
    {
      "id": "ev_battery_budget-cold-range-test",
      "name": "Cold range test",
      "category": "range",
      "tags": [
        "budget"
      ],
      "cost": 60,
      "quantity": 60,
      "condition": "worn"
    },
    {
      "id": "ev_battery_budget-thermal-event-log",
      "name": "Thermal event log",
      "category": "thermal",
      "tags": [
        "budget"
      ],
      "cost": 120,
      "quantity": 120,
      "condition": "fair"
    }
  ]
}
