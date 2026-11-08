import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "chapel",
  "displayName": "Chapel",
  "version": "1.0.0",
  "extensions": [
    ".chpl"
  ],
  "markers": [],
  "comment": "//",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  },
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*proc\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "iterator",
      "pattern": "^\\s*iter\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*(?:class|record)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "use",
      "pattern": "^\\s*use\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.chpl",
      "content": "proc add(a: int, b: int): int {\n  return a + b;\n}\n\nwriteln(add(2, 2));\n"
    },
    {
      "path": "tests/run.chpl",
      "content": "if 2 + 2 != 4 then halt('math failed');\nwriteln('ok');\n"
    }
  ],
  "snippets": {
    "procedure": {
      "description": "procedure",
      "body": "proc name(value: int): int {\n  return value + 1;\n}"
    },
    "module": {
      "description": "module",
      "body": "module Name {"
    },
    "loop": {
      "description": "for loop",
      "body": "for i in 1..10 {\n  writeln(i);\n}"
    }
  },
  "reference": "Chapel syntax reference\n- Module: module Name { ... }\n- Procedure: proc name(value: int): int { return value; }\n- Iterator: iter name() { yield 1; }\n- Class: class Name { var value: int; }\n- Variable: var name: int = 1;\n- Loop: for i in 1..10 { ... }\n- Use: use ModuleName;\n- Comment: // line; /* block */\n- Compile: chpl file.chpl"
}
