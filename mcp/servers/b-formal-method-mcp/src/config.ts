import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "b-formal-method",
  "displayName": "B (Formal Method)",
  "version": "1.0.0",
  "extensions": [
    ".mch"
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
      "kind": "refines",
      "pattern": "^\\s*REFINES\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variables",
      "pattern": "^\\s*VARIABLES\\s+([A-Za-z_][A-Za-z0-9_, ]*)"
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
      "path": "machines/Demo.mch",
      "content": "MACHINE Demo\nVARIABLES x\nINVARIANT x : NAT\nOPERATIONS\n  op = x := 1\nEND\n"
    },
    {
      "path": "machines/Refinement.mch",
      "content": "MACHINE Refinement\nREFINES Demo\nVARIABLES x\nINVARIANT x : NAT\nOPERATIONS\n  op = x := 1\nEND\n"
    }
  ],
  "snippets": {
    "machine": {
      "description": "machine",
      "body": "MACHINE Name\nVARIABLES x\nINVARIANT x : NAT\nOPERATIONS\n  op = x := 1\nEND"
    },
    "refines": {
      "description": "refinement",
      "body": "REFINES AbstractMachine"
    },
    "operation": {
      "description": "operation",
      "body": "op = x := 1"
    }
  },
  "reference": "B (Formal Method) syntax reference\n- Machine: MACHINE Name\n- Refines: REFINES AbstractMachine\n- Variables: VARIABLES x\n- Invariant: INVARIANT x : NAT\n- Operations: OPERATIONS op = x := 1\n- End: END\n- Sees: SEES Context\n- Comment: // line; /* block */"
}
