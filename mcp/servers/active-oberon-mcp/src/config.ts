import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "active-oberon",
  "displayName": "Active Oberon",
  "version": "1.0.0",
  "extensions": [
    ".aob"
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
      "path": "src/demo.aob",
      "content": "MODULE Demo;\nPROCEDURE Add(a, b: INTEGER): INTEGER;\nBEGIN\n  RETURN a + b\nEND Add;\nEND Demo.\n"
    },
    {
      "path": "tests/run.aob",
      "content": "MODULE Demo;\nPROCEDURE Add(a, b: INTEGER): INTEGER;\nBEGIN\n  RETURN a + b\nEND Add;\nEND Demo.\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "MODULE Demo;\nPROCEDURE Add(a, b: INTEGER): INTEGER;\nBEGIN\n  RETURN a + b\nEND Add;\nEND Demo.\n"
    }
  },
  "reference": "Active Oberon syntax reference\n- Example: MODULE Demo;",
  "blockComment": {
    "start": "(*",
    "end": "*)"
  }
}
