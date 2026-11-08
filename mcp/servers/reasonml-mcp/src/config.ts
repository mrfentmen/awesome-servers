import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "reasonml",
  "displayName": "ReasonML",
  "version": "1.0.0",
  "extensions": [
    ".re",
    ".rei"
  ],
  "markers": [
    "bsconfig.json"
  ],
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
      "pattern": "^\\s*module\\s+([A-Z][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*let\\s+(?:rec\\s+)?([a-z_][A-Za-z0-9_']*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*type\\s+([a-z_][A-Za-z0-9_']*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([a-z_][A-Za-z0-9_']*)"
    }
  ],
  "imports": [
    {
      "kind": "open",
      "pattern": "^\\s*open\\s+([A-Z][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/Demo.re",
      "content": "let add = (a, b) => a + b;\n\nJs.log(add(2, 2));\n"
    },
    {
      "path": "tests/Run.re",
      "content": "let value = 2 + 2;\n\nif (value != 4) {\n  failwith(\"math failed\");\n};\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "let name = value => value + 1;"
    },
    "module": {
      "description": "module",
      "body": "module Name = {\n  let value = 1;\n};"
    },
    "type": {
      "description": "type",
      "body": "type name = One | Two;"
    }
  },
  "reference": "ReasonML syntax reference\n- Let: let name = value;\n- Function: let name = value => value + 1;\n- Module: module Name = { let value = 1; };\n- Type: type name = One | Two;\n- Variant: type result = Ok(int) | Error(string);\n- Class: class name = { as self; };\n- Open: open Belt;\n- Comment: // line; /* block */\n- Build: bsb -make-world"
}
