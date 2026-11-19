import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "protein-powder-compare-mcp",
  "title": "Protein Powder Compare Audit",
  "description": "Protein Powder Compare Audit: compare powder labels and cost per serving. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "protein_powder",
  "entity": "powder",
  "categories": [
    {
      "id": "whey",
      "label": "Whey",
      "baseline": 4
    },
    {
      "id": "plant",
      "label": "Plant",
      "baseline": 3
    },
    {
      "id": "blend",
      "label": "Blends",
      "baseline": 3
    },
    {
      "id": "rtd",
      "label": "Ready to drink",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "cost_per_use",
    "label": "Cost per use",
    "unit": "USD",
    "target": 25,
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
        "whey"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "rtd"
      ]
    }
  ],
  "sample": [
    {
      "id": "protein_powder-sample-1",
      "name": "Sample whey entry",
      "category": "whey",
      "tags": [
        "protein"
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
      "id": "protein_powder-sample-2",
      "name": "Sample plant entry",
      "category": "plant",
      "tags": [
        "protein"
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
      "id": "protein_powder-sample-3",
      "name": "Sample blends entry",
      "category": "blend",
      "tags": [
        "protein"
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
      "id": "protein_powder-sample-4",
      "name": "Sample ready to drink entry",
      "category": "rtd",
      "tags": [
        "protein"
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
