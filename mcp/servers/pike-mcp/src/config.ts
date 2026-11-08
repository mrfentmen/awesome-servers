import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "pike",
  "displayName": "Pike",
  "version": "1.0.0",
  "extensions": [
    ".pike",
    ".pmod"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "class",
      "pattern": "^\\s*(?:class|enum)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:int|void|string|float|array|mapping|mixed|object|program)\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*\\("
    },
    {
      "kind": "constant",
      "pattern": "^\\s*(?:constant|inherit)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "inherit",
      "pattern": "^\\s*inherit\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.pike",
      "content": "int add(int a, int b) {\n  return a + b;\n}\n"
    },
    {
      "path": "tests/run.pike",
      "content": "int add(int a, int b) {\n  return a + b;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "int name(int value) {\n  return value + 1;\n}"
    }
  },
  "reference": "Pike syntax reference\n- Function: int name(int value) { return value + 1; }\n- Class: class Name { ... }\n- Constant: constant Name = 1;\n- Inherit: inherit module;\n- Mapping: mapping(string:int) values = ([]);\n- Array: array(int) values = ({});\n- Comment: // line; /* block */\n- Run: pike file.pike",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
