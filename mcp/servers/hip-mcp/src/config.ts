import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "hip",
  "displayName": "HIP",
  "version": "1.0.0",
  "extensions": [
    ".hip"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*__global__\\s+void\\s+([A-Za-z_]\\w*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.hip",
      "content": "__global__ void add(float* a, float* b) {\n  a[0] = a[0] + b[0];\n}\n"
    },
    {
      "path": "tests/run.hip",
      "content": "__global__ void add(float* a, float* b) {\n  a[0] = a[0] + b[0];\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "__global__ void add(float* a, float* b) {\n  a[0] = a[0] + b[0];\n}\n"
    }
  },
  "reference": "HIP syntax reference\n- Example: __global__ void add(float* a, float* b) {\n- Comment: //\n- Run: hipcc {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
