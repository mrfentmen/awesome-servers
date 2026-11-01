import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  RedirectionError,
  cancelCrawl,
  clearRuleSetVersion,
  createCrawl,
  createImport,
  createInvitation,
  createProject,
  createRuleChange,
  deleteProject,
  deleteRuleChange,
  explainUrls,
  exportRules,
  formatAgentRules,
  formatAggregateLogs,
  formatCrawl,
  formatCrawls,
  formatCrawlUrls,
  formatExplanations,
  formatImpact,
  formatImport,
  formatImports,
  formatInstances,
  formatInvitation,
  formatInvitations,
  formatProject,
  formatProjects,
  formatRule,
  formatRuleChange,
  formatRuleChanges,
  formatRuleSetVersion,
  formatRuleSetVersions,
  formatRules,
  formatUnknown,
  getAggregateLog,
  getCrawl,
  getImpactAnalysis,
  getImport,
  getInstance,
  getProject,
  getRule,
  getRuleChange,
  getRuleSetVersion,
  getRuleStatistics,
  getUrlExplanation,
  impactOfRuleChanges,
  listAgentRuleComplexes,
  listAgentRuleStraights,
  listAgentRules,
  listAggregateLogs,
  listCrawlUrls,
  listCrawls,
  listImports,
  listInstances,
  listInvitations,
  listProjects,
  listRuleChanges,
  listRuleSetVersions,
  listRules,
  publishRuleSetVersion,
  updateInstance,
  updateProject,
} from "./api.js"

function text(body: string) {
  return { content: [{ type: "text" as const, text: body }] }
}

function fail(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true }
}

