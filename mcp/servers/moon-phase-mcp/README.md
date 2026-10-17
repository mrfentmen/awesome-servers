# Moon Phase MCP

Moon phase, illumination, and lunar age calculated locally from the calendar. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `moon_phase`  Current moon phase.
* `moon_on_date`  Moon phase for a date.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Phases are computed locally with a standard astronomical algorithm.


