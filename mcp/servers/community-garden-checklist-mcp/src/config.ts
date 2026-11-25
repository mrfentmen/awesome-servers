import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "community-garden-checklist-mcp",
  "title": "community garden checklist Checklist",
  "description": "Real local JSON analysis of community garden checklist in the Nonprofits & Community lane. 25 MCP tools, no paywall.",
  "prefix": "nonprofit_community_garden_checklist",
  "entity": "community garden checklist item",
  "categories": [
    {
      "id": "nonprofit",
      "label": "nonprofit",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "community-garden",
      "label": "community-garden",
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
        "nonprofit"
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
      "id": "nonprofit_community_garden_checklist-nonprofit-1",
      "name": "nonprofit primary",
      "category": "nonprofit",
      "tags": [
        "nonprofits-community",
        "community",
        "garden"
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
      "id": "nonprofit_community_garden_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "nonprofits-community",
        "community",
        "garden"
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
      "id": "nonprofit_community_garden_checklist-community-garden-3",
      "name": "community-garden primary",
      "category": "community-garden",
      "tags": [
        "nonprofits-community",
        "community",
        "garden"
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
      "id": "nonprofit_community_garden_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "nonprofits-community",
        "community",
        "garden"
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
      "id": "nonprofit_community_garden_checklist-nonprofit-5",
      "name": "nonprofit backup",
      "category": "nonprofit",
      "tags": [
        "nonprofits-community",
        "community",
        "garden"
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
      "id": "nonprofit_community_garden_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "nonprofits-community",
        "community",
        "garden"
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
      "id": "nonprofit_community_garden_checklist-community-garden-7",
      "name": "community-garden backup",
      "category": "community-garden",
      "tags": [
        "nonprofits-community",
        "community",
        "garden"
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
      "id": "nonprofit_community_garden_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "nonprofits-community",
        "community",
        "garden"
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
