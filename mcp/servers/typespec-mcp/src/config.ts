import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "typespec",
  "displayName": "TypeSpec",
  "version": "1.0.0",
  "extensions": [
    ".tsp"
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
      "kind": "model",
      "pattern": "^\\s*model\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "enum",
      "pattern": "^\\s*enum\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "interface",
      "pattern": "^\\s*interface\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "operation",
      "pattern": "^\\s*op\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "import",
      "pattern": "^\\s*import\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.tsp",
      "content": "namespace Demo;\n\n@route(\"/demo\")\ninterface DemoApi {\n  @get op read(): string;\n}\n"
    },
    {
      "path": "tests/run.tsp",
      "content": "namespace Test;\n\nmodel Value {\n  value: int32;\n}\n"
    }
  ],
  "snippets": {
    "model": {
      "description": "model",
      "body": "model Name {\n  value: int32;\n}"
    },
    "operation": {
      "description": "operation",
      "body": "@get op read(): string;"
    },
    "namespace": {
      "description": "namespace",
      "body": "namespace Name;"
    }
  },
  "reference": "TypeSpec syntax reference\n- Namespace: namespace Name;\n- Model: model Name { value: int32; }\n- Enum: enum Name { One, Two }\n- Interface: interface Name { @get op read(): string; }\n- Operation: @get op read(): string;\n- Import: import \"file.tsp\";\n- Route: @route(\"/path\")\n- Comment: // line; /* block */\n- Compile: tsp compile file.tsp"
}
