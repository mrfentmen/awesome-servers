import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "septic-pump-checklist-mcp",
  "title": "septic pump checklist Checklist",
  "description": "Real local JSON analysis of septic pump checklist in the Water & Waste lane. 25 MCP tools, no paywall.",
  "prefix": "util_septic_pump_checklist",
  "entity": "septic pump checklist item",
  "categories": [
    {
      "id": "util",
      "label": "util",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "septic-pump",
      "label": "septic-pump",
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
        "util"
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
      "id": "util_septic_pump_checklist-util-1",
      "name": "util primary",
      "category": "util",
      "tags": [
        "water-waste",
        "septic",
        "pump"
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
      "id": "util_septic_pump_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "water-waste",
        "septic",
        "pump"
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
      "id": "util_septic_pump_checklist-septic-pump-3",
      "name": "septic-pump primary",
      "category": "septic-pump",
      "tags": [
        "water-waste",
        "septic",
        "pump"
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
      "id": "util_septic_pump_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "water-waste",
        "septic",
        "pump"
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
      "id": "util_septic_pump_checklist-util-5",
      "name": "util backup",
      "category": "util",
      "tags": [
        "water-waste",
        "septic",
        "pump"
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
      "id": "util_septic_pump_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "water-waste",
        "septic",
        "pump"
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
      "id": "util_septic_pump_checklist-septic-pump-7",
      "name": "septic-pump backup",
      "category": "septic-pump",
      "tags": [
        "water-waste",
        "septic",
        "pump"
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
      "id": "util_septic_pump_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "water-waste",
        "septic",
        "pump"
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
