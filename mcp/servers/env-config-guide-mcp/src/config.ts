import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "env-config-guide-mcp",
  "title": "env config guide Guide",
  "description": "Real local JSON analysis of env config guide in the Software & DevOps lane. 25 MCP tools, no paywall.",
  "prefix": "dev_env_config_guide",
  "entity": "env config guide item",
  "categories": [
    {
      "id": "dev",
      "label": "dev",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
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
      "id": "dev_env_config_guide-dev-1",
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
      "id": "dev_env_config_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
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
      "id": "dev_env_config_guide-env-config-3",
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
      "id": "dev_env_config_guide-mcp-4",
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
      "id": "dev_env_config_guide-dev-5",
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
      "id": "dev_env_config_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
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
      "id": "dev_env_config_guide-env-config-7",
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
      "id": "dev_env_config_guide-mcp-8",
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
