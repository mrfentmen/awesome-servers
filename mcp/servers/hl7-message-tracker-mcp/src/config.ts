import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "hl7-message-tracker-mcp",
  "title": "hl7 message tracker Tracker",
  "description": "Real local JSON analysis of hl7 message tracker in the Health & Care Work lane. 25 MCP tools, no paywall.",
  "prefix": "care_hl7_message_tracker",
  "entity": "hl7 message tracker item",
  "categories": [
    {
      "id": "care",
      "label": "care",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "hl7-message",
      "label": "hl7-message",
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
        "care"
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
      "id": "care_hl7_message_tracker-care-1",
      "name": "care primary",
      "category": "care",
      "tags": [
        "health-care-work",
        "hl7",
        "message"
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
      "id": "care_hl7_message_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "health-care-work",
        "hl7",
        "message"
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
      "id": "care_hl7_message_tracker-hl7-message-3",
      "name": "hl7-message primary",
      "category": "hl7-message",
      "tags": [
        "health-care-work",
        "hl7",
        "message"
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
      "id": "care_hl7_message_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "health-care-work",
        "hl7",
        "message"
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
      "id": "care_hl7_message_tracker-care-5",
      "name": "care backup",
      "category": "care",
      "tags": [
        "health-care-work",
        "hl7",
        "message"
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
      "id": "care_hl7_message_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "health-care-work",
        "hl7",
        "message"
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
      "id": "care_hl7_message_tracker-hl7-message-7",
      "name": "hl7-message backup",
      "category": "hl7-message",
      "tags": [
        "health-care-work",
        "hl7",
        "message"
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
      "id": "care_hl7_message_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "health-care-work",
        "hl7",
        "message"
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
