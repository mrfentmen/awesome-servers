# Cyberark MCP

## Tagline
Password breach checks and identity security audits - no API key.

## Description
Audit secrets and identity hygiene from your AI assistant: check passwords against known breaches with k-anonymity, score password strength offline, generate strong passwords, browse the breach catalogue, and grade a domain SPF, DMARC, DKIM and CAA setup. No account or key. An independent MCP server. Not affiliated with or endorsed by CyberArk.

## Setup Requirements
No setup. Breach lookups use the public k-anonymity API and the rest runs locally.

## Category
Developer Tools

## Features

- Check if a password is breached: Check a password against known data breaches using k-anonymity, so only five characters of its SHA-1 hash are sent and the password itself never leaves your machine. No API key needed.
- Check several passwords: Check up to 10 passwords for known breaches in one call and report how many have already been leaked.
- Score password strength: Score a password offline: entropy, character classes, common-word, keyboard and sequence patterns, plus an estimated offline crack time and a clear verdict.
- Generate a strong password: Generate a random password from a cryptographically secure source, with control over length and character classes, and report its estimated crack time.
- Browse known breaches: List breaches from the Have I Been Pwned catalogue, largest first, filtered by company domain or year, with the number of accounts and the kinds of data exposed.
- Breach details: Look up one breach by name and get its date, exposed account count, verification status and the classes of data leaked.
- Domain email security audit: Audit a domain's anti-spoofing setup: SPF, DMARC, DKIM selectors, MX records and CAA, graded A to F with the exact gaps to fix.
- Identify a hash: Identify the likely algorithm behind a hash string — bcrypt, Argon2, crypt formats, MD5, SHA-1, SHA-256, SHA-512 and more — entirely offline.
- Hash text: Compute MD5, SHA-1, SHA-256 or SHA-512 digests of a string locally, for checksum and fingerprint checks.
- Breach timeline: Year-by-year view of known breaches from Have I Been Pwned: how many sites were breached and how many accounts were exposed.
- Subdomain inventory: Resolve common subdomains of a domain and show what each points to, flagging third-party CNAME targets that no longer resolve.

## Getting Started

- Ask your assistant about cyberark using this server once installed
- Tool: check_password — Check a password against known data breaches using k-anonymity, so only five characters of its SHA-1 hash are sent and the password itself never leaves your machine. No API key needed.
- Tool: check_passwords — Check up to 10 passwords for known breaches in one call and report how many have already been leaked.
- Tool: password_strength — Score a password offline: entropy, character classes, common-word, keyboard and sequence patterns, plus an estimated offline crack time and a clear verdict.
- Tool: generate_password — Generate a random password from a cryptographically secure source, with control over length and character classes, and report its estimated crack time.
- Tool: breach_catalog — List breaches from the Have I Been Pwned catalogue, largest first, filtered by company domain or year, with the number of accounts and the kinds of data exposed.
- Tool: breach_detail — Look up one breach by name and get its date, exposed account count, verification status and the classes of data leaked.
- Tool: domain_email_security — Audit a domain's anti-spoofing setup: SPF, DMARC, DKIM selectors, MX records and CAA, graded A to F with the exact gaps to fix.
- Tool: identify_hash — Identify the likely algorithm behind a hash string — bcrypt, Argon2, crypt formats, MD5, SHA-1, SHA-256, SHA-512 and more — entirely offline.
- Tool: hash_text — Compute MD5, SHA-1, SHA-256 or SHA-512 digests of a string locally, for checksum and fingerprint checks.
- Tool: breach_timeline — Year-by-year view of known breaches from Have I Been Pwned: how many sites were breached and how many accounts were exposed.
- Tool: subdomain_inventory — Resolve common subdomains of a domain and show what each points to, flagging third-party CNAME targets that no longer resolve.

## Tags
security, passwords, breach, dns, spf, mcp

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/cyberark-mcp
