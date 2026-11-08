import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "csound-document",
  "displayName": "Csound Document",
  "version": "1.0.0",
  "extensions": [
    ".csd"
  ],
  "markers": [],
  "comment": ";",
  "stringQuotes": [
    "\""
  ],
  "symbols": [
    {
      "kind": "instrument",
      "pattern": "^\\s*instr\\s+([A-Za-z0-9_]+)"
    }
  ],
  "imports": [],
  "scaffold": [
    {
      "path": "src/demo.csd",
      "content": "<CsoundSynthesizer>\n<CsInstruments>\ninstr 1\n  print 2 + 2\nendin\n</CsInstruments>\n</CsoundSynthesizer>\n"
    },
    {
      "path": "tests/run.csd",
      "content": "<CsoundSynthesizer>\n<CsInstruments>\ninstr 1\n  print 2 + 2\nendin\n</CsInstruments>\n</CsoundSynthesizer>\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "<CsoundSynthesizer>\n<CsInstruments>\ninstr 1\n  print 2 + 2\nendin\n</CsInstruments>\n</CsoundSynthesizer>\n"
    }
  },
  "reference": "Csound Document syntax reference\n- Example: <CsoundSynthesizer>\n- Comment: ;\n- Run: csound {file}",
  "blockComment": {
    "start": "/*",
    "end": "*/"
  }
}
