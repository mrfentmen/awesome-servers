import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "event-b",
  "displayName": "Event-B",
  "version": "1.0.0",
  "extensions": [
    ".eventb",
    ".bum",
    ".buc"
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
      "kind": "context",
      "pattern": "^\\s*CONTEXT\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variables",
      "pattern": "^\\s*VARIABLES\\s+([A-Za-z_][A-Za-z0-9_, ]*)"
    },
    {
      "kind": "event",
      "pattern": "^\\s*EVENT\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "sees",
      "pattern": "^\\s*SEES\\s+([A-Za-z_][A-Za-z0-9_, ]*)"
    },
    {
      "kind": "extends",
      "pattern": "^\\s*EXTENDS\\s+([A-Za-z_][A-Za-z0-9_, ]*)"
    }
  ],
  "scaffold": [
    {
      "path": "machines/Demo.eventb",
      "content": "MACHINE Demo\nVARIABLES x\nINVARIANTS\n  x : NAT\nEVENTS\n  INITIALISATION\n    x := 0\nEND\n"
    },
    {
      "path": "contexts/Context.eventb",
      "content": "CONTEXT Context\nSETS\n  Item\nEND\n"
    }
  ],
  "snippets": {
    "machine": {
      "description": "machine",
      "body": "MACHINE Name\nVARIABLES x\nINVARIANTS\n  x : NAT\nEVENTS\n  INITIALISATION\n    x := 0\nEND"
    },
    "context": {
      "description": "context",
      "body": "CONTEXT Name\nSETS\n  Item\nEND"
    },
    "event": {
      "description": "event",
      "body": "EVENT name\n  WHEN\n    x = 0\n  THEN\n    x := 1\nEND"
    }
  },
  "reference": "Event-B syntax reference\n- Machine: MACHINE Name\n- Context: CONTEXT Name\n- Variables: VARIABLES x\n- Invariant: INVARIANTS x : NAT\n- Events: EVENTS EVENT name ... END\n- Initialisation: INITIALISATION x := 0\n- Sees: SEES Context\n- Comment: // line; /* block */"
}
