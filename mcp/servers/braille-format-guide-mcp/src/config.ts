import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "braille-format-guide-mcp",
  "title": "braille format guide Guide",
  "description": "Real local JSON analysis of braille format guide in the Accessibility & Disability lane. 25 MCP tools, no paywall.",
  "prefix": "access_braille_format_guide",
  "entity": "braille format guide item",
  "categories": [
    {
      "id": "access",
      "label": "access",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "braille-format",
      "label": "braille-format",
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
        "access"
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
      "id": "access_braille_format_guide-access-1",
      "name": "access primary",
      "category": "access",
      "tags": [
        "accessibility-disability",
        "braille",
        "format"
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
      "id": "access_braille_format_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "accessibility-disability",
        "braille",
        "format"
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
      "id": "access_braille_format_guide-braille-format-3",
      "name": "braille-format primary",
      "category": "braille-format",
      "tags": [
        "accessibility-disability",
        "braille",
        "format"
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
      "id": "access_braille_format_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "accessibility-disability",
        "braille",
        "format"
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
      "id": "access_braille_format_guide-access-5",
      "name": "access backup",
      "category": "access",
      "tags": [
        "accessibility-disability",
        "braille",
        "format"
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
      "id": "access_braille_format_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "accessibility-disability",
        "braille",
        "format"
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
      "id": "access_braille_format_guide-braille-format-7",
      "name": "braille-format backup",
      "category": "braille-format",
      "tags": [
        "accessibility-disability",
        "braille",
        "format"
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
      "id": "access_braille_format_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "accessibility-disability",
        "braille",
        "format"
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
