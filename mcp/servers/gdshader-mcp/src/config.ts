import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "gdshader",
  "displayName": "GDShader",
  "version": "1.0.0",
  "extensions": [
    ".gdshader",
    ".gdshaderinc"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "function",
      "pattern": "^\\s*void\\s+([A-Za-z_]\\w*)\\s*\\("
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.gdshader",
      "content": "shader_type canvas_item;\nvoid fragment() {\n  COLOR = vec4(1.0);\n}\n"
    },
    {
      "path": "tests/run.gdshader",
      "content": "shader_type canvas_item;\nvoid fragment() {\n  COLOR = vec4(1.0);\n}\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "shader_type canvas_item;\nvoid fragment() {\n  COLOR = vec4(1.0);\n}\n"
    }
  },
  "reference": "GDShader syntax reference\n- Example: shader_type canvas_item;\n- Comment: //\n- No CLI runner configured",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
