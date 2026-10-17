# Wger MCP

Exercises, muscles, and workout data from the open wger database. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `exercises`  List exercises.
* `exercise`  Details for one exercise.
* `muscles`  List muscles.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public wger API. Fitness and workout databases charge elsewhere.


