import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "ballerina",
  "displayName": "Ballerina",
  "version": "1.0.0",
  "extensions": [
    ".bal"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "service",
      "pattern": "^\\s*service\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*(?:class|record)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.bal",
      "content": "function add(int a, int b) returns int {\n    return a + b;\n}\n"
    },
    {
      "path": "tests/run.bal",
      "content": "function add(int a, int b) returns int {\n    return a + b;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function value(int a) returns int {\n    return a + 1;\n}"
    }
  },
  "reference": "Ballerina syntax reference\n- Function: function value(int a) returns int { return a + 1; }\n- Service: service Name on listener { ... }\n- Class: class Name { ... }\n- Import: import ballerina/io;\n- Variable: int value = 1;\n- Comment: // line; /* block */\n- Run: bal run file.bal",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
