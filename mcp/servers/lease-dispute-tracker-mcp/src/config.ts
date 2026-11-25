import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "lease-dispute-tracker-mcp",
  "title": "lease dispute tracker Tracker",
  "description": "Real local JSON analysis of lease dispute tracker in the Law & Paperwork lane. 25 MCP tools, no paywall.",
  "prefix": "law_lease_dispute_tracker",
  "entity": "lease dispute tracker item",
  "categories": [
    {
      "id": "law",
      "label": "law",
      "baseline": 2
    },
    {
      "id": "tracker",
      "label": "tracker",
      "baseline": 2
    },
    {
      "id": "lease-dispute",
      "label": "lease-dispute",
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
        "law"
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
      "id": "law_lease_dispute_tracker-law-1",
      "name": "law primary",
      "category": "law",
      "tags": [
        "law-paperwork",
        "lease",
        "dispute"
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
      "id": "law_lease_dispute_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "law-paperwork",
        "lease",
        "dispute"
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
      "id": "law_lease_dispute_tracker-lease-dispute-3",
      "name": "lease-dispute primary",
      "category": "lease-dispute",
      "tags": [
        "law-paperwork",
        "lease",
        "dispute"
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
      "id": "law_lease_dispute_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "law-paperwork",
        "lease",
        "dispute"
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
      "id": "law_lease_dispute_tracker-law-5",
      "name": "law backup",
      "category": "law",
      "tags": [
        "law-paperwork",
        "lease",
        "dispute"
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
      "id": "law_lease_dispute_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "law-paperwork",
        "lease",
        "dispute"
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
      "id": "law_lease_dispute_tracker-lease-dispute-7",
      "name": "lease-dispute backup",
      "category": "lease-dispute",
      "tags": [
        "law-paperwork",
        "lease",
        "dispute"
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
      "id": "law_lease_dispute_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "law-paperwork",
        "lease",
        "dispute"
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
