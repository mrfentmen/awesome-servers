import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "technology-dependency-tree-match-mcp",
  "title": "Dependency Tree Match Audit",
  "description": "Match dependency tree by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "dependency_tree_match",
  "entity": "dependency match",
  "categories": [
    {
      "id": "runtime",
      "label": "Runtime",
      "baseline": 4
    },
    {
      "id": "development",
      "label": "Development",
      "baseline": 3
    },
    {
      "id": "peer",
      "label": "Peer",
      "baseline": 2
    },
    {
      "id": "transitive",
      "label": "Transitive",
      "baseline": 3
    }
  ],
  "metric": {
    "id": "outdated_days",
    "label": "Outdated days",
    "unit": "days",
    "target": 90,
    "direction": "lower"
  },
  "target": {
    "maxItems": 30,
    "budget": 550,
    "coverage": 0.75,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "runtime",
      "label": "Runtime",
      "categories": [
        "runtime"
      ]
    },
    {
      "id": "development",
      "label": "Development",
      "categories": [
        "development"
      ]
    },
    {
      "id": "peer",
      "label": "Peer",
      "categories": [
        "peer"
      ]
    },
    {
      "id": "transitive",
      "label": "Transitive",
      "categories": [
        "transitive"
      ]
    }
  ],
  "sample": [
    {
      "id": "dependency_tree_match-react",
      "name": "react",
      "category": "runtime",
      "tags": [
        "runtime",
        "ui"
      ],
      "cost": 0,
      "quantity": 31,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "dependency_tree_match-zod",
      "name": "zod",
      "category": "runtime",
      "tags": [
        "runtime",
        "schema"
      ],
      "cost": 0,
      "quantity": 12,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "dependency_tree_match-vite",
      "name": "vite",
      "category": "development",
      "tags": [
        "build"
      ],
      "cost": 0,
      "quantity": 48,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "dependency_tree_match-typescript",
      "name": "typescript",
      "category": "development",
      "tags": [
        "build"
      ],
      "cost": 0,
      "quantity": 17,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "dependency_tree_match-eslint-plugin-react",
      "name": "eslint-plugin-react",
      "category": "development",
      "tags": [
        "lint"
      ],
      "cost": 0,
      "quantity": 140,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "dependency_tree_match-react-dom",
      "name": "react-dom",
      "category": "peer",
      "tags": [
        "peer",
        "ui"
      ],
      "cost": 0,
      "quantity": 31,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "dependency_tree_match-types-node",
      "name": "@types/node",
      "category": "peer",
      "tags": [
        "peer",
        "types"
      ],
      "cost": 0,
      "quantity": 95,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    },
    {
      "id": "dependency_tree_match-minimist",
      "name": "minimist",
      "category": "transitive",
      "tags": [
        "transitive",
        "cli"
      ],
      "cost": 12,
      "quantity": 420,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "worn"
    },
    {
      "id": "dependency_tree_match-postcss",
      "name": "postcss",
      "category": "transitive",
      "tags": [
        "transitive",
        "css"
      ],
      "cost": 0,
      "quantity": 75,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "good"
    },
    {
      "id": "dependency_tree_match-braces",
      "name": "braces",
      "category": "transitive",
      "tags": [
        "transitive",
        "glob"
      ],
      "cost": 0,
      "quantity": 260,
      "acquired": "2026-08-01",
      "lastUsed": "2026-11-10",
      "condition": "fair"
    }
  ]
}
