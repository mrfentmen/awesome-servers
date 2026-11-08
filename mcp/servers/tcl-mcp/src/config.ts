import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "tcl",
  "displayName": "Tcl",
  "version": "1.0.0",
  "extensions": [
    ".tcl",
    ".tm"
  ],
  "markers": [
    "pkgIndex.tcl"
  ],
  "comment": "#",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "procedure",
      "pattern": "^\\s*proc\\s+([A-Za-z_:][A-Za-z0-9_:]*)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*oo::class\\s+create\\s+([A-Za-z_:][A-Za-z0-9_:]*)"
    },
    {
      "kind": "method",
      "pattern": "^\\s*method\\s+([A-Za-z_:][A-Za-z0-9_:]*)"
    },
    {
      "kind": "namespace",
      "pattern": "^\\s*namespace\\s+eval\\s+([A-Za-z_:][A-Za-z0-9_:]*)"
    },
    {
      "kind": "variable",
      "pattern": "^\\s*(?:set|variable)\\s+([A-Za-z_:][A-Za-z0-9_:]*)"
    }
  ],
  "imports": [
    {
      "kind": "package",
      "pattern": "^\\s*package\\s+require\\s+([^\\s;]+)"
    },
    {
      "kind": "source",
      "pattern": "^\\s*source\\s+(.+)$"
    },
    {
      "kind": "namespace import",
      "pattern": "^\\s*namespace\\s+import\\s+(.+)$"
    }
  ],
  "runner": [
    {
      "command": "tclsh",
      "args": [
        "{file}"
      ]
    }
  ],
  "test": [
    {
      "command": "tclsh",
      "args": [
        "tests/all.tcl"
      ]
    }
  ],
  "scaffold": [
    {
      "path": "main.tcl",
      "content": "#!/usr/bin/env tclsh\npackage require Tcl 8.6\n\nproc main {argv} {\n    puts \"Hello from Tcl\"\n}\n\nmain $argv\n"
    },
    {
      "path": "tests/all.tcl",
      "content": "package require tcltest\ntcltest::test hello {basic smoke} -body {expr {2 + 2}} -result 4\ntcltest::cleanupTests\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "procedure",
      "body": "proc name {args} {\n    # body\n}"
    },
    "namespace": {
      "description": "namespace",
      "body": "namespace eval name {\n    # body\n}"
    },
    "oop": {
      "description": "class",
      "body": "oo::class create Name {\n    method run {} {\n        # body\n    }\n}"
    }
  },
  "reference": "Tcl syntax reference\n- Commands: command arg1 arg2\n- Variables: set name value; puts $name\n- Substitution: [command] and ${name}\n- Literal strings: {braces}\n- Lists: list, lappend, lindex, llength\n- Control: if {condition} {body}; foreach item $list {body}\n- Procedures: proc name {args} {body}\n- Namespaces: namespace eval name {body}\n- Packages: package require name"
}
