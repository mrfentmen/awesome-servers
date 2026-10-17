# Bored MCP

Bored API activity suggestions: random activities, filter by type and participants. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `random_activity`  Get a random activity.
* `activity_by_type`  Get an activity of a type.
* `activity_by_participants`  Get an activity for N participants.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Bored API.


