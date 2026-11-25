import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "lab-journal-compare-mcp",
  "title": "lab journal compare Compare",
  "description": "Real local JSON analysis of lab journal compare in the Science & Lab lane. 25 MCP tools, no paywall.",
  "prefix": "sci_lab_journal_compare",
  "entity": "lab journal compare item",
  "categories": [
    {
      "id": "sci",
      "label": "sci",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "lab-journal",
      "label": "lab-journal",
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
      "id": "sci_lab_journal_compare-sci-1",
      "name": "sci primary",
      "category": "sci",
      "tags": [
        "science-lab",
        "lab",
        "journal"
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
      "id": "sci_lab_journal_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "science-lab",
        "lab",
        "journal"
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
      "id": "sci_lab_journal_compare-lab-journal-3",
      "name": "lab-journal primary",
      "category": "lab-journal",
      "tags": [
        "science-lab",
        "lab",
        "journal"
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
      "id": "sci_lab_journal_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "science-lab",
        "lab",
        "journal"
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
      "id": "sci_lab_journal_compare-sci-5",
      "name": "sci backup",
      "category": "sci",
      "tags": [
        "science-lab",
        "lab",
        "journal"
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
      "id": "sci_lab_journal_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "science-lab",
        "lab",
        "journal"
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
      "id": "sci_lab_journal_compare-lab-journal-7",
      "name": "lab-journal backup",
      "category": "lab-journal",
      "tags": [
        "science-lab",
        "lab",
        "journal"
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
      "id": "sci_lab_journal_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "science-lab",
        "lab",
        "journal"
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
