import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "oberon-2",
  "displayName": "Oberon-2",
  "version": "1.0.0",
  "extensions": [
    ".ob2"
  ],
  "markers": [],
  "comment": "(*",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*MODULE\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.ob2",
      "content": "MODULE Demo;\nPROCEDURE Add(a, b: INTEGER): INTEGER;\nBEGIN\n  RETURN a + b\nEND Add;\nEND Demo.\n"
    },
    {
      "path": "tests/run.ob2",
      "content": "MODULE Demo;\nPROCEDURE Add(a, b: INTEGER): INTEGER;\nBEGIN\n  RETURN a + b\nEND Add;\nEND Demo.\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "MODULE Demo;\nPROCEDURE Add(a, b: INTEGER): INTEGER;\nBEGIN\n  RETURN a + b\nEND Add;\nEND Demo.\n"
    }
  },
  "reference": "Oberon-2 syntax reference\n- Example: MODULE Demo;",
  "blockComment": {
    "start": "(*",
    "end": "*)"
  }
}
