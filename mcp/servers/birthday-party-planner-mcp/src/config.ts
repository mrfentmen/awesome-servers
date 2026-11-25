import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "birthday-party-planner-mcp",
  "title": "birthday party planner Planner",
  "description": "Real local JSON analysis of birthday party planner in the Events & Celebrations lane. 25 MCP tools, no paywall.",
  "prefix": "events_birthday_party_planner",
  "entity": "birthday party planner item",
  "categories": [
    {
      "id": "events",
      "label": "events",
      "baseline": 2
    },
    {
      "id": "planner",
      "label": "planner",
      "baseline": 2
    },
    {
      "id": "birthday-party",
      "label": "birthday-party",
      "baseline": 2
    },
    {
      "id": "mcp",
      "label": "mcp",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "days_to_expiry",
    "label": "Days to deadline",
    "unit": "days",
    "target": 30,
    "direction": "higher"
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
        "events"
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
      "id": "events_birthday_party_planner-events-1",
      "name": "events primary",
      "category": "events",
      "tags": [
        "events-celebrations",
        "birthday",
        "party"
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
      "id": "events_birthday_party_planner-planner-2",
      "name": "planner primary",
      "category": "planner",
      "tags": [
        "events-celebrations",
        "birthday",
        "party"
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
      "id": "events_birthday_party_planner-birthday-party-3",
      "name": "birthday-party primary",
      "category": "birthday-party",
      "tags": [
        "events-celebrations",
        "birthday",
        "party"
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
      "id": "events_birthday_party_planner-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "events-celebrations",
        "birthday",
        "party"
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
      "id": "events_birthday_party_planner-events-5",
      "name": "events backup",
      "category": "events",
      "tags": [
        "events-celebrations",
        "birthday",
        "party"
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
      "id": "events_birthday_party_planner-planner-6",
      "name": "planner backup",
      "category": "planner",
      "tags": [
        "events-celebrations",
        "birthday",
        "party"
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
      "id": "events_birthday_party_planner-birthday-party-7",
      "name": "birthday-party backup",
      "category": "birthday-party",
      "tags": [
        "events-celebrations",
        "birthday",
        "party"
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
      "id": "events_birthday_party_planner-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "events-celebrations",
        "birthday",
        "party"
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
