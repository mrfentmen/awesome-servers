import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "meson",
  "displayName": "Meson",
  "version": "1.0.0",
  "extensions": [
    ".meson"
  ],
  "markers": [
    "meson.build",
    "meson_options.txt"
  ],
  "comment": "#",
  "stringQuotes": [
    "'",
    "\""
  ],
  "symbols": [
    {
      "kind": "project",
      "pattern": "^\\s*project\\s*\\(\\s*['\"]([^'\"]+)"
    },
    {
      "kind": "executable",
      "pattern": "^\\s*executable\\s*\\(\\s*['\"]([^'\"]+)"
    },
    {
      "kind": "library",
      "pattern": "^\\s*library\\s*\\(\\s*['\"]([^'\"]+)"
    },
    {
      "kind": "target",
      "pattern": "^\\s*custom_target\\s*\\(\\s*['\"]([^'\"]+)"
    },
    {
      "kind": "test",
      "pattern": "^\\s*test\\s*\\(\\s*['\"]([^'\"]+)"
    }
  ],
  "imports": [
    {
      "kind": "subdir",
      "pattern": "^\\s*subdir\\s*\\(\\s*['\"]([^'\"]+)"
    },
    {
      "kind": "dependency",
      "pattern": "^\\s*dependency\\s*\\(\\s*['\"]([^'\"]+)"
    },
    {
      "kind": "include",
      "pattern": "^\\s*include_directories\\s*\\(\\s*['\"]([^'\"]+)"
    }
  ],
  "build": [
    {
      "command": "meson",
      "args": [
        "setup",
        "{build}",
        "{dir}"
      ]
    },
    {
      "command": "meson",
      "args": [
        "compile",
        "-C",
        "{build}"
      ]
    }
  ],
  "test": [
    {
      "command": "meson",
      "args": [
        "test",
        "-C",
        "{build}"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "meson.build",
      "content": "project('{{name}}', meson_version: '>=1.0.0')\nmessage('Hello from Meson')\n"
    },
    {
      "path": "meson_options.txt",
      "content": "option('example', type: 'boolean', value: true)\n"
    },
    {
      "path": "tests/meson.build",
      "content": "test('smoke', find_program('true'))\n"
    }
  ],
  "snippets": {
    "project": {
      "description": "project",
      "body": "project('name', 'c')\nmessage('Hello')"
    },
    "executable": {
      "description": "executable target",
      "body": "executable('name', 'main.c')"
    },
    "dependency": {
      "description": "dependency",
      "body": "dependency('threads')"
    }
  },
  "reference": "Meson syntax reference\n- Project: project('name', 'c')\n- Executable: executable('name', 'main.c')\n- Library: library('name', 'source.c')\n- Dependency: dependency('threads')\n- Subdirectory: subdir('src')\n- Test: test('name', executable('test', 'test.c'))\n- Options: option('name', type: 'boolean', value: true)\n- Build: meson setup build && meson compile -C build"
}
