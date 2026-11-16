import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "auto-diagnostics-ev-battery-plan-mcp",
  "title": "EV Battery Planning Audit",
  "description": "Plan ev battery by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "ev_battery_plan",
  "entity": "battery reading plan",
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
    "id": "state_of_health_pct",
    "label": "State of health",
    "unit": "%",
    "target": 80,
    "direction": "higher"
  },
  "target": {
    "maxItems": 20,
    "budget": 8000,
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
      "id": "ev_battery_plan-pack-a",
      "name": "Pack block A",
      "category": "cells",
      "tags": [
        "module",
        "healthy"
      ],
      "cost": 0,
      "quantity": 92,
      "condition": "good"
    },
    {
      "id": "ev_battery_plan-pack-b",
      "name": "Pack block B",
      "category": "cells",
      "tags": [
        "module",
        "healthy"
      ],
      "cost": 0,
      "quantity": 88,
      "condition": "good"
    },
    {
      "id": "ev_battery_plan-pack-c",
      "name": "Pack block C",
      "category": "cells",
      "tags": [
        "module",
        "weak"
      ],
      "cost": 0,
      "quantity": 74,
      "condition": "fair"
    },
    {
      "id": "ev_battery_plan-dc-fast",
      "name": "DC fast charging",
      "category": "charging",
      "tags": [
        "rapid",
        "weekly"
      ],
      "cost": 60,
      "quantity": 82,
      "condition": "good"
    },
    {
      "id": "ev_battery_plan-home-charge",
      "name": "Home charging",
      "category": "charging",
      "tags": [
        "ac",
        "daily"
      ],
      "cost": 0,
      "quantity": 95,
      "condition": "good"
    },
    {
      "id": "ev_battery_plan-highway",
      "name": "Highway range test",
      "category": "range",
      "tags": [
        "summer",
        "highway"
      ],
      "cost": 60,
      "quantity": 68,
      "condition": "fair"
    },
    {
      "id": "ev_battery_plan-cold",
      "name": "Cold range test",
      "category": "range",
      "tags": [
        "winter",
        "cold"
      ],
      "cost": 60,
      "quantity": 61,
      "condition": "worn"
    },
    {
      "id": "ev_battery_plan-thermal",
      "name": "Thermal event log",
      "category": "thermal",
      "tags": [
        "heat",
        "history"
      ],
      "cost": 120,
      "quantity": 55,
      "condition": "fair"
    }
  ]
}
