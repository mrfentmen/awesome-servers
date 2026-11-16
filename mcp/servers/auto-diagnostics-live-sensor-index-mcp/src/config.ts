import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "auto-diagnostics-live-sensor-index-mcp",
  "title": "Live Sensor Archive",
  "description": "Archive live sensor by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "live_sensor_index",
  "entity": "live sensor archive",
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
    "id": "sensor_lag_ms",
    "label": "Sensor lag",
    "unit": "ms",
    "target": 200,
    "direction": "lower"
  },
  "target": {
    "maxItems": 18,
    "budget": 400,
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
      "id": "live_sensor_index-rpm",
      "name": "Engine RPM",
      "category": "engine",
      "tags": [
        "pid-0c",
        "fast"
      ],
      "cost": 0,
      "quantity": 80,
      "condition": "good"
    },
    {
      "id": "live_sensor_index-coolant",
      "name": "Coolant temperature",
      "category": "engine",
      "tags": [
        "pid-05",
        "slow"
      ],
      "cost": 0,
      "quantity": 420,
      "condition": "fair"
    },
    {
      "id": "live_sensor_index-throttle",
      "name": "Throttle position",
      "category": "engine",
      "tags": [
        "pid-11",
        "fast"
      ],
      "cost": 0,
      "quantity": 90,
      "condition": "good"
    },
    {
      "id": "live_sensor_index-shift",
      "name": "Commanded gear",
      "category": "transmission",
      "tags": [
        "pid-a4",
        "medium"
      ],
      "cost": 0,
      "quantity": 180,
      "condition": "good"
    },
    {
      "id": "live_sensor_index-slip",
      "name": "Torque converter slip",
      "category": "transmission",
      "tags": [
        "calculated",
        "medium"
      ],
      "cost": 0,
      "quantity": 240,
      "condition": "fair"
    },
    {
      "id": "live_sensor_index-o2",
      "name": "Oxygen sensor",
      "category": "emissions",
      "tags": [
        "pid-14",
        "waveform"
      ],
      "cost": 0,
      "quantity": 160,
      "condition": "good"
    },
    {
      "id": "live_sensor_index-cat",
      "name": "Catalyst temperature",
      "category": "emissions",
      "tags": [
        "pid-3c",
        "slow"
      ],
      "cost": 0,
      "quantity": 510,
      "condition": "worn"
    },
    {
      "id": "live_sensor_index-voltage",
      "name": "Control module voltage",
      "category": "electrical",
      "tags": [
        "pid-42",
        "fast"
      ],
      "cost": 0,
      "quantity": 120,
      "condition": "good"
    },
    {
      "id": "live_sensor_index-load",
      "name": "Calculated engine load",
      "category": "electrical",
      "tags": [
        "pid-04",
        "medium"
      ],
      "cost": 0,
      "quantity": 210,
      "condition": "good"
    },
    {
      "id": "live_sensor_index-fuel-trim",
      "name": "Short fuel trim",
      "category": "fuel",
      "tags": [
        "pid-06",
        "fast"
      ],
      "cost": 0,
      "quantity": 150,
      "condition": "good"
    },
    {
      "id": "live_sensor_index-fuel-level",
      "name": "Fuel level",
      "category": "fuel",
      "tags": [
        "pid-2f",
        "slow"
      ],
      "cost": 0,
      "quantity": 600,
      "condition": "fair"
    }
  ]
}