function errorMessage(e: unknown): string {
  if (e instanceof RedirectionError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

const idSchema = z.string().min(1).describe("redirection.io object id.")
const limitSchema = z.number().int().min(1).max(100).optional().describe("Page size (1-100).")
const pageSchema = z.number().int().min(1).optional().describe("Page number, starting at 1.")
const bodySchema = z
  .record(z.unknown())
  .describe("Request body as a JSON object, passed through to the redirection.io API.")

export function createServer(): McpServer {
  const server = new McpServer({
    name: "redirection-mcp",
    version: "1.0.0",
  })

  server.tool(
    "list_projects",
    "List redirection.io projects visible to the API token.",
    { limit: limitSchema, page: pageSchema },
    async ({ limit, page }) => {
      try {
        return text(formatProjects(await listProjects(limit, page)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_project",
    "Create a new redirection.io project.",
    { body: bodySchema },
    async ({ body }) => {
      try {
        return text(formatProject(await createProject(body)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_project",
    "Get a single redirection.io project by id.",
    { id: idSchema },
    async ({ id }) => {
      try {
        return text(formatProject(await getProject(id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "update_project",
    "Update a redirection.io project. Sends a full replacement body.",
    { id: idSchema, body: bodySchema },
    async ({ id, body }) => {
      try {
        return text(formatProject(await updateProject(id, body)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_project",
    "Delete a redirection.io project. Destructive: this removes the project and its rules.",
    { id: idSchema },
    async ({ id }) => {
      try {
        await deleteProject(id)
        return text(`Deleted project ${id}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_rules",
    "List redirect rules across the account.",
    { limit: limitSchema, page: pageSchema },
    async ({ limit, page }) => {
      try {
        return text(formatRules(await listRules(limit, page)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_rule",
    "Get a single redirect rule by id.",
    { id: idSchema },
    async ({ id }) => {
      try {
        return text(formatRule(await getRule(id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_rule_changes",
    "List draft rule changes that have not been published yet.",
    { limit: limitSchema, page: pageSchema },
    async ({ limit, page }) => {
      try {
        return text(formatRuleChanges(await listRuleChanges(limit, page)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_rule_change",
    "Create a draft rule change. Changes only affect live traffic once published through a rule-set version.",
    { body: bodySchema },
    async ({ body }) => {
      try {
        return text(formatRuleChange(await createRuleChange(body)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_rule_change",
    "Get a single draft rule change by id.",
    { id: idSchema },
    async ({ id }) => {
      try {
        return text(formatRuleChange(await getRuleChange(id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_rule_change",
    "Delete a draft rule change. Destructive and not reversible.",
    { id: idSchema },
    async ({ id }) => {
      try {
        await deleteRuleChange(id)
        return text(`Deleted rule change ${id}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_rule_set_versions",
    "List rule-set versions for the account.",
    { limit: limitSchema, page: pageSchema },
    async ({ limit, page }) => {
      try {
        return text(formatRuleSetVersions(await listRuleSetVersions(limit, page)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_rule_set_version",
    "Get a single rule-set version by id.",
    { id: idSchema },
    async ({ id }) => {
      try {
        return text(formatRuleSetVersion(await getRuleSetVersion(id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "publish_rule_set_version",
    "Publish a rule-set version. This changes live redirect behaviour for every project in the version.",
    { id: idSchema },
    async ({ id }) => {
      try {
        return text(`Published.\n${formatRuleSetVersion(await publishRuleSetVersion(id))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "clear_rule_set_version",
    "Clear a rule-set version, removing its rules from the live configuration.",
    { id: idSchema },
    async ({ id }) => {
      try {
        return text(`Cleared.\n${formatRuleSetVersion(await clearRuleSetVersion(id))}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "export_rules",
    "Export the current rule set as a portable document.",
    {},
    async () => {
      try {
        return text(formatUnknown("Exported rules", await exportRules()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_rule_statistics",
    "Read hit statistics, for one rule when an id is given and account-wide otherwise.",
    { id: z.string().min(1).optional().describe("Optional rule id to scope the statistics.") },
    async ({ id }) => {
      try {
        return text(formatUnknown("Rule statistics", await getRuleStatistics(id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_crawls",
    "List site crawls and their status.",
    { limit: limitSchema, page: pageSchema },
    async ({ limit, page }) => {
      try {
        return text(formatCrawls(await listCrawls(limit, page)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_crawl",
    "Start a new site crawl. The body carries the crawl target and options.",
    { body: bodySchema },
    async ({ body }) => {
      try {
        return text(formatCrawl(await createCrawl(body)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_crawl",
    "Get a single crawl by id.",
    { id: idSchema },
    async ({ id }) => {
      try {
        return text(formatCrawl(await getCrawl(id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "cancel_crawl",
    "Cancel a running crawl.",
    { id: idSchema },
    async ({ id }) => {
      try {
        return text(formatCrawl(await cancelCrawl(id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_crawl_urls",
    "List URLs discovered by crawls.",
    { limit: limitSchema, page: pageSchema },
    async ({ limit, page }) => {
      try {
        return text(formatCrawlUrls(await listCrawlUrls(limit, page)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_imports",
    "List rule imports and their status.",
    { limit: limitSchema, page: pageSchema },
    async ({ limit, page }) => {
      try {
        return text(formatImports(await listImports(limit, page)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_import",
    "Import rules from a document. The body carries the source format and payload.",
    { body: bodySchema },
    async ({ body }) => {
      try {
        return text(formatImport(await createImport(body)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_import",
    "Get a single import job by id.",
    { id: idSchema },
    async ({ id }) => {
      try {
        return text(formatImport(await getImport(id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "explain_urls",
    "Explain how the current rule set resolves one or more URLs, without changing anything.",
    { body: bodySchema },
    async ({ body }) => {
      try {
        return text(formatExplanations(await explainUrls(body)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_url_explanation",
    "Get a stored URL explanation by id.",
    { id: idSchema },
    async ({ id }) => {
      try {
        return text(formatExplanations([await getUrlExplanation(id)]))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "impact_of_rule_changes",
    "Estimate which rules and URLs a set of rule changes would affect before publishing.",
    { body: bodySchema },
    async ({ body }) => {
      try {
        return text(formatImpact(await impactOfRuleChanges(body)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_impact_analysis",
    "Get a stored impact analysis by id.",
    { id: idSchema },
    async ({ id }) => {
      try {
        return text(formatImpact(await getImpactAnalysis(id)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_instances",
    "List redirection.io agents and instances reporting to the account.",
    { limit: limitSchema, page: pageSchema },
    async ({ limit, page }) => {
      try {
        return text(formatInstances(await listInstances(limit, page)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_instance",
    "Get a single agent instance by id.",
    { id: idSchema },
    async ({ id }) => {
      try {
        return text(formatInstances([await getInstance(id)]))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "update_instance",
    "Update an agent instance, for example its name or settings.",
    { id: idSchema, body: bodySchema },
    async ({ id, body }) => {
      try {
        return text(formatInstances([await updateInstance(id, body)]))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_aggregate_logs",
    "List aggregated request logs (hits and misses) for the account.",
    { limit: limitSchema, page: pageSchema },
    async ({ limit, page }) => {
      try {
        return text(formatAggregateLogs(await listAggregateLogs(limit, page)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_aggregate_log",
    "Get one aggregated log entry by id.",
    { id: idSchema },
    async ({ id }) => {
      try {
        return text(formatAggregateLogs([await getAggregateLog(id)]))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_invitations",
    "List pending and accepted account invitations.",
    { limit: limitSchema, page: pageSchema },
    async ({ limit, page }) => {
      try {
        return text(formatInvitations(await listInvitations(limit, page)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "invite_user",
    "Invite a user to the account. The body carries the email address and role.",
    { body: bodySchema },
    async ({ body }) => {
      try {
        return text(formatInvitation(await createInvitation(body)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_agent_rules",
    "List the rules currently loaded by agents.",
    { limit: limitSchema, page: pageSchema },
    async ({ limit, page }) => {
      try {
        return text(formatAgentRules(await listAgentRules(limit, page)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_agent_rule_straights",
    "List straight (single-step) agent rules.",
    { limit: limitSchema, page: pageSchema },
    async ({ limit, page }) => {
      try {
        return text(formatAgentRules(await listAgentRuleStraights(limit, page)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_agent_rule_complexes",
    "List complex (multi-condition) agent rules.",
    { limit: limitSchema, page: pageSchema },
    async ({ limit, page }) => {
      try {
        return text(formatAgentRules(await listAgentRuleComplexes(limit, page)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
