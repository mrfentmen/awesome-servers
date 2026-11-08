import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "wgsl",
  "displayName": "WGSL",
  "version": "1.0.0",
  "extensions": [
    ".wgsl"
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
      "pattern": "^\\s*fn\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "struct",
      "pattern": "^\\s*struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "constant",
      "pattern": "^\\s*const\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*var\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "shaders/hello.wgsl",
      "content": "@group(0) @binding(0) var<storage, read_write> values: array<u32>;\n\n@compute @workgroup_size(1)\nfn main() {\n  values[0] = 1u;\n}\n"
    },
    {
      "path": "shaders/pixel.wgsl",
      "content": "@fragment\nfn main() -> @location(0) vec4<f32> {\n  return vec4<f32>(1.0, 0.0, 0.0, 1.0);\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "fn name(value: u32) -> u32 {\n  return value + 1u;\n}"
    },
    "compute": {
      "description": "compute entry point",
      "body": "@compute @workgroup_size(1)\nfn main() {\n}"
    },
    "struct": {
      "description": "struct",
      "body": "struct Name {\n  value: u32,\n}"
    }
  },
  "reference": "WGSL syntax reference\n- Function: fn name(value: u32) -> u32 { return value; }\n- Compute: @compute @workgroup_size(1) fn main() { }\n- Vertex: @vertex fn main() -> @builtin(position) vec4<f32> { ... }\n- Fragment: @fragment fn main() -> @location(0) vec4<f32> { ... }\n- Struct: struct Name { value: u32, }\n- Binding: @group(0) @binding(0) var<storage> values: array<u32>;\n- Comment: // line; /* block */\n- Tool: naga file.wgsl"
}
