import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "auto-diagnostics-live-sensor-cost-mcp",
  "title": "Live Sensor Budget Audit",
  "description": "Audit live sensor budget lines by category, cost and coverage. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "live_sensor_budget",
  "entity": "live sensor budget line",
  "categories": [
    {
      "id": "engine",
      "label": "Engine",
      "baseline": 3
    },
    {
      "id": "transmission",
      "label": "Transmission",
      "baseline": 2
    },
    {
      "id": "emissions",
      "label": "Emissions",
      "baseline": 2
    },
    {
      "id": "electrical",
      "label": "Electrical",
      "baseline": 2
    },
    {
      "id": "fuel",
      "label": "Fuel",
      "baseline": 2
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
      "id": "powertrain",
      "label": "Powertrain data",
      "categories": [
        "engine",
        "transmission"
      ]
    },
    {
      "id": "emissions",
      "label": "Emissions data",
      "categories": [
        "emissions"
      ]
    },
    {
      "id": "electrical",
      "label": "Electrical data",
      "categories": [
        "electrical"
      ]
    },
    {
      "id": "fuel",
      "label": "Fuel data",
      "categories": [
        "fuel"
      ]
    }
  ],
  "sample": [
    {
      "id": "live_sensor_budget-engine-rpm",
      "name": "Engine RPM",
      "category": "engine",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "live_sensor_budget-coolant-temperature",
      "name": "Coolant temperature",
      "category": "engine",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "live_sensor_budget-throttle-position",
      "name": "Throttle position",
      "category": "engine",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "live_sensor_budget-commanded-gear",
      "name": "Commanded gear",
      "category": "transmission",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "live_sensor_budget-torque-converter-slip",
      "name": "Torque converter slip",
      "category": "transmission",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    },
    {
      "id": "live_sensor_budget-oxygen-sensor",
      "name": "Oxygen sensor",
      "category": "emissions",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "live_sensor_budget-catalyst-temperature",
      "name": "Catalyst temperature",
      "category": "emissions",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "worn"
    },
    {
      "id": "live_sensor_budget-control-module-voltage",
      "name": "Control module voltage",
      "category": "electrical",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "live_sensor_budget-calculated-engine-load",
      "name": "Calculated engine load",
      "category": "electrical",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "live_sensor_budget-short-fuel-trim",
      "name": "Short fuel trim",
      "category": "fuel",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "good"
    },
    {
      "id": "live_sensor_budget-fuel-level",
      "name": "Fuel level",
      "category": "fuel",
      "tags": [
        "budget"
      ],
      "cost": 0,
      "quantity": 0,
      "condition": "fair"
    }
  ]
}
