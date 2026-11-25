import type { ServerConfig } from "./engine.js"

export const config: ServerConfig = {
  "name": "microscope-slide-guide-mcp",
  "title": "microscope slide guide Guide",
  "description": "Real local JSON analysis of microscope slide guide in the Science & Lab lane. 25 MCP tools, no paywall.",
  "prefix": "sci_microscope_slide_guide",
  "entity": "microscope slide guide item",
  "categories": [
    {
      "id": "sci",
      "label": "sci",
      "baseline": 2
    },
    {
      "id": "guide",
      "label": "guide",
      "baseline": 2
    },
    {
      "id": "microscope-slide",
      "label": "microscope-slide",
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
        "sci"
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
      "id": "sci_microscope_slide_guide-sci-1",
      "name": "sci primary",
      "category": "sci",
      "tags": [
        "science-lab",
        "microscope",
        "slide"
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
      "id": "sci_microscope_slide_guide-guide-2",
      "name": "guide primary",
      "category": "guide",
      "tags": [
        "science-lab",
        "microscope",
        "slide"
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
      "id": "sci_microscope_slide_guide-microscope-slide-3",
      "name": "microscope-slide primary",
      "category": "microscope-slide",
      "tags": [
        "science-lab",
        "microscope",
        "slide"
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
      "id": "sci_microscope_slide_guide-mcp-4",
      "name": "mcp primary",
      "category": "mcp",
      "tags": [
        "science-lab",
        "microscope",
        "slide"
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
      "id": "sci_microscope_slide_guide-sci-5",
      "name": "sci backup",
      "category": "sci",
      "tags": [
        "science-lab",
        "microscope",
        "slide"
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
      "id": "sci_microscope_slide_guide-guide-6",
      "name": "guide backup",
      "category": "guide",
      "tags": [
        "science-lab",
        "microscope",
        "slide"
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
      "id": "sci_microscope_slide_guide-microscope-slide-7",
      "name": "microscope-slide backup",
      "category": "microscope-slide",
      "tags": [
        "science-lab",
        "microscope",
        "slide"
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
      "id": "sci_microscope_slide_guide-mcp-8",
      "name": "mcp backup",
      "category": "mcp",
      "tags": [
        "science-lab",
        "microscope",
        "slide"
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
