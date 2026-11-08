import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "alloy",
  "displayName": "Alloy",
  "version": "1.0.0",
  "extensions": [
    ".als"
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
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "signature",
      "pattern": "^\\s*sig\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "predicate",
      "pattern": "^\\s*pred\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "fact",
      "pattern": "^\\s*fact\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "assertion",
      "pattern": "^\\s*assert\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "open",
      "pattern": "^\\s*open\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "scaffold": [
    {
      "path": "models/demo.als",
      "content": "module demo\n\nsig Person {}\n\npred show {}\nrun show for 3\n"
    },
    {
      "path": "tests/run.als",
      "content": "module test\nsig Item {}\nrun {} for 2\n"
    }
  ],
  "snippets": {
    "signature": {
      "description": "signature",
      "body": "sig Name {}"
    },
    "predicate": {
      "description": "predicate",
      "body": "pred name {}"
    },
    "run": {
      "description": "run",
      "body": "run name for 3"
    }
  },
  "reference": "Alloy syntax reference\n- Module: module name\n- Signature: sig Name {}\n- Field: sig Name { value: Int }\n- Predicate: pred name { ... }\n- Fact: fact name { ... }\n- Assertion: assert name { ... }\n- Run: run name for 3\n- Check: check name for 3\n- Comment: // line; /* block */"
}
