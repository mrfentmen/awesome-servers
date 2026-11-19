import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "homebrew-recipe-calc-mcp",
  "title": "Homebrew Recipe Calc Audit",
  "description": "Homebrew Recipe Calc Audit: homebrew batch math and logs. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "homebrew",
  "entity": "batch",
  "categories": [
    {
      "id": "ale",
      "label": "Ales",
      "baseline": 4
    },
    {
      "id": "lager",
      "label": "Lagers",
      "baseline": 3
    },
    {
      "id": "cider",
      "label": "Ciders",
      "baseline": 3
    },
    {
      "id": "supplies",
      "label": "Supplies",
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
    "budget": 1000,
    "coverage": 0.75,
    "expiryDays": 45
  },
  "dependencies": [
    {
      "id": "core",
      "label": "Core records",
      "categories": [
        "ale"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "supplies"
      ]
    }
  ],
  "sample": [
    {
      "id": "homebrew-sample-1",
      "name": "Sample ales entry",
      "category": "ale",
      "tags": [
        "homebrew"
      ],
      "cost": 20,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "homebrew-sample-2",
      "name": "Sample lagers entry",
      "category": "lager",
      "tags": [
        "homebrew"
      ],
      "cost": 30,
      "quantity": 2,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "good",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "homebrew-sample-3",
      "name": "Sample ciders entry",
      "category": "cider",
      "tags": [
        "homebrew"
      ],
      "cost": 40,
      "quantity": 3,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "fair",
      "notes": "Baseline entry; replace with your own data."
    },
    {
      "id": "homebrew-sample-4",
      "name": "Sample supplies entry",
      "category": "supplies",
      "tags": [
        "homebrew"
      ],
      "cost": 50,
      "quantity": 1,
      "acquired": "2026-01-15",
      "lastUsed": "2026-10-15",
      "expires": "2027-06-01",
      "condition": "new",
      "notes": "Baseline entry; replace with your own data."
    }
  ]
}
