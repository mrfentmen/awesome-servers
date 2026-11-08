import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "pogoscript",
  "displayName": "PogoScript",
  "version": "1.0.0",
  "extensions": [
    ".pogo"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*\\("
    },
    {
      "kind": "class",
      "pattern": "^\\s*(?:class|trait)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "require",
      "pattern": "^\\s*require\\s+[\"']([^\"']+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.pogo",
      "content": "add = (a, b) -> a + b\n"
    },
    {
      "path": "tests/run.pogo",
      "content": "add = (a, b) -> a + b\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "value = (a) -> a + 1"
    }
  },
  "reference": "PogoScript syntax reference\n- Function: value = (a) -> a + 1\n- Class: class Name\n- Trait: trait Name\n- Require: require 'module'\n- Variable: value = 1\n- Conditional: if condition then ...\n- Loop: for each value in list ...\n- Comment: // line; /* block */\n- Run: pogo file.pogo",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
