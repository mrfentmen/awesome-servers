import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "dylan",
  "displayName": "Dylan",
  "version": "1.0.0",
  "extensions": [
    ".dylan",
    ".dyl",
    ".intr",
    ".lid"
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
      "pattern": "^\\s*module:\\s*([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*define\\s+(?:function|method)\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*define\\s+class\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "constant",
      "pattern": "^\\s*define\\s+constant\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    }
  ],
  "imports": [
    {
      "kind": "use",
      "pattern": "^\\s*use\\s+([A-Za-z_][A-Za-z0-9_.-]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.dylan",
      "content": "module: demo\n\ndefine function add(a, b) a + b end;\n"
    },
    {
      "path": "tests/run.dylan",
      "content": "module: run\n\ndefine function value() 2 + 2 end;\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "define function name(value) value + 1 end;"
    },
    "class": {
      "description": "class",
      "body": "define class <name> (<object>)\nend class;"
    },
    "module": {
      "description": "module",
      "body": "module: name"
    }
  },
  "reference": "Dylan syntax reference\n- Module: module: name\n- Function: define function name(value) value + 1 end;\n- Method: define method name(value) value + 1 end;\n- Class: define class <name> (<object>) ... end class;\n- Constant: define constant name = 1;\n- Use: use module;\n- Conditional: if (condition) value else other end\n- Comment: // line; /* block */\n- Compile: dylan-compiler file.dylan"
}
