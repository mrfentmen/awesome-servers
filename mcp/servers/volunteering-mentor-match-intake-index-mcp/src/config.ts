import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "volunteering-mentor-match-intake-index-mcp",
  "title": "Mentor Match Intake Archive",
  "description": "Real local JSON analysis of mentor match intake in the Volunteering lane. 25 MCP tools, no paywall.",
  "prefix": "volunteering_volunteering_mentor_match_intake_index",
  "entity": "mentor match intake item",
  "categories": [
    {
      "id": "records",
      "label": "Records",
      "baseline": 2
    },
    {
      "id": "tags",
      "label": "Tags",
      "baseline": 2
    },
    {
      "id": "history",
      "label": "History",
      "baseline": 2
    },
    {
      "id": "exports",
      "label": "Exports",
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
        "records"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "exports"
      ]
    }
  ],
  "sample": [
    {
      "id": "volunteering_volunteering_mentor_match_intake_index-records-1",
      "name": "Records primary",
      "category": "records",
      "tags": [
        "volunteering",
        "volunteering",
        "mentor"
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
      "id": "volunteering_volunteering_mentor_match_intake_index-tags-2",
      "name": "Tags primary",
      "category": "tags",
      "tags": [
        "volunteering",
        "volunteering",
        "mentor"
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
      "id": "volunteering_volunteering_mentor_match_intake_index-history-3",
      "name": "History primary",
      "category": "history",
      "tags": [
        "volunteering",
        "volunteering",
        "mentor"
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
      "id": "volunteering_volunteering_mentor_match_intake_index-exports-4",
      "name": "Exports primary",
      "category": "exports",
      "tags": [
        "volunteering",
        "volunteering",
        "mentor"
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
      "id": "volunteering_volunteering_mentor_match_intake_index-records-5",
      "name": "Records backup",
      "category": "records",
      "tags": [
        "volunteering",
        "volunteering",
        "mentor"
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
      "id": "volunteering_volunteering_mentor_match_intake_index-tags-6",
      "name": "Tags backup",
      "category": "tags",
      "tags": [
        "volunteering",
        "volunteering",
        "mentor"
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
      "id": "volunteering_volunteering_mentor_match_intake_index-history-7",
      "name": "History backup",
      "category": "history",
      "tags": [
        "volunteering",
        "volunteering",
        "mentor"
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
      "id": "volunteering_volunteering_mentor_match_intake_index-exports-8",
      "name": "Exports backup",
      "category": "exports",
      "tags": [
        "volunteering",
        "volunteering",
        "mentor"
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
