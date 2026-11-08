import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "pony",
  "displayName": "Pony",
  "version": "1.0.0",
  "extensions": [
    ".pony"
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
      "kind": "actor",
      "pattern": "^\\s*actor\\s+([A-Z][A-Za-z0-9_]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Z][A-Za-z0-9_]*)"
    },
    {
      "kind": "primitive",
      "pattern": "^\\s*primitive\\s+([A-Z][A-Za-z0-9_]*)"
    },
    {
      "kind": "trait",
      "pattern": "^\\s*trait\\s+([A-Z][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:fun|be|new)\\s+([a-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "use",
      "pattern": "^\\s*use\\s+\"([^\"]+)\""
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.pony",
      "content": "actor Demo\n  new create(env: Env) =>\n    None\n\n  fun greet(): String =>\n    \"hello\"\n"
    },
    {
      "path": "tests/run.pony",
      "content": "actor Run\n  new create(env: Env) =>\n    None\n"
    }
  ],
  "snippets": {
    "actor": {
      "description": "actor",
      "body": "actor Name\n  new create(env: Env) =>\n    None"
    },
    "class": {
      "description": "class",
      "body": "class Name\n  var value: U64 = 0"
    },
    "function": {
      "description": "function",
      "body": "fun name(value: U64): U64 =>\n  value + 1"
    }
  },
  "reference": "Pony syntax reference\n- Actor: actor Name new create(env: Env) => None\n- Class: class Name var value: U64 = 0\n- Primitive: primitive Name\n- Trait: trait Name\n- Function: fun name(value: U64): U64 => value + 1\n- Behaviour: be name() => None\n- Use: use \"package\"\n- Comment: // line; /* block */\n- Build: ponyc"
}
