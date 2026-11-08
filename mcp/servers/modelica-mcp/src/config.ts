import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "modelica",
  "displayName": "Modelica",
  "version": "1.0.0",
  "extensions": [
    ".mo"
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
      "kind": "model",
      "pattern": "^\\s*(?:model|block|class|record|package|function)\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "connector",
      "pattern": "^\\s*connector\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*(?:Real|Integer|Boolean|String)\\s+([A-Za-z_][A-Za-z0-9_]*)"
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
      "path": "src/demo.mo",
      "content": "model Demo\n  Real x = 2 + 2;\nend Demo;\n"
    },
    {
      "path": "tests/run.mo",
      "content": "model Test\n  Real x = 2 + 2;\nend Test;\n"
    }
  ],
  "snippets": {
    "model": {
      "description": "model",
      "body": "model Name\n  Real value = 1;\nend Name;"
    },
    "connector": {
      "description": "connector",
      "body": "connector Name\n  Real value;\nend Name;"
    },
    "equation": {
      "description": "equation",
      "body": "equation\n  value = 2 + 2;"
    }
  },
  "reference": "Modelica syntax reference\n- Model: model Name ... end Name;\n- Block: block Name ... end Name;\n- Connector: connector Name ... end Name;\n- Variable: Real value = 1;\n- Equation: equation value = 2 + 2;\n- Import: import Modelica.Math;\n- Annotation: annotation(Icon());\n- Comment: // line; /* block */\n- Compile: omc file.mo"
}
