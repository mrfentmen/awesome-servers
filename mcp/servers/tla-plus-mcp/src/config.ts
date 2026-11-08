import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "tla-plus",
  "displayName": "TLA+",
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
      "pattern": "^\\s*-+\\s*MODULE\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*VARIABLES?\\s+([A-Za-z_][A-Za-z0-9_, ]*)"
    },
    {
      "kind": "operator",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*=="
    },
    {
      "kind": "theorem",
      "pattern": "^\\s*THEOREM\\s+([A-Za-z_][A-Za-z0-9_]*)"
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
      "content": "---- MODULE Demo ----\nEXTENDS Naturals\n\nVARIABLE x\nInit == x = 0\nNext == x' = x + 1\nSpec == Init /\\ [][Next]_x\n====\n"
    },
    {
      "path": "tests/Test.tla",
      "content": "---- MODULE Test ----\nEXTENDS Naturals\nInit == TRUE\n====\n"
    }
  ],
  "snippets": {
    "module": {
      "description": "module",
      "body": "---- MODULE Name ----\nEXTENDS Naturals\n\nInit == TRUE\n===="
    },
    "variable": {
      "description": "variable",
      "body": "VARIABLE x"
    },
    "operator": {
      "description": "operator",
      "body": "Next == x' = x + 1"
    }
  },
  "reference": "TLA+ syntax reference\n- Module: ---- MODULE Name ---- ... ====\n- Extends: EXTENDS Naturals\n- Variable: VARIABLE x\n- Operator: Init == x = 0\n- Next: Next == x' = x + 1\n- Spec: Spec == Init /\\ [][Next]_x\n- Theorem: THEOREM Name == ...\n- Comment: \\* line; (* block *)"
}
