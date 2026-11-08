import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "yul",
  "displayName": "Yul",
  "version": "1.0.0",
  "extensions": [
    ".yul"
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
      "kind": "object",
      "pattern": "^\\s*object\\s+\"([^\"]+)\""
    },
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*let\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.yul",
      "content": "object \"Demo\" {\n  code {\n    function add(a, b) -> c {\n      c := add(a, b)\n    }\n  }\n}\n"
    },
    {
      "path": "tests/run.yul",
      "content": "object \"Test\" {\n  code {\n    let value := 4\n  }\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function name(a, b) -> c {\n  c := add(a, b)\n}"
    },
    "object": {
      "description": "object",
      "body": "object \"Name\" {\n  code {\n  }\n}"
    },
    "variable": {
      "description": "variable",
      "body": "let value := 1"
    }
  },
  "reference": "Yul syntax reference\n- Object: object \"Name\" { code { ... } }\n- Function: function name(a, b) -> c { c := add(a, b) }\n- Variable: let value := 1\n- Assign: value := 1\n- Call: add(a, b)\n- If: if condition { ... }\n- For: for { let i := 0 } lt(i, 10) { i := add(i, 1) } { ... }\n- Comment: // line; /* block */\n- Compile: solc --strict-assembly file.yul"
}
