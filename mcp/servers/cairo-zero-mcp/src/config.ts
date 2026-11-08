import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "cairo-zero",
  "displayName": "Cairo Zero",
  "version": "1.0.0",
  "extensions": [
    ".cairo"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*func\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "struct",
      "pattern": "^\\s*(?:struct|namespace)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "constant",
      "pattern": "^\\s*const\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "from",
      "pattern": "^\\s*from\\s+([A-Za-z_][A-Za-z0-9_.]*)\\s+import"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.cairo",
      "content": "func add(a: felt, b: felt) -> felt {\n    return a + b;\n}\n"
    },
    {
      "path": "tests/run.cairo",
      "content": "func value() -> felt {\n    return 2 + 2;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "func name(value: felt) -> felt {\n    return value + 1;\n}"
    },
    "struct": {
      "description": "struct",
      "body": "struct Name {\n    value: felt,\n}"
    },
    "namespace": {
      "description": "namespace",
      "body": "namespace Name {\n}"
    }
  },
  "reference": "Cairo Zero syntax reference\n- Function: func name(value: felt) -> felt { return value + 1; }\n- Struct: struct Name { value: felt }\n- Namespace: namespace Name { ... }\n- Constant: const NAME = 1;\n- Variable: let value = 1;\n- Import: from module import Name;\n- Directive: %builtins range_check\n- Comment: // line\n- Compile: cairo-compile file.cairo"
}
