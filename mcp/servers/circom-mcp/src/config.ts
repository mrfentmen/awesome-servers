import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "circom",
  "displayName": "Circom",
  "version": "1.0.0",
  "extensions": [
    ".circom"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "template",
      "pattern": "^\\s*template\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "component",
      "pattern": "^\\s*component\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "signal",
      "pattern": "^\\s*signal\\s+(?:input|output)?\\s*([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*include\\s+\"([^\"]+)\""
    }
  ],
  "build": [
    {
      "command": "circom",
      "args": [
        "{file}"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "circuits/hello.circom",
      "content": "pragma circom 2.0.0;\n\ntemplate Hello() {\n    signal input value;\n    signal output doubled;\n    doubled <== value * 2;\n}\n\ncomponent main = Hello();\n"
    }
  ],
  "snippets": {
    "template": {
      "description": "template",
      "body": "template Name() {\n    signal input value;\n    signal output result;\n    result <== value * 2;\n}"
    },
    "component": {
      "description": "component",
      "body": "component main = Name();"
    },
    "constraint": {
      "description": "constraint",
      "body": "result <== value * 2;"
    }
  },
  "reference": "Circom syntax reference\n- Pragma: pragma circom 2.0.0;\n- Template: template Name() { ... }\n- Signal: signal input value; signal output result;\n- Constraint: result <== value * 2;\n- Component: component main = Name();\n- Array: signal input values[8];\n- Include: include \"file.circom\";\n- Build: circom file.circom"
}
