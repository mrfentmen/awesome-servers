import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "small-business-payroll-setup-check-mcp",
  "title": "Payroll Setup Audit",
  "description": "Audit payroll setup by employees, tax, benefits, provider coverage, cost, deadlines and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "small_business_payroll_setup",
  "entity": "payroll setup item",
  "categories": [
    {
      "id": "employees",
      "label": "Employees",
      "baseline": 2
    },
    {
      "id": "tax",
      "label": "Tax",
      "baseline": 2
    },
    {
      "id": "benefits",
      "label": "Benefits",
      "baseline": 2
    },
    {
      "id": "provider",
      "label": "Provider",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "days_to_expiry",
    "label": "Days to deadline",
    "unit": "days",
    "target": 30,
    "direction": "higher"
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
        "employees"
      ]
    },
    {
      "id": "backup",
      "label": "Backup coverage",
      "categories": [
        "provider"
      ]
    }
  ],
  "sample": [
    {
      "id": "small_business_payroll_setup-employees-1",
      "name": "Employees primary",
      "category": "employees",
      "tags": [
        "small-business",
        "compliance",
        "operations"
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
      "id": "small_business_payroll_setup-tax-2",
      "name": "Tax primary",
      "category": "tax",
      "tags": [
        "small-business",
        "compliance",
        "operations"
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
      "id": "small_business_payroll_setup-benefits-3",
      "name": "Benefits primary",
      "category": "benefits",
      "tags": [
        "small-business",
        "compliance",
        "operations"
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
      "id": "small_business_payroll_setup-provider-4",
      "name": "Provider primary",
      "category": "provider",
      "tags": [
        "small-business",
        "compliance",
        "operations"
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
      "id": "small_business_payroll_setup-employees-5",
      "name": "Employees backup",
      "category": "employees",
      "tags": [
        "small-business",
        "compliance",
        "operations"
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
      "id": "small_business_payroll_setup-tax-6",
      "name": "Tax backup",
      "category": "tax",
      "tags": [
        "small-business",
        "compliance",
        "operations"
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
      "id": "small_business_payroll_setup-benefits-7",
      "name": "Benefits backup",
      "category": "benefits",
      "tags": [
        "small-business",
        "compliance",
        "operations"
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
      "id": "small_business_payroll_setup-provider-8",
      "name": "Provider backup",
      "category": "provider",
      "tags": [
        "small-business",
        "compliance",
        "operations"
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
