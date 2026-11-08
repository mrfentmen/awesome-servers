import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "sourcepawn",
  "displayName": "SourcePawn",
  "version": "1.0.0",
  "extensions": [
    ".sp",
    ".inc"
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
      "pattern": "^\\s*(?:public|stock|static|native|forward)\\s+(?:[A-Za-z_][A-Za-z0-9_<>\\[\\]]*\\s+)?([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "methodmap",
      "pattern": "^\\s*methodmap\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "enum",
      "pattern": "^\\s*enum\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*#include\\s+<([^>]+)>"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.sp",
      "content": "#include <sourcemod>\n\npublic int Add(int a, int b)\n{\n    return a + b;\n}\n"
    },
    {
      "path": "tests/run.sp",
      "content": "#include <sourcemod>\n\npublic int Value()\n{\n    return 2 + 2;\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "public int Name(int value)\n{\n    return value + 1;\n}"
    },
    "methodmap": {
      "description": "methodmap",
      "body": "methodmap Name < Handle {\n    public Name() { }\n}"
    },
    "include": {
      "description": "include",
      "body": "#include <sourcemod>"
    }
  },
  "reference": "SourcePawn syntax reference\n- Function: public int Name(int value) { return value + 1; }\n- Methodmap: methodmap Name < Handle { ... }\n- Enum: enum Name { Value = 1 }\n- Native: native int Name(int value);\n- Forward: forward void Name();\n- Include: #include <sourcemod>\n- Comment: // line; /* block */\n- Compile: spcomp file.sp"
}
