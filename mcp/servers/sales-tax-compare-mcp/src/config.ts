import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "sales-tax-compare-mcp",
  "title": "sales tax compare Compare",
  "description": "Real local JSON analysis of sales tax compare in the Money & Books lane. 25 MCP tools, no paywall.",
  "prefix": "money_sales_tax_compare",
  "entity": "sales tax compare item",
  "categories": [
    {
      "id": "money",
      "label": "money",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "sales-tax",
      "label": "sales-tax",
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
        "money"
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
      "id": "money_sales_tax_compare-money-1",
      "name": "money primary",
      "category": "money",
      "tags": [
        "money-books",
        "sales",
        "tax"
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
      "id": "money_sales_tax_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "money-books",
        "sales",
        "tax"
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
      "id": "money_sales_tax_compare-sales-tax-3",
      "name": "sales-tax primary",
      "category": "sales-tax",
      "tags": [
        "money-books",
        "sales",
        "tax"
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
      "id": "money_sales_tax_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "money-books",
        "sales",
        "tax"
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
      "id": "money_sales_tax_compare-money-5",
      "name": "money backup",
      "category": "money",
      "tags": [
        "money-books",
        "sales",
        "tax"
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
      "id": "money_sales_tax_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "money-books",
        "sales",
        "tax"
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
      "id": "money_sales_tax_compare-sales-tax-7",
      "name": "sales-tax backup",
      "category": "sales-tax",
      "tags": [
        "money-books",
        "sales",
        "tax"
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
      "id": "money_sales_tax_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "money-books",
        "sales",
        "tax"
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
