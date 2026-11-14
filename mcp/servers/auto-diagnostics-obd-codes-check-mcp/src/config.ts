import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "auto-diagnostics-obd-codes-check-mcp",
  "title": "OBD-II Codes Audit",
  "description": "Audit OBD-II fault codes by system and severity. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "obd_codes",
  "entity": "fault code",
  "categories": [
    {
      "id": "engine",
      "label": "Engine",
      "baseline": 2
    },
    {
      "id": "transmission",
      "label": "Transmission",
      "baseline": 2
    },
    {
      "id": "abs",
      "label": "ABS",
      "baseline": 2
    },
    {
      "id": "airbag",
      "label": "Airbag",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "dtc_severity",
    "label": "Fault severity",
    "unit": "score",
    "target": 2,
    "direction": "lower"
  },
  "target": {
    "maxItems": 20,
    "budget": 200,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "engine",
      "label": "Engine scan",
      "categories": [
        "engine"
      ]
    },
    {
      "id": "transmission",
      "label": "Transmission scan",
      "categories": [
        "transmission"
      ]
    },
    {
      "id": "abs",
      "label": "ABS scan",
      "categories": [
        "abs"
      ]
    },
    {
      "id": "airbag",
      "label": "Airbag scan",
      "categories": [
        "airbag"
      ]
    }
  ],
  "sample": [
    {
      "id": "obd-engine",
      "name": "P0301 misfire",
      "category": "engine",
      "tags": [
        "critical"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "fair"
    },
    {
      "id": "obd-trans",
      "name": "P0700 transmission",
      "category": "transmission",
      "tags": [
        "warning"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "fair"
    },
    {
      "id": "obd-abs",
      "name": "C0035 ABS sensor",
      "category": "abs",
      "tags": [
        "warning"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "fair"
    },
    {
      "id": "obd-airbag",
      "name": "B0001 airbag",
      "category": "airbag",
      "tags": [
        "critical"
      ],
      "cost": 0,
      "quantity": 1,
      "condition": "worn"
    }
  ]
}
