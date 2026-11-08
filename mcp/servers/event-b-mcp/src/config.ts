import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "event-b",
  "displayName": "Event-B",
  "version": "1.0.0",
  "extensions": [
    ".bum"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "machine",
      "pattern": "^\\s*MACHINE\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.bum",
      "content": "MACHINE Demo\nVARIABLES value\nINVARIANT value : NAT\nEND\n"
    },
    {
      "path": "tests/run.bum",
      "content": "MACHINE Demo\nVARIABLES value\nINVARIANT value : NAT\nEND\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "MACHINE Demo\nVARIABLES value\nINVARIANT value : NAT\nEND\n"
    }
  },
  "reference": "Event-B syntax reference\n- Example: MACHINE Demo"
}
