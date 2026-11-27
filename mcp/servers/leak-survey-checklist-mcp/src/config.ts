import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "leak-survey-checklist-mcp",
  "title": "leak survey checklist Checklist",
  "description": "Real local JSON analysis of leak survey checklist in the Water & Waste lane. 25 MCP tools, no paywall.",
  "prefix": "util_leak_survey_checklist",
  "entity": "leak survey checklist item",
  "categories": [
    {
      "id": "util",
      "label": "util",
      "baseline": 2
    },
    {
      "id": "checklist",
      "label": "checklist",
      "baseline": 2
    },
    {
      "id": "leak-survey",
      "label": "leak-survey",
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
        "util"
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
      "id": "util_leak_survey_checklist-util-1",
      "name": "util primary",
      "category": "util",
      "tags": [
        "water-waste",
        "leak",
        "survey"
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
      "id": "util_leak_survey_checklist-checklist-2",
      "name": "checklist primary",
      "category": "checklist",
      "tags": [
        "water-waste",
        "leak",
        "survey"
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
      "id": "util_leak_survey_checklist-leak-survey-3",
      "name": "leak-survey primary",
      "category": "leak-survey",
      "tags": [
        "water-waste",
        "leak",
        "survey"
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
      "id": "util_leak_survey_checklist-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "water-waste",
        "leak",
        "survey"
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
      "id": "util_leak_survey_checklist-util-5",
      "name": "util backup",
      "category": "util",
      "tags": [
        "water-waste",
        "leak",
        "survey"
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
      "id": "util_leak_survey_checklist-checklist-6",
      "name": "checklist backup",
      "category": "checklist",
      "tags": [
        "water-waste",
        "leak",
        "survey"
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
      "id": "util_leak_survey_checklist-leak-survey-7",
      "name": "leak-survey backup",
      "category": "leak-survey",
      "tags": [
        "water-waste",
        "leak",
        "survey"
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
      "id": "util_leak_survey_checklist-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "water-waste",
        "leak",
        "survey"
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
