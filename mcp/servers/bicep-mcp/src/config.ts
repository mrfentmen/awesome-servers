import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "bicep",
  "displayName": "Bicep",
  "version": "1.0.0",
  "extensions": [
    ".bicep",
    ".bicepparam"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "'"
  ],
  "symbols": [
    {
      "kind": "parameter",
      "pattern": "^\\s*param\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*var\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "resource",
      "pattern": "^\\s*resource\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "output",
      "pattern": "^\\s*output\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "build": [
    {
      "command": "bicep",
      "args": [
        "build",
        "{file}"
      ]
    }
  ],
  "test": [
    {
      "command": "bicep",
      "args": [
        "build",
        "tests/run.bicep"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "main.bicep",
      "content": "param location string = resourceGroup().location\noutput message string = 'Hello from Bicep'\n"
    },
    {
      "path": "tests/run.bicep",
      "content": "output value int = 2 + 2\n"
    }
  ],
  "snippets": {
    "parameter": {
      "description": "parameter",
      "body": "param name string = 'value'"
    },
    "resource": {
      "description": "resource",
      "body": "resource name 'Microsoft.Storage/storageAccounts@2023-01-01' = {\n  name: 'name'\n  location: location\n}"
    },
    "output": {
      "description": "output",
      "body": "output value string = 'hello'"
    }
  },
  "reference": "Bicep syntax reference\n- Parameter: param name string = 'value'\n- Variable: var name = 'value'\n- Resource: resource name 'Type@version' = { ... }\n- Module: module name './file.bicep' = { ... }\n- Output: output name string = value\n- Conditions: if (condition) { ... }\n- Loops: [for item in list: { ... }]\n- Build: bicep build file.bicep"
}
