import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "modula-3",
  "displayName": "Modula-3",
  "version": "1.0.0",
  "extensions": [
    ".m3",
    ".i3",
    ".mg",
    ".ig"
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
      "path": "src/demo.m3",
      "content": "MODULE Demo;\nPROCEDURE Add(a, b: INTEGER): INTEGER =\nBEGIN\n  RETURN a + b\nEND Add;\nBEGIN\nEND Demo.\n"
    },
    {
      "path": "tests/run.m3",
      "content": "MODULE Demo;\nPROCEDURE Add(a, b: INTEGER): INTEGER =\nBEGIN\n  RETURN a + b\nEND Add;\nBEGIN\nEND Demo.\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "MODULE Demo;\nPROCEDURE Add(a, b: INTEGER): INTEGER =\nBEGIN\n  RETURN a + b\nEND Add;\nBEGIN\nEND Demo.\n"
    }
  },
  "reference": "Modula-3 syntax reference\n- Example: MODULE Demo;",
  "blockComment": {
    "start": "(*",
    "end": "*)"
  }
}
