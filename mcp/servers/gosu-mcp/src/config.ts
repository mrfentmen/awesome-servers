import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "gosu",
  "displayName": "Gosu",
  "version": "1.0.0",
  "extensions": [
    ".gs",
    ".gst",
    ".gsx",
    ".vark"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "package",
      "pattern": "^\\s*package\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*(?:class|interface|enum)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:static\\s+)?function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "uses",
      "pattern": "^\\s*uses\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.gs",
      "content": "class Main {\n  static function add(a: int, b: int): int { return a + b }\n}\n"
    },
    {
      "path": "tests/run.gs",
      "content": "class Main {\n  static function add(a: int, b: int): int { return a + b }\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "class Name {\n  static function value(): int { return 1 }\n}"
    }
  },
  "reference": "Gosu syntax reference\n- Class: class Name { ... }\n- Function: static function value(): int { return 1 }\n- Interface: interface Name { ... }\n- Package: package demo\n- Uses: uses java.util.ArrayList\n- Variable: var value : int = 1\n- Comment: // line; /* block */\n- Run: gosu file.gs",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
