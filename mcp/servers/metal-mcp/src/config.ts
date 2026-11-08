import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "metal",
  "displayName": "Metal",
  "version": "1.0.0",
  "extensions": [
    ".metal"
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
      "kind": "kernel",
      "pattern": "^\\s*kernel\\s+void\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "vertex",
      "pattern": "^\\s*vertex\\s+[A-Za-z_][A-Za-z0-9_<>* ]*\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*\\("
    },
    {
      "kind": "fragment",
      "pattern": "^\\s*fragment\\s+[A-Za-z_][A-Za-z0-9_<>* ]*\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*\\("
    },
    {
      "kind": "struct",
      "pattern": "^\\s*struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*#include\\s*[<\"]([^>\"]+)[>\"]"
    }
  ],
  "scaffold": [
    {
      "path": "shaders/hello.metal",
      "content": "#include <metal_stdlib>\nusing namespace metal;\n\nkernel void hello(device int *value [[buffer(0)]],\n                  uint id [[thread_position_in_grid]]) {\n  value[id] = 1;\n}\n"
    },
    {
      "path": "shaders/pixel.metal",
      "content": "#include <metal_stdlib>\nusing namespace metal;\n\nfragment float4 main() {\n  return float4(1.0, 0.0, 0.0, 1.0);\n}\n"
    }
  ],
  "snippets": {
    "kernel": {
      "description": "kernel",
      "body": "kernel void name(device int *value [[buffer(0)]], uint id [[thread_position_in_grid]]) {\n  value[id] = 1;\n}"
    },
    "vertex": {
      "description": "vertex",
      "body": "vertex float4 name(uint id [[vertex_id]]) {\n  return float4(0.0);\n}"
    },
    "fragment": {
      "description": "fragment",
      "body": "fragment float4 name() {\n  return float4(1.0);\n}"
    }
  },
  "reference": "Metal syntax reference\n- Kernel: kernel void name(device int *value [[buffer(0)]]) { ... }\n- Vertex: vertex float4 name(uint id [[vertex_id]]) { ... }\n- Fragment: fragment float4 name() { ... }\n- Struct: struct Name { float4 value; };\n- Buffer: device float *values [[buffer(0)]]\n- Include: #include <metal_stdlib>\n- Namespace: using namespace metal;\n- Comment: // line; /* block */"
}
