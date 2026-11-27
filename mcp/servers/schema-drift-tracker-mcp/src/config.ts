import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "schema-drift-tracker-mcp",
  "title": "schema drift tracker Tracker",
  "description": "Real local JSON analysis of schema drift tracker in the Data & AI Ops lane. 25 MCP tools, no paywall.",
  "prefix": "data_schema_drift_tracker",
  "entity": "schema drift tracker item",
  "categories": [
    {
      "id": "data",
      "label": "data",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "schema-drift",
      "label": "schema-drift",
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
    "label": "Days since activity",
    "unit": "days",
    "target": 7,
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
        "data"
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
      "id": "data_schema_drift_tracker-data-1",
      "name": "data primary",
      "category": "data",
      "tags": [
        "data-ai-ops",
        "schema",
        "drift"
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
      "id": "data_schema_drift_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "data-ai-ops",
        "schema",
        "drift"
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
      "id": "data_schema_drift_tracker-schema-drift-3",
      "name": "schema-drift primary",
      "category": "schema-drift",
      "tags": [
        "data-ai-ops",
        "schema",
        "drift"
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
      "id": "data_schema_drift_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "data-ai-ops",
        "schema",
        "drift"
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
      "id": "data_schema_drift_tracker-data-5",
      "name": "data backup",
      "category": "data",
      "tags": [
        "data-ai-ops",
        "schema",
        "drift"
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
      "id": "data_schema_drift_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "data-ai-ops",
        "schema",
        "drift"
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
      "id": "data_schema_drift_tracker-schema-drift-7",
      "name": "schema-drift backup",
      "category": "schema-drift",
      "tags": [
        "data-ai-ops",
        "schema",
        "drift"
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
      "id": "data_schema_drift_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "data-ai-ops",
        "schema",
        "drift"
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
