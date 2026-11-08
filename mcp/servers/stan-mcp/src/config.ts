import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "stan",
  "displayName": "Stan",
  "version": "1.0.0",
  "extensions": [
    ".stan"
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
      "kind": "function",
      "pattern": "^\\s*(?:real|int|vector|row_vector|matrix)\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*\\("
    },
    {
      "kind": "data",
      "pattern": "^\\s*(?:int|real|vector|array)[^;]*?\\s([A-Za-z_][A-Za-z0-9_]*)\\s*;"
    },
    {
      "kind": "parameter",
      "pattern": "^\\s*(?:real|vector|matrix)[^;]*?\\s([A-Za-z_][A-Za-z0-9_]*)\\s*;"
    },
    {
      "kind": "model",
      "pattern": "^\\s*model\\s*\\{"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*#include\\s+([A-Za-z_][A-Za-z0-9_./-]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.stan",
      "content": "data {\n  int N;\n}\nparameters {\n  real theta;\n}\nmodel {\n  theta ~ normal(0, 1);\n}\n"
    },
    {
      "path": "tests/run.stan",
      "content": "data {\n  int N;\n}\nparameters {\n  real theta;\n}\nmodel {\n  theta ~ normal(0, 1);\n}\n"
    }
  ],
  "snippets": {
    "data": {
      "description": "data block",
      "body": "data {\n  int N;\n}"
    },
    "parameters": {
      "description": "parameters block",
      "body": "parameters {\n  real theta;\n}"
    },
    "model": {
      "description": "model block",
      "body": "model {\n  theta ~ normal(0, 1);\n}"
    }
  },
  "reference": "Stan syntax reference\n- Data: data { int N; }\n- Parameters: parameters { real theta; }\n- Model: model { theta ~ normal(0, 1); }\n- Generated quantities: generated quantities { ... }\n- Variable: real value;\n- Array: array[N] real values;\n- Function: real name(real value) { return value; }\n- Include: #include file.stan\n- Comment: // line; /* block */\n- Run: stanc file.stan"
}
