import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "abap",
  "displayName": "ABAP",
  "version": "1.0.0",
  "extensions": [
    ".abap"
  ],
  "markers": [],
  "comment": "*",
  "stringQuotes": [
    "'"
  ],
  "symbols": [
    {
      "kind": "report",
      "pattern": "^\\s*REPORT\\s+([A-Za-z0-9_]+)"
    },
    {
      "kind": "class",
      "pattern": "^\\s*CLASS\\s+([A-Za-z0-9_]+)"
    },
    {
      "kind": "method",
      "pattern": "^\\s*METHOD\\s+([A-Za-z0-9_]+)"
    },
    {
      "kind": "form",
      "pattern": "^\\s*FORM\\s+([A-Za-z0-9_]+)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*FUNCTION\\s+([A-Za-z0-9_]+)"
    },
    {
      "kind": "data",
      "pattern": "^\\s*DATA\\s+([A-Za-z0-9_]+)"
    }
  ],
  "imports": [
    {
      "kind": "include",
      "pattern": "^\\s*INCLUDE\\s+([A-Za-z0-9_]+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/zhello.abap",
      "content": "REPORT zhello.\nWRITE: / 'Hello from ABAP'.\n"
    },
    {
      "path": "src/ztest.abap",
      "content": "REPORT ztest.\nDATA result TYPE i.\nresult = 2 + 2.\nWRITE: / result.\n"
    }
  ],
  "snippets": {
    "report": {
      "description": "report",
      "body": "REPORT zname.\nWRITE: / 'Hello'."
    },
    "class": {
      "description": "class",
      "body": "CLASS lcl_demo DEFINITION.\n  PUBLIC SECTION.\n    METHODS greet.\nENDCLASS."
    },
    "data": {
      "description": "data",
      "body": "DATA value TYPE string VALUE 'text'."
    }
  },
  "reference": "ABAP syntax reference\n- Report: REPORT zname.\n- Write: WRITE: / 'text'.\n- Data: DATA value TYPE string.\n- Class: CLASS name DEFINITION. ... ENDCLASS.\n- Method: METHOD name. ... ENDMETHOD.\n- Form: FORM name. ... ENDFORM.\n- Include: INCLUDE name.\n- Comment: * full line; \" inline"
}
