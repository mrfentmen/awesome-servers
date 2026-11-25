import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "traffic-ticket-guide-mcp",
  "title": "traffic ticket guide Guide",
  "description": "Real local JSON analysis of traffic ticket guide in the Law & Paperwork lane. 25 MCP tools, no paywall.",
  "prefix": "law_traffic_ticket_guide",
  "entity": "traffic ticket guide item",
  "categories": [
    {
      "id": "law",
      "label": "law",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "traffic-ticket",
      "label": "traffic-ticket",
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
      "id": "law_traffic_ticket_guide-law-1",
      "name": "law primary",
      "category": "law",
      "tags": [
        "law-paperwork",
        "traffic",
        "ticket"
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
      "id": "law_traffic_ticket_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "law-paperwork",
        "traffic",
        "ticket"
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
      "id": "law_traffic_ticket_guide-traffic-ticket-3",
      "name": "traffic-ticket primary",
      "category": "traffic-ticket",
      "tags": [
        "law-paperwork",
        "traffic",
        "ticket"
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
      "id": "law_traffic_ticket_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "law-paperwork",
        "traffic",
        "ticket"
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
      "id": "law_traffic_ticket_guide-law-5",
      "name": "law backup",
      "category": "law",
      "tags": [
        "law-paperwork",
        "traffic",
        "ticket"
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
      "id": "law_traffic_ticket_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "law-paperwork",
        "traffic",
        "ticket"
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
      "id": "law_traffic_ticket_guide-traffic-ticket-7",
      "name": "traffic-ticket backup",
      "category": "traffic-ticket",
      "tags": [
        "law-paperwork",
        "traffic",
        "ticket"
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
      "id": "law_traffic_ticket_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "law-paperwork",
        "traffic",
        "ticket"
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
