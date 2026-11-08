import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "b",
  "displayName": "B",
  "version": "1.0.0",
  "extensions": [
    ".b"
  ],
  "markers": [],
  "comment": "//",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "machine",
      "pattern": "^\\s*MACHINE\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variables",
      "pattern": "^\\s*VARIABLES\\s+([A-Za-z_][A-Za-z0-9_, ]*)"
    },
    {
      "kind": "invariant",
      "pattern": "^\\s*INVARIANT\\s+(.+)$"
    },
    {
      "kind": "operation",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*="
    }
  ],
  "imports": [
    {
      "kind": "sees",
      "pattern": "^\\s*SEES\\s+([A-Za-z_][A-Za-z0-9_, ]*)"
    },
    {
      "kind": "includes",
      "pattern": "^\\s*INCLUDES\\s+([A-Za-z_][A-Za-z0-9_, ]*)"
    }
  ],
  "scaffold": [
    {
      "path": "machines/Demo.b",
      "content": "MACHINE Demo\nVARIABLES x\nINVARIANT x : NAT\nOPERATIONS\n  op = x := 1\nEND\n"
    },
    {
      "path": "tests/Test.b",
      "content": "MACHINE Test\nVARIABLES x\nINVARIANT x : NAT\nOPERATIONS\n  op = x := 0\nEND\n"
    }
  ],
  "snippets": {
    "machine": {
      "description": "machine",
      "body": "MACHINE Name\nVARIABLES x\nINVARIANT x : NAT\nOPERATIONS\n  op = x := 1\nEND"
    },
    "operation": {
      "description": "operation",
      "body": "op = x := 1"
    },
    "invariant": {
      "description": "invariant",
      "body": "INVARIANT x : NAT"
    }
  },
  "reference": "B syntax reference\n- Machine: MACHINE Name\n- Variables: VARIABLES x\n- Invariant: INVARIANT x : NAT\n- Operations: OPERATIONS op = x := 1\n- End: END\n- Sees: SEES Other\n- Includes: INCLUDES Other\n- Comment: // line; /* block */"
}
