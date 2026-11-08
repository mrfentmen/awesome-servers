import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "cuda",
  "displayName": "CUDA",
  "version": "1.0.0",
  "extensions": [
    ".cu",
    ".cuh"
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
      "pattern": "^\\s*__global__\\s+void\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "device",
      "pattern": "^\\s*__device__\\s+[A-Za-z_][A-Za-z0-9_<>* ]*\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*\\("
    },
    {
      "kind": "struct",
      "pattern": "^\\s*struct\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:void|int|float|double)\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*\\("
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
      "path": "src/hello.cu",
      "content": "#include <cstdio>\n\n__global__ void hello() {\n  printf(\"Hello from CUDA\\n\");\n}\n\nint main() {\n  hello<<<1, 1>>>();\n  return 0;\n}\n"
    },
    {
      "path": "tests/run.cu",
      "content": "__global__ void test() {\n  int value = 2 + 2;\n}\n"
    }
  ],
  "snippets": {
    "kernel": {
      "description": "kernel",
      "body": "__global__ void name(int *value) {\n  *value = 1;\n}"
    },
    "launch": {
      "description": "launch",
      "body": "name<<<blocks, threads>>>(value);"
    },
    "struct": {
      "description": "struct",
      "body": "struct Name {\n  int value;\n};"
    }
  },
  "reference": "CUDA syntax reference\n- Kernel: __global__ void name(int *value) { ... }\n- Launch: name<<<blocks, threads>>>(value);\n- Device: __device__ int name(int value) { ... }\n- Host: __host__ void name() { ... }\n- Struct: struct Name { int value; };\n- Include: #include <cuda_runtime.h>\n- Comment: // line; /* block */\n- Compile: nvcc file.cu"
}
