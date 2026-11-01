import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  MicrocksError,
  createJob,
  createSecret,
  createTest,
  countServices,
  countTestResults,
  deleteJob,
  deleteSecret,
  deleteService,
  exportSnapshot,
  formatJob,
  formatJobs,
  formatMetrics,
  formatSecret,
  formatSecrets,
  formatService,
  formatServices,
  formatTestResult,
  formatTestResults,
  getConformanceAggregate,
  getFeaturesConfig,
  getGlobalInvocations,
  getJob,
  getLatestGlobalInvocations,
  getService,
  getServiceConformance,
  getServiceInvocations,
  getTopInvocations,
  importSnapshot,
  latestTestResults,
  listJobs,
  listResources,
  listServiceLabels,
  listServiceResources,
  listServices,
  listSecrets,
  listTestResults,
  searchServices,
  setJobState,
  updateJob,
  updateSecret,
  updateServiceMetadata,
} from "./api.js"

function text(value: string): { content: Array<{ type: "text"; text: string }> } {
  return { content: [{ type: "text", text: value }] }
}

function fail(message: string): {
  content: Array<{ type: "text"; text: string }>
  isError: true
} {
  return { content: [{ type: "text", text: message }], isError: true }
}

function errorMessage(e: unknown): string {
  if (e instanceof MicrocksError) return `Error: ${e.message}`
  if (e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

/** Snapshots and resource files can be large; keep the tool result readable. */
function clip(body: string, limit = 20000): string {
  if (body.length <= limit) return body
  return `${body.slice(0, limit)}\n… (truncated, ${body.length - limit} more characters)`
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "microcks-mcp", version: "1.0.0" })

  server.tool(
    "list_services",
    "List the APIs and services mocked by this Microcks instance, newest first. Optional filters: name and labels (comma-separated key=value pairs).",
    {
      name: z.string().optional().describe("Filter by service name (substring match)."),
      labels: z.string().optional().describe("Filter by labels, e.g. \"domain=payments,status=stable\"."),
    },
    async ({ name, labels }) => {
      try {
        return text(formatServices(await listServices(name, labels)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_services",
    "Search Microcks services by name. Use this when you only know part of the name.",
    { name: z.string().describe("Name or partial name to search for.") },
    async ({ name }) => {
      try {
        return text(formatServices(await searchServices(name)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "count_services",
    "Count the services registered in Microcks.",
    {},
    async () => {
      try {
        return text(`Services: ${await countServices()}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_service_labels",
    "List every label key already used by services in Microcks.",
    {},
    async () => {
      try {
        const labels = await listServiceLabels()
        if (labels.length === 0) return text("No service labels found.")
        return text(labels.map((label, index) => `${index + 1}. ${label}`).join("\n"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_service",
    "Get one Microcks service by its id, including type, version and labels.",
    { id: z.string().describe("Microcks service id (a UUID).") },
    async ({ id }) => {
      try {
        const service = await getService(id)
        if (!service) return fail(`Error: service ${id} not found.`)
        return text(formatService(service))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_service",
    "Delete a service from Microcks. Destructive: the mock endpoints for this service stop working.",
    { id: z.string().describe("Microcks service id to delete.") },
    async ({ id }) => {
      try {
        await deleteService(id)
        return text(`Service ${id} deleted.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "update_service_metadata",
    "Replace the metadata of a service (labels, annotations and similar key/value data).",
    {
      id: z.string().describe("Microcks service id."),
      metadata: z.record(z.unknown()).describe("Metadata object to store on the service."),
    },
    async ({ id, metadata }) => {
      try {
        const service = await updateServiceMetadata(id, metadata)
        return text(service ? formatService(service) : `Metadata updated for service ${id}.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_jobs",
    "List the import jobs that pull API definitions from Git repositories into Microcks.",
    {},
    async () => {
      try {
        return text(formatJobs(await listJobs()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_job",
    "Create an import job that regularly imports API artifacts from a Git repository.",
    {
      name: z.string().describe("Human-readable job name."),
      repository: z.string().describe("Git repository URL."),
      branch: z.string().optional().describe("Branch to import, default 'main'."),
      frequency: z.string().optional().describe("Cron-like import frequency, e.g. '0 0 * * *'."),
      active: z.boolean().optional().describe("Whether the job runs on schedule."),
    },
    async ({ name, repository, branch, frequency, active }) => {
      try {
        const body: Record<string, unknown> = { name, repository }
        if (branch !== undefined) body.branch = branch
        if (frequency !== undefined) body.frequency = frequency
        if (active !== undefined) body.active = active
        const job = await createJob(body)
        return text(job ? formatJob(job) : "Import job created.")
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_job",
    "Get one import job by id, including its last execution status.",
    { id: z.string().describe("Import job id.") },
    async ({ id }) => {
      try {
        const job = await getJob(id)
        if (!job) return fail(`Error: import job ${id} not found.`)
        return text(formatJob(job))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "update_job",
    "Update an import job. Microcks uses POST (not PUT) for job updates.",
    {
      id: z.string().describe("Import job id."),
      job: z.record(z.unknown()).describe("Full job object with the fields to change."),
    },
    async ({ id, job }) => {
      try {
        const updated = await updateJob(id, job)
        return text(updated ? formatJob(updated) : `Import job ${id} updated.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_job",
    "Delete an import job. Destructive: the job stops importing artifacts.",
    { id: z.string().describe("Import job id to delete.") },
    async ({ id }) => {
      try {
        await deleteJob(id)
        return text(`Import job ${id} deleted.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "activate_job",
    "Activate an import job so it runs on its schedule.",
    { id: z.string().describe("Import job id.") },
    async ({ id }) => {
      try {
        return text(await setJobState(id, "activate"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "start_job",
    "Start an import job immediately, outside its schedule.",
    { id: z.string().describe("Import job id.") },
    async ({ id }) => {
      try {
        return text(await setJobState(id, "start"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "stop_job",
    "Stop an import job so it no longer runs.",
    { id: z.string().describe("Import job id.") },
    async ({ id }) => {
      try {
        return text(await setJobState(id, "stop"))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_test",
    "Run a conformance test against a deployed endpoint for one Microcks service.",
    {
      serviceId: z.string().describe("Microcks service id to test."),
      testEndpoint: z.string().describe("Base URL of the deployed API to test against."),
      timeout: z.number().int().positive().optional().describe("Test timeout in milliseconds."),
    },
    async ({ serviceId, testEndpoint, timeout }) => {
      try {
        const result = await createTest(serviceId, testEndpoint, timeout)
        return text(result ? formatTestResult(result) : "Test requested.")
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_test_results",
    "List the conformance test results recorded for a service.",
    { serviceId: z.string().describe("Microcks service id.") },
    async ({ serviceId }) => {
      try {
        return text(formatTestResults(await listTestResults(serviceId)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "count_test_results",
    "Count how many conformance tests have been recorded for a service.",
    { serviceId: z.string().describe("Microcks service id.") },
    async ({ serviceId }) => {
      try {
        return text(`Test results: ${await countTestResults(serviceId)}`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "latest_test_results",
    "Show the most recent conformance test results across every service.",
    {},
    async () => {
      try {
        return text(formatTestResults(await latestTestResults()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_secrets",
    "List the secrets stored in Microcks (names only, never values).",
    {},
    async () => {
      try {
        return text(formatSecrets(await listSecrets()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "create_secret",
    "Create a secret that import jobs and tests can reference.",
    {
      name: z.string().describe("Secret name."),
      value: z.string().describe("Secret value."),
      description: z.string().optional().describe("Optional description."),
    },
    async ({ name, value, description }) => {
      try {
        const secret = await createSecret(name, value, description)
        return text(secret ? formatSecret(secret) : `Secret ${name} created.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "update_secret",
    "Replace the value of an existing Microcks secret.",
    {
      id: z.string().describe("Secret id."),
      value: z.string().describe("New secret value."),
      description: z.string().optional().describe("Optional new description."),
    },
    async ({ id, value, description }) => {
      try {
        const secret = await updateSecret(id, value, description)
        return text(secret ? formatSecret(secret) : `Secret ${id} updated.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "delete_secret",
    "Delete a Microcks secret. Destructive: anything referencing it will fail.",
    { id: z.string().describe("Secret id to delete.") },
    async ({ id }) => {
      try {
        await deleteSecret(id)
        return text(`Secret ${id} deleted.`)
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_conformance_aggregate",
    "Read the aggregate conformance metrics for the whole Microcks instance.",
    {},
    async () => {
      try {
        return text(formatMetrics(await getConformanceAggregate()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_service_conformance",
    "Read conformance metrics for one service.",
    { serviceId: z.string().describe("Microcks service id.") },
    async ({ serviceId }) => {
      try {
        return text(formatMetrics(await getServiceConformance(serviceId)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_global_invocations",
    "Read aggregated invocation statistics for a given day.",
    { day: z.number().int().optional().describe("Day as a Unix timestamp (seconds).") },
    async ({ day }) => {
      try {
        return text(formatMetrics(await getGlobalInvocations(day)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_latest_global_invocations",
    "Read invocation statistics for the most recent days.",
    {},
    async () => {
      try {
        return text(formatMetrics(await getLatestGlobalInvocations()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_top_invocations",
    "List the most-invoked services for a day.",
    {
      day: z.number().int().optional().describe("Day as a Unix timestamp (seconds)."),
      limit: z.number().int().positive().optional().describe("Maximum number of services to return."),
    },
    async ({ day, limit }) => {
      try {
        return text(formatMetrics(await getTopInvocations(day, limit)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_service_invocations",
    "Read invocation statistics for one service name and version.",
    {
      serviceName: z.string().describe("Service name."),
      serviceVersion: z.string().describe("Service version."),
    },
    async ({ serviceName, serviceVersion }) => {
      try {
        return text(formatMetrics(await getServiceInvocations(serviceName, serviceVersion)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_resources",
    "Fetch a stored artifact by name (openapi.yaml, postman.json, …) exactly as Microcks serves it.",
    { name: z.string().describe("Resource file name, e.g. 'openapi.yaml'.") },
    async ({ name }) => {
      try {
        return text(clip(await listResources(name)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "list_service_resources",
    "List the artifact resources attached to one service.",
    { serviceId: z.string().describe("Microcks service id.") },
    async ({ serviceId }) => {
      try {
        return text(clip(await listServiceResources(serviceId)))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "export_snapshot",
    "Export the whole Microcks repository as a YAML snapshot.",
    {},
    async () => {
      try {
        return text(clip(await exportSnapshot()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "import_snapshot",
    "Import a Microcks snapshot. Pass the YAML/JSON document itself, not a file path.",
    { snapshot: z.string().describe("Snapshot content (YAML or JSON) to import.") },
    async ({ snapshot }) => {
      try {
        return text(await importSnapshot(snapshot))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  server.tool(
    "get_features_config",
    "Read which optional Microcks features are enabled (async, AI copilot, …).",
    {},
    async () => {
      try {
        return text(formatMetrics(await getFeaturesConfig()))
      } catch (e) {
        return fail(errorMessage(e))
      }
    }
  )

  return server
}
