import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "beef",
  "displayName": "Beef",
  "version": "1.0.0",
  "extensions": [
    ".bf"
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
      "kind": "namespace",
      "pattern": "^\\s*namespace\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*(?:class|struct|interface|enum)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:public\\s+|private\\s+|static\\s+)*[A-Za-z_][A-Za-z0-9_<>\\[\\].]*\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*\\("
    }
  ],
  "imports": [
    {
      "kind": "using",
      "pattern": "^\\s*using\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "src/Demo.bf",
      "content": "namespace Demo;\n\nclass Program {\n  static int Add(int a, int b) { return a + b; }\n}\n"
    },
    {
      "path": "tests/Test.bf",
      "content": "namespace Test;\n\nclass Program {\n  static int Value() { return 2 + 2; }\n}\n"
    }
  ],
  "snippets": {
    "class": {
      "description": "class",
      "body": "class Name {\n  public int value;\n}"
    },
    "function": {
      "description": "function",
      "body": "static int Name(int value) { return value + 1; }"
    },
    "namespace": {
      "description": "namespace",
      "body": "namespace Name;"
    }
  },
  "reference": "Beef syntax reference\n- Namespace: namespace Name;\n- Class: class Name { public int value; }\n- Struct: struct Name { public int value; }\n- Function: static int Name(int value) { return value + 1; }\n- Variable: int value = 1;\n- Conditional: if (condition) { ... }\n- Loop: for (int i = 0; i < 10; i++) { ... }\n- Using: using System;\n- Comment: // line; /* block */\n- Compile: BeefBuild file.bf"
}
