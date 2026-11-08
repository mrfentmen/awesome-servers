import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "openscad",
  "displayName": "OpenSCAD",
  "version": "1.0.0",
  "extensions": [
    ".scad"
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
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*="
    }
  ],
  "imports": [
    {
      "kind": "use",
      "pattern": "^\\s*use\\s*<([^>]+)>"
    },
    {
      "kind": "include",
      "pattern": "^\\s*include\\s*<([^>]+)>"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.scad",
      "content": "module demo(size = 1) {\n  cube(size);\n}\n\ndemo(2);\n"
    },
    {
      "path": "tests/run.scad",
      "content": "assert(2 + 2 == 4);\necho(\"ok\");\n"
    }
  ],
  "snippets": {
    "module": {
      "description": "module",
      "body": "module name(size = 1) {\n  cube(size);\n}"
    },
    "function": {
      "description": "function",
      "body": "function name(value) = value + 1;"
    },
    "cube": {
      "description": "cube",
      "body": "cube([10, 10, 10]);"
    }
  },
  "reference": "OpenSCAD syntax reference\n- Module: module name(size = 1) { cube(size); }\n- Function: function name(value) = value + 1;\n- Variable: name = 1;\n- Cube: cube([10, 10, 10]);\n- Sphere: sphere(r = 5);\n- Translate: translate([1, 0, 0]) cube(1);\n- Use: use <library.scad>\n- Include: include <file.scad>\n- Comment: // line; /* block */\n- Render: openscad -o out.stl file.scad"
}
