import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "hp-printer-ink-mcp",
  "title": "Hp Printer Ink Tracker",
  "description": "Real local JSON analysis of hp printer ink in the Hp Printer lane. 25 MCP tools, no paywall.",
  "prefix": "hp_printer_hp_printer_ink",
  "entity": "hp printer ink item",
  "categories": [
    {
      "id": "coverage",
      "label": "Coverage",
      "baseline": 2
    },
    {
      "id": "gaps",
      "label": "Gaps",
      "baseline": 2
    },
    {
      "id": "costs",
      "label": "Costs",
      "baseline": 2
    },
    {
      "id": "deadlines",
      "label": "Deadlines",
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
        "coverage"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "deadlines"
      ]
    }
  ],
  "sample": [
    {
      "id": "hp_printer_hp_printer_ink-coverage-1",
      "name": "Coverage primary",
      "category": "coverage",
      "tags": [
        "hp-printer",
        "hp",
        "printer"
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
      "id": "hp_printer_hp_printer_ink-gaps-2",
      "name": "Gaps primary",
      "category": "gaps",
      "tags": [
        "hp-printer",
        "hp",
        "printer"
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
      "id": "hp_printer_hp_printer_ink-costs-3",
      "name": "Costs primary",
      "category": "costs",
      "tags": [
        "hp-printer",
        "hp",
        "printer"
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
      "id": "hp_printer_hp_printer_ink-deadlines-4",
      "name": "Deadlines primary",
      "category": "deadlines",
      "tags": [
        "hp-printer",
        "hp",
        "printer"
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
      "id": "hp_printer_hp_printer_ink-coverage-5",
      "name": "Coverage backup",
      "category": "coverage",
      "tags": [
        "hp-printer",
        "hp",
        "printer"
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
      "id": "hp_printer_hp_printer_ink-gaps-6",
      "name": "Gaps backup",
      "category": "gaps",
      "tags": [
        "hp-printer",
        "hp",
        "printer"
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
      "id": "hp_printer_hp_printer_ink-costs-7",
      "name": "Costs backup",
      "category": "costs",
      "tags": [
        "hp-printer",
        "hp",
        "printer"
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
      "id": "hp_printer_hp_printer_ink-deadlines-8",
      "name": "Deadlines backup",
      "category": "deadlines",
      "tags": [
        "hp-printer",
        "hp",
        "printer"
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
