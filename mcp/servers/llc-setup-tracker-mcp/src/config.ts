import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "llc-setup-tracker-mcp",
  "title": "llc setup tracker Tracker",
  "description": "Real local JSON analysis of llc setup tracker in the Law & Paperwork lane. 25 MCP tools, no paywall.",
  "prefix": "law_llc_setup_tracker",
  "entity": "llc setup tracker item",
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
      "id": "llc-setup",
      "label": "llc-setup",
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
      "id": "law_llc_setup_tracker-law-1",
      "name": "law primary",
      "category": "law",
      "tags": [
        "law-paperwork",
        "llc",
        "setup"
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
      "id": "law_llc_setup_tracker-tracker-2",
      "name": "tracker primary",
      "category": "tracker",
      "tags": [
        "law-paperwork",
        "llc",
        "setup"
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
      "id": "law_llc_setup_tracker-llc-setup-3",
      "name": "llc-setup primary",
      "category": "llc-setup",
      "tags": [
        "law-paperwork",
        "llc",
        "setup"
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
      "id": "law_llc_setup_tracker-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "law-paperwork",
        "llc",
        "setup"
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
      "id": "law_llc_setup_tracker-law-5",
      "name": "law backup",
      "category": "law",
      "tags": [
        "law-paperwork",
        "llc",
        "setup"
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
      "id": "law_llc_setup_tracker-tracker-6",
      "name": "tracker backup",
      "category": "tracker",
      "tags": [
        "law-paperwork",
        "llc",
        "setup"
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
      "id": "law_llc_setup_tracker-llc-setup-7",
      "name": "llc-setup backup",
      "category": "llc-setup",
      "tags": [
        "law-paperwork",
        "llc",
        "setup"
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
      "id": "law_llc_setup_tracker-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "law-paperwork",
        "llc",
        "setup"
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
