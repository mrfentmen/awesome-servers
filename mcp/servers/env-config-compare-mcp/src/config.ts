import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "env-config-compare-mcp",
  "title": "env config compare Compare",
  "description": "Real local JSON analysis of env config compare in the Software & DevOps lane. 25 MCP tools, no paywall.",
  "prefix": "dev_env_config_compare",
  "entity": "env config compare item",
  "categories": [
    {
      "id": "dev",
      "label": "dev",
      "baseline": 2
    },
    {
      "id": "compare",
      "label": "compare",
      "baseline": 2
    },
    {
      "id": "env-config",
      "label": "env-config",
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
        "dev"
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
      "id": "dev_env_config_compare-dev-1",
      "name": "dev primary",
      "category": "dev",
      "tags": [
        "software-devops",
        "env",
        "config"
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
      "id": "dev_env_config_compare-compare-2",
      "name": "compare primary",
      "category": "compare",
      "tags": [
        "software-devops",
        "env",
        "config"
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
      "id": "dev_env_config_compare-env-config-3",
      "name": "env-config primary",
      "category": "env-config",
      "tags": [
        "software-devops",
        "env",
        "config"
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
      "id": "dev_env_config_compare-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "software-devops",
        "env",
        "config"
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
      "id": "dev_env_config_compare-dev-5",
      "name": "dev backup",
      "category": "dev",
      "tags": [
        "software-devops",
        "env",
        "config"
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
      "id": "dev_env_config_compare-compare-6",
      "name": "compare backup",
      "category": "compare",
      "tags": [
        "software-devops",
        "env",
        "config"
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
      "id": "dev_env_config_compare-env-config-7",
      "name": "env-config backup",
      "category": "env-config",
      "tags": [
        "software-devops",
        "env",
        "config"
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
      "id": "dev_env_config_compare-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "software-devops",
        "env",
        "config"
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
