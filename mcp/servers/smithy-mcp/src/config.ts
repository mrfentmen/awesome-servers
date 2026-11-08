import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "smithy",
  "displayName": "Smithy",
  "version": "1.0.0",
  "extensions": [
    ".smithy"
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
      "kind": "service",
      "pattern": "^\\s*service\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "structure",
      "pattern": "^\\s*structure\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "operation",
      "pattern": "^\\s*operation\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "resource",
      "pattern": "^\\s*resource\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "use",
      "pattern": "^\\s*use\\s+([A-Za-z_][A-Za-z0-9_.]*)"
    }
  ],
  "scaffold": [
    {
      "path": "model/demo.smithy",
      "content": "namespace demo\n\nstructure Demo {\n  value: Integer\n}\n"
    },
    {
      "path": "tests/run.smithy",
      "content": "namespace test\n\nstructure Test {\n  value: Integer\n}\n"
    }
  ],
  "snippets": {
    "structure": {
      "description": "structure",
      "body": "structure Name {\n  value: String\n}"
    },
    "service": {
      "description": "service",
      "body": "service Name {\n  version: \"1.0\"\n}"
    },
    "operation": {
      "description": "operation",
      "body": "operation Name {\n  input: Input\n  output: Output\n}"
    }
  },
  "reference": "Smithy syntax reference\n- Namespace: namespace demo\n- Service: service Name { version: \"1.0\" }\n- Structure: structure Name { value: String }\n- Operation: operation Name { input: Input output: Output }\n- Resource: resource Name { ... }\n- Use: use other.namespace#Name\n- Comment: // line; /* block */\n- Build: smithy build"
}
