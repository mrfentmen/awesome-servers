import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "music-pedal-chain-plan-mcp",
  "title": "Pedal Chain Planning Audit",
  "description": "Plan pedal chain by category, cost, coverage and dependency gaps. Real local JSON analysis, 25 MCP tools, no paywall.",
  "prefix": "pedal_chain_plan",
  "entity": "pedal plan",
  "categories": [
    {
      "id": "drive",
      "label": "Drive",
      "baseline": 2
    },
    {
      "id": "modulation",
      "label": "Modulation",
      "baseline": 2
    },
    {
      "id": "delay",
      "label": "Delay",
      "baseline": 1
    },
    {
      "id": "reverb",
      "label": "Reverb",
      "baseline": 1
    },
    {
      "id": "utility",
      "label": "Utility",
      "baseline": 2
    }
  ],
  "metric": {
    "id": "snr_db",
    "label": "Signal-to-noise ratio",
    "unit": "dB",
    "target": 60,
    "direction": "higher"
  },
  "target": {
    "maxItems": 16,
    "budget": 500,
    "coverage": 0.8,
    "expiryDays": 0
  },
  "dependencies": [
    {
      "id": "gain",
      "label": "Gain stage",
      "categories": [
        "drive"
      ]
    },
    {
      "id": "modulation",
      "label": "Modulation stage",
      "categories": [
        "modulation"
      ]
    },
    {
      "id": "time",
      "label": "Time effects",
      "categories": [
        "delay",
        "reverb"
      ]
    },
    {
      "id": "utility",
      "label": "Utility stage",
      "categories": [
        "utility"
      ]
    }
  ],
  "sample": [
    {
      "id": "pedal_chain_plan-overdrive",
      "name": "Overdrive",
      "category": "drive",
      "tags": [
        "always-on",
        "low-gain"
      ],
      "cost": 120,
      "quantity": 65,
      "condition": "good"
    },
    {
      "id": "pedal_chain_plan-fuzz",
      "name": "Fuzz",
      "category": "drive",
      "tags": [
        "germanium",
        "high-gain"
      ],
      "cost": 150,
      "quantity": 54,
      "condition": "fair"
    },
    {
      "id": "pedal_chain_plan-chorus",
      "name": "Chorus",
      "category": "modulation",
      "tags": [
        "analog",
        "stereo"
      ],
      "cost": 180,
      "quantity": 70,
      "condition": "good"
    },
    {
      "id": "pedal_chain_plan-phaser",
      "name": "Phaser",
      "category": "modulation",
      "tags": [
        "four-stage",
        "subtle"
      ],
      "cost": 140,
      "quantity": 62,
      "condition": "good"
    },
    {
      "id": "pedal_chain_plan-delay",
      "name": "Analog delay",
      "category": "delay",
      "tags": [
        "short",
        "slapback"
      ],
      "cost": 170,
      "quantity": 60,
      "condition": "good"
    },
    {
      "id": "pedal_chain_plan-reverb",
      "name": "Plate reverb",
      "category": "reverb",
      "tags": [
        "plate",
        "long"
      ],
      "cost": 220,
      "quantity": 56,
      "condition": "fair"
    },
    {
      "id": "pedal_chain_plan-tuner",
      "name": "Tuner",
      "category": "utility",
      "tags": [
        "bypass",
        "true-bypass"
      ],
      "cost": 100,
      "quantity": 82,
      "condition": "good"
    },
    {
      "id": "pedal_chain_plan-power",
      "name": "Power supply",
      "category": "utility",
      "tags": [
        "isolated",
        "nine-volt"
      ],
      "cost": 160,
      "quantity": 48,
      "condition": "worn"
    }
  ]
}
