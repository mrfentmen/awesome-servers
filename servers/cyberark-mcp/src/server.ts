import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  breachCatalog,
  breachDetail,
  checkPassword,
  checkPasswords,
  domainEmailSecurity,
  errorMessage,
  generatePassword,
  passwordStrength,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })
const textError = (t: string) => ({ content: [{ type: "text" as const, text: t }], isError: true as const })

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const

export function createServer(): McpServer {
  const server = new McpServer({
    name: "cyberark-mcp",
    version: "2.0.0",
  })

  server.registerTool(
    "check_password",
    {
      title: "Check if a password is breached",
      description: "Check a password against known data breaches using k-anonymity, so only five characters of its SHA-1 hash are sent and the password itself never leaves your machine. No API key needed.",
      inputSchema: z.object({
        password: z.string().describe("The password to check. It is hashed locally and never stored."),
      }),
      annotations: READ_ONLY,
    },
    async ({ password }) => {
      try {
        return text(await checkPassword({ password }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "check_passwords",
    {
      title: "Check several passwords",
      description: "Check up to 10 passwords for known breaches in one call and report how many have already been leaked.",
      inputSchema: z.object({
        passwords: z.array(z.string()).describe("Passwords to check, maximum 10."),
      }),
      annotations: READ_ONLY,
    },
    async ({ passwords }) => {
      try {
        return text(await checkPasswords({ passwords }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "password_strength",
    {
      title: "Score password strength",
      description: "Score a password offline: entropy, character classes, common-word, keyboard and sequence patterns, plus an estimated offline crack time and a clear verdict.",
      inputSchema: z.object({
        password: z.string().describe("The password to score. Analysis happens locally."),
      }),
      annotations: READ_ONLY,
    },
    async ({ password }) => {
      try {
        return text(await passwordStrength({ password }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "generate_password",
    {
      title: "Generate a strong password",
      description: "Generate a random password from a cryptographically secure source, with control over length and character classes, and report its estimated crack time.",
      inputSchema: z.object({
        length: z.number().describe("Password length, 8 to 128. Defaults to 20.").optional(),
        symbols: z.boolean().describe("Include symbols. Defaults to true.").optional(),
        digits: z.boolean().describe("Include digits. Defaults to true.").optional(),
        upperCase: z.boolean().describe("Include upper case letters. Defaults to true.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ length, symbols, digits, upperCase }) => {
      try {
        return text(await generatePassword({ length, symbols, digits, upperCase }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "breach_catalog",
    {
      title: "Browse known breaches",
      description: "List breaches from the Have I Been Pwned catalogue, largest first, filtered by company domain or year, with the number of accounts and the kinds of data exposed.",
      inputSchema: z.object({
        domain: z.string().describe("Filter by company domain, for example adobe.com.").optional(),
        year: z.number().describe("Filter by breach year, for example 2019.").optional(),
        limit: z.number().describe("How many breaches to list, 1 to 100. Defaults to 15.").optional(),
      }),
      annotations: READ_ONLY,
    },
    async ({ domain, year, limit }) => {
      try {
        return text(await breachCatalog({ domain, year, limit }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "breach_detail",
    {
      title: "Breach details",
      description: "Look up one breach by name and get its date, exposed account count, verification status and the classes of data leaked.",
      inputSchema: z.object({
        name: z.string().describe("Breach name such as LinkedIn or Adobe."),
      }),
      annotations: READ_ONLY,
    },
    async ({ name }) => {
      try {
        return text(await breachDetail({ name }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  server.registerTool(
    "domain_email_security",
    {
      title: "Domain email security audit",
      description: "Audit a domain's anti-spoofing setup: SPF, DMARC, DKIM selectors, MX records and CAA, graded A to F with the exact gaps to fix.",
      inputSchema: z.object({
        domain: z.string().describe("Domain to audit, for example example.com."),
      }),
      annotations: READ_ONLY,
    },
    async ({ domain }) => {
      try {
        return text(await domainEmailSecurity({ domain }))
      } catch (e) {
        return textError(errorMessage(e))
      }
    }
  )

  return server
}
