import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "rock-identify-tracker-mcp",
  "title": "rock identify tracker Tracker",
  "description": "Real local JSON analysis of rock identify tracker in the Science & Lab lane. 25 MCP tools, no paywall.",
  "prefix": "sci_rock_identify_tracker",
  "entity": "rock identify tracker item",
  "categories": [
    {
      "id": "sci",
      "label": "sci",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "rock-identify",
      "label": "rock-identify",
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
        "sci"
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
      "id": "sci_rock_identify_tracker-sci-1",
      "name": "sci primary",
      "category": "sci",
      "tags": [
        "science-lab",
        "rock",
        "identify"
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
      "id": "sci_rock_identify_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "science-lab",
        "rock",
        "identify"
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
      "id": "sci_rock_identify_tracker-rock-identify-3",
      "name": "rock-identify primary",
      "category": "rock-identify",
      "tags": [
        "science-lab",
        "rock",
        "identify"
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
      "id": "sci_rock_identify_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "science-lab",
        "rock",
        "identify"
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
      "id": "sci_rock_identify_tracker-sci-5",
      "name": "sci backup",
      "category": "sci",
      "tags": [
        "science-lab",
        "rock",
        "identify"
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
      "id": "sci_rock_identify_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "science-lab",
        "rock",
        "identify"
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
      "id": "sci_rock_identify_tracker-rock-identify-7",
      "name": "rock-identify backup",
      "category": "rock-identify",
      "tags": [
        "science-lab",
        "rock",
        "identify"
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
      "id": "sci_rock_identify_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "science-lab",
        "rock",
        "identify"
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
