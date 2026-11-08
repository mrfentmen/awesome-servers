import type { LanguageConfig } from "./types.js"

export const config: LanguageConfig = {
  "slug": "fortran-free-form",
  "displayName": "Fortran Free Form",
  "version": "1.0.0",
  "extensions": [
    ".f90",
    ".f95",
    ".f03",
    ".f08"
  ],
  "markers": [],
  "comment": "!",
  "stringQuotes": [
    "\"",
    "'"
  ],
  "symbols": [
    {
      "kind": "module",
      "pattern": "^\\s*module\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "program",
      "pattern": "^\\s*program\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "subroutine",
      "pattern": "^\\s*subroutine\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "function",
      "pattern": "^\\s*(?:[A-Za-z_][A-Za-z0-9_]*\\s+)*function\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "type",
      "pattern": "^\\s*type\\s*(?:::)?\\s*([A-Za-z_][A-Za-z0-9_]*)"
    }
  ],
  "imports": [
    {
      "kind": "use",
      "pattern": "^\\s*use\\s+([A-Za-z_][A-Za-z0-9_]*)"
    },
    {
      "kind": "include",
      "pattern": "^\\s*include\\s+[\"']([^\"']+)"
    }
  ],
  "scaffold": [
    {
      "path": "src/demo.f90",
      "content": "module demo\n  implicit none\ncontains\n  function add(a, b) result(c)\n    integer, intent(in) :: a, b\n    integer :: c\n    c = a + b\n  end function add\nend module demo\n"
    },
    {
      "path": "tests/run.f90",
      "content": "program run\n  implicit none\n  if (2 + 2 /= 4) error stop 'math failed'\n  print *, 'ok'\nend program run\n"
    }
  ],
  "snippets": {
    "function": {
      "description": "function",
      "body": "function name(value) result(out)\n  integer, intent(in) :: value\n  integer :: out\n  out = value + 1\nend function name"
    },
    "subroutine": {
      "description": "subroutine",
      "body": "subroutine name(value)\n  integer, intent(inout) :: value\n  value = value + 1\nend subroutine name"
    },
    "module": {
      "description": "module",
      "body": "module name\n  implicit none\ncontains\nend module name"
    }
  },
  "reference": "Fortran Free Form syntax reference\n- Module: module name ... end module name\n- Program: program name ... end program name\n- Subroutine: subroutine name(value) ... end subroutine name\n- Function: function name(value) result(out) ... end function name\n- Variable: integer :: value\n- Conditional: if (condition) then ... end if\n- Loop: do i = 1, 10 ... end do\n- Use: use module_name\n- Comment: ! line\n- Compile: gfortran file.f90"
}
