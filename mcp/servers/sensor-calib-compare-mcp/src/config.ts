import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "sensor-calib-compare-mcp",
  "title": "sensor calib compare Compare",
  "description": "Real local JSON analysis of sensor calib compare in the Web3 & Embedded lane. 25 MCP tools, no paywall.",
  "prefix": "web3_sensor_calib_compare",
  "entity": "sensor calib compare item",
  "categories": [
    {
      "id": "web3",
      "label": "web3",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "sensor-calib",
      "label": "sensor-calib",
      "baseline": 2
    },
    {
      "id": "mcp",
      "label": "mcp",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "service_gap",
    "label": "Days since review",
    "unit": "days",
    "target": 14,
    "direction": "lower"
  },
  "target": {
    "maxItems": 30,
    "budget": 700,
    "coverage": 0.75,
    "expiryDays": 45
  },
  "dependencies": [
    {
      "id": "core",
      "label": "Core records",
      "categories": [
        "web3"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "mcp"
      ]
    }
  ],
  "sample": [
    {
      "id": "web3_sensor_calib_compare-web3-1",
      "name": "web3 primary",
      "category": "web3",
      "tags": [
        "web3-embedded",
        "sensor",
        "calib"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-15",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "web3_sensor_calib_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "web3-embedded",
        "sensor",
        "calib"
      ],
      "cost": 35,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2026-12-29",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "web3_sensor_calib_compare-sensor-calib-3",
      "name": "sensor-calib primary",
      "category": "sensor-calib",
      "tags": [
        "web3-embedded",
        "sensor",
        "calib"
      ],
      "cost": 50,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-12",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "web3_sensor_calib_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "web3-embedded",
        "sensor",
        "calib"
      ],
      "cost": 65,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-01-26",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "web3_sensor_calib_compare-web3-5",
      "name": "web3 backup",
      "category": "web3",
      "tags": [
        "web3-embedded",
        "sensor",
        "calib"
      ],
      "cost": 80,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-09",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "web3_sensor_calib_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "web3-embedded",
        "sensor",
        "calib"
      ],
      "cost": 95,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-02-23",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "web3_sensor_calib_compare-sensor-calib-7",
      "name": "sensor-calib backup",
      "category": "sensor-calib",
      "tags": [
        "web3-embedded",
        "sensor",
        "calib"
      ],
      "cost": 110,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-09",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "web3_sensor_calib_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "web3-embedded",
        "sensor",
        "calib"
      ],
      "cost": 125,
      "quantity": 4,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-03-23",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
