import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "opencl",
  "displayName": "OpenCL",
  "version": "1.0.0",
  "extensions": [
    ".cl",
    ".opencl"
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
      "pattern": "^\\s*__kernel\\s+void\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:void|int|float|double)\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*\\("
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
      "path": "src/hello.cl",
      "content": "__kernel void hello(__global int *value) {\n  value[get_global_id(0)] = 1;\n}\n"
    },
    {
      "path": "tests/run.cl",
      "content": "__kernel void test(__global int *value) {\n  value[0] = 2 + 2;\n}\n"
    }
  ],
  "snippets": {
    "kernel": {
      "description": "kernel",
      "body": "__kernel void name(__global int *value) {\n  value[0] = 1;\n}"
    },
    "global": {
      "description": "global buffer",
      "body": "__global float *values"
    },
    "local": {
      "description": "local memory",
      "body": "__local float cache[256];"
    }
  },
  "reference": "OpenCL syntax reference\n- Kernel: __kernel void name(__global int *value) { ... }\n- Global memory: __global float *values\n- Local memory: __local float cache[256];\n- Index: get_global_id(0)\n- Barrier: barrier(CLK_LOCAL_MEM_FENCE);\n- Struct: struct Name { int value; };\n- Include: #include \"file.cl\"\n- Comment: // line; /* block */"
}
