import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "factor",
  "displayName": "Factor",
  "version": "1.0.0",
  "extensions": [
    ".factor"
  ],
  "markers": [],
  "comment": "!",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*:\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "tuple",
      "pattern": "^\\s*TUPLE:\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "generic",
      "pattern": "^\\s*GENERIC:\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    },
    {
      "kind": "symbol",
      "pattern": "^\\s*SYMBOL:\\s+([A-Za-z_][A-Za-z0-9_-]*)"
    }
  ],
  "imports": [
    {
      "kind": "using",
      "pattern": "^\\s*USING:\\s+([A-Za-z_][A-Za-z0-9_.\\s]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.factor",
      "content": "USING: math prettyprint ;\nIN: demo\n\n: add ( a b -- c ) + ;\n\n2 2 add .\n"
    },
    {
      "path": "tests/run.factor",
      "content": "USING: math prettyprint ;\nIN: run\n\n2 2 + .\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "word",
      "body": ": name ( value -- result ) 1 + ;"
    },
    "tuple": {
      "description": "tuple",
      "body": "TUPLE: name value ;"
    },
    "using": {
      "description": "vocabulary",
      "body": "USING: math prettyprint ;"
    }
  },
  "reference": "Factor syntax reference\n- Word: : name ( value -- result ) 1 + ;\n- Vocabulary: USING: math prettyprint ;\n- Namespace: IN: name\n- Tuple: TUPLE: name value ;\n- Generic: GENERIC: name ( value -- )\n- Stack: 2 2 + .\n- Comment: ! line\n- Run: factor file.factor"
}
