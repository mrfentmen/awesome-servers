import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "tla",
  "displayName": "TLA",
  "version": "1.0.0",
  "extensions": [
    ".tla"
  ],
  "markers": [],
  "comment": "\\*",
  "blockComment": {
    "start": "(*",
    "end": "*)"
  },
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^-{4,}\\s*MODULE\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*VARIABLE\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "constant",
      "pattern": "^\\s*CONSTANT\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "definition",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*=="
    }
  ],
  "imports": [
    {
      "kind": "extends",
      "pattern": "^\\s*EXTENDS\\s+([A-Za-z_][A-Za-z0-9_, ]*)"
    }
  ],
  "scaffold": [
    {
      "path": "specs/Demo.tla",
      "content": "---- MODULE Demo ----\nEXTENDS Naturals\n\nAdd == 2 + 2\n\n====\n"
    },
    {
      "path": "tests/DemoTest.tla",
      "content": "---- MODULE DemoTest ----\nEXTENDS Naturals\n\nValue == 2 + 2\n\n====\n"
    }
  ],
  "snippets": {
    "module": {
      "description": "module",
      "body": "---- MODULE Name ----\nEXTENDS Naturals\n\nValue == 1\n\n===="
    },
    "definition": {
      "description": "definition",
      "body": "Name == 2 + 2"
    },
    "variable": {
      "description": "variable",
      "body": "VARIABLE value"
    }
  },
  "reference": "TLA syntax reference\n- Module: ---- MODULE Name ---- ... ====\n- Extends: EXTENDS Naturals\n- Variable: VARIABLE value\n- Constant: CONSTANT Value\n- Definition: Name == 2 + 2\n- Init: Init == value = 0\n- Next: Next == value' = value + 1\n- Comment: \\* line; (* block *)\n- Run: tlc Module"
}
