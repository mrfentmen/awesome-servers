# Greenhouse MCP

Job postings from the public Greenhouse boards API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `jobs`  List open jobs on a company Greenhouse board, with location, departments and job ids.
* `job`  Get one job posting on a Greenhouse board, including the full description text.
* `search_jobs`  Search a company Greenhouse board by title, location, department or office.
* `departments`  List the teams hiring on a Greenhouse board, ranked by number of open roles.
* `offices`  List the office locations on a Greenhouse board.
* `board`  Show a company Greenhouse board: name, open job count and the company intro.
* `jobs_by_office`  List the open jobs attached to one office on a Greenhouse board, or to a matching location.
* `newest_jobs`  List the most recently opened jobs on a Greenhouse board, newest first.
* `job_questions`  Show the real application questions for one Greenhouse job, with which are required and the deadline.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Greenhouse API.


