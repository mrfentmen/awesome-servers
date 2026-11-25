import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "wifi-secure-compare-mcp",
  "title": "wifi secure compare Compare",
  "description": "Real local JSON analysis of wifi secure compare in the Security & Privacy lane. 25 MCP tools, no paywall.",
  "prefix": "sec_wifi_secure_compare",
  "entity": "wifi secure compare item",
  "categories": [
    {
      "id": "sec",
      "label": "sec",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "wifi-secure",
      "label": "wifi-secure",
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
        "sec"
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
      "id": "sec_wifi_secure_compare-sec-1",
      "name": "sec primary",
      "category": "sec",
      "tags": [
        "security-privacy",
        "wifi",
        "secure"
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
      "id": "sec_wifi_secure_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "security-privacy",
        "wifi",
        "secure"
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
      "id": "sec_wifi_secure_compare-wifi-secure-3",
      "name": "wifi-secure primary",
      "category": "wifi-secure",
      "tags": [
        "security-privacy",
        "wifi",
        "secure"
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
      "id": "sec_wifi_secure_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "security-privacy",
        "wifi",
        "secure"
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
      "id": "sec_wifi_secure_compare-sec-5",
      "name": "sec backup",
      "category": "sec",
      "tags": [
        "security-privacy",
        "wifi",
        "secure"
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
      "id": "sec_wifi_secure_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "security-privacy",
        "wifi",
        "secure"
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
      "id": "sec_wifi_secure_compare-wifi-secure-7",
      "name": "wifi-secure backup",
      "category": "wifi-secure",
      "tags": [
        "security-privacy",
        "wifi",
        "secure"
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
      "id": "sec_wifi_secure_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "security-privacy",
        "wifi",
        "secure"
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
