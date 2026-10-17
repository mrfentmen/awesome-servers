# ICS Generator MCP

Generate real calendar event files in the standard ics format. Compatible with Google Calendar, Apple Calendar, and Outlook.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `create_event`  Create a calendar event with times and details.
* `create_reminder`  Create an all day reminder.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Output files are written to the system temp directory and the path is returned.


