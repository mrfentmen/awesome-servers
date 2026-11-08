import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "processing",
  "displayName": "Processing",
  "version": "1.0.0",
  "extensions": [
    ".pde"
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
      "kind": "function",
      "pattern": "^\\s*(?:void|int|float|boolean|String|color)\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*\\("
    },
    {
      "kind": "class",
      "pattern": "^\\s*class\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*(?:int|float|boolean|String|color|PImage|PVector)\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*="
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
      "path": "src/demo.pde",
      "content": "void setup() {\n  size(100, 100);\n}\n\nvoid draw() {\n  background(220);\n}\n"
    },
    {
      "path": "tests/run.pde",
      "content": "void setup() {\n  size(100, 100);\n  exit();\n}\n"
    }
  ],
  "snippets": {
    "setup": {
      "description": "setup",
      "body": "void setup() {\n  size(400, 400);\n}"
    },
    "draw": {
      "description": "draw",
      "body": "void draw() {\n  background(220);\n}"
    },
    "class": {
      "description": "class",
      "body": "class Name {\n  Name() {\n  }\n}"
    }
  },
  "reference": "Processing syntax reference\n- Setup: void setup() { size(400, 400); }\n- Draw: void draw() { background(220); }\n- Variable: int value = 1;\n- Function: void name(int value) { ... }\n- Class: class Name { ... }\n- Conditional: if (condition) { ... }\n- Loop: for (int i = 0; i < 10; i++) { ... }\n- Import: import processing.opengl.*;\n- Comment: // line; /* block */\n- Run: processing-java --sketch=dir --run"
}
