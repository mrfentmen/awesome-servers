import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "citation-list-guide-mcp",
  "title": "citation list guide Guide",
  "description": "Real local JSON analysis of citation list guide in the Science & Lab lane. 25 MCP tools, no paywall.",
  "prefix": "sci_citation_list_guide",
  "entity": "citation list guide item",
  "categories": [
    {
      "id": "sci",
      "label": "sci",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "citation-list",
      "label": "citation-list",
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
      "id": "sci_citation_list_guide-sci-1",
      "name": "sci primary",
      "category": "sci",
      "tags": [
        "science-lab",
        "citation",
        "list"
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
      "id": "sci_citation_list_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "science-lab",
        "citation",
        "list"
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
      "id": "sci_citation_list_guide-citation-list-3",
      "name": "citation-list primary",
      "category": "citation-list",
      "tags": [
        "science-lab",
        "citation",
        "list"
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
      "id": "sci_citation_list_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "science-lab",
        "citation",
        "list"
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
      "id": "sci_citation_list_guide-sci-5",
      "name": "sci backup",
      "category": "sci",
      "tags": [
        "science-lab",
        "citation",
        "list"
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
      "id": "sci_citation_list_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "science-lab",
        "citation",
        "list"
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
      "id": "sci_citation_list_guide-citation-list-7",
      "name": "citation-list backup",
      "category": "citation-list",
      "tags": [
        "science-lab",
        "citation",
        "list"
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
      "id": "sci_citation_list_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "science-lab",
        "citation",
        "list"
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
