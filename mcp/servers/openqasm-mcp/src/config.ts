import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "openqasm",
  "displayName": "OpenQASM",
  "version": "1.0.0",
  "extensions": [
    ".qasm"
  ],
  "markers": [],
  "comment": "//",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "gate",
      "pattern": "^\\s*gate\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "qubit",
      "pattern": "^\\s*qubit(?:\\[[^\\]]+\\])?\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "bit",
      "pattern": "^\\s*bit(?:\\[[^\\]]+\\])?\\s+([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*include\\s+\"([^\"]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.qasm",
      "content": "OPENQASM 3.0;\ninclude \"stdgates.inc\";\n\nqubit q;\nh q;\nmeasure q;\n"
    },
    {
      "path": "tests/run.qasm",
      "content": "OPENQASM 3.0;\ninclude \"stdgates.inc\";\n\nqubit q;\nx q;\n"
    }
  ],
  "snippets": {
    "qubit": {
      "description": "qubit",
      "body": "qubit q;"
    },
    "gate": {
      "description": "gate",
      "body": "gate name a {\n  h a;\n}"
    },
    "measure": {
      "description": "measure",
      "body": "measure q;"
    }
  },
  "reference": "OpenQASM syntax reference\n- Version: OPENQASM 3.0;\n- Include: include \"stdgates.inc\";\n- Qubit: qubit q;\n- Bit: bit c;\n- Gate: h q; cx q, r;\n- Custom gate: gate name a { h a; }\n- Measure: measure q;\n- Comment: // line\n- Run: qasm3-runner file.qasm"
}
