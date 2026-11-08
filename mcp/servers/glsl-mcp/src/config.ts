import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "glsl",
  "displayName": "GLSL",
  "version": "1.0.0",
  "extensions": [
    ".glsl",
    ".vert",
    ".frag",
    ".geom",
    ".tesc",
    ".tese",
    ".comp"
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
      "pattern": "^\\s*(?:void|float|vec[234]|mat[234])\\s+([A-Za-z_][A-Za-z0-9_]*)\\s*\\("
    },
    {
      "kind": "uniform",
      "pattern": "^\\s*uniform\\s+[A-Za-z_][A-Za-z0-9_]*\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "input",
      "pattern": "^\\s*in\\s+[A-Za-z_][A-Za-z0-9_]*\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "output",
      "pattern": "^\\s*out\\s+[A-Za-z_][A-Za-z0-9_]*\\s+([A-Za-z_][A-Za-z0-9_]*)"
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
      "path": "shaders/hello.frag",
      "content": "#version 450\n\nlayout(location = 0) out vec4 color;\n\nvoid main() {\n  color = vec4(1.0, 0.0, 0.0, 1.0);\n}\n"
    },
    {
      "path": "shaders/hello.vert",
      "content": "#version 450\n\nlayout(location = 0) in vec3 position;\n\nvoid main() {\n  gl_Position = vec4(position, 1.0);\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "void name() {\n  color = vec4(1.0);\n}"
    },
    "uniform": {
      "description": "uniform",
      "body": "uniform mat4 transform;"
    },
    "output": {
      "description": "output",
      "body": "layout(location = 0) out vec4 color;"
    }
  },
  "reference": "GLSL syntax reference\n- Version: #version 450\n- Function: void main() { ... }\n- Uniform: uniform mat4 transform;\n- Input: layout(location = 0) in vec3 position;\n- Output: layout(location = 0) out vec4 color;\n- Vector: vec4(1.0, 0.0, 0.0, 1.0)\n- Include: #include \"file.glsl\"\n- Comment: // line; /* block */"
}
