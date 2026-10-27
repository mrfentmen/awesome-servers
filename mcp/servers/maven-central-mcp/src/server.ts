import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  artifactVersions,
  dependencySnippet,
  groupArtifacts,
  latestVersion,
  MavenError,
  searchArtifacts,
  searchByClass,
} from "./api.js"

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] })

function errorMessage(e: unknown): string {
  if (e instanceof MavenError || e instanceof Error) return `Error: ${e.message}`
  return `Error: ${String(e)}`
}

const groupArg = z.string().min(1).describe("groupId, e.g. com.google.guava")
const artifactArg = z.string().min(1).describe("artifactId, e.g. guava")

export function createServer(): McpServer {
  const server = new McpServer({ name: "@mrfentmen/maven-central-mcp", version: "1.0.0" })

  server.tool(
    "search_artifacts",
    "Search Maven Central with a Solr query (plain keywords, or g:/a:/fc: field queries).",
    {
      query: z.string().min(1).describe("Query, e.g. gson or g:com.squareup.retrofit2"),
      limit: z.number().int().min(1).max(50).default(10).describe("Results"),
    },
    async ({ query, limit }) => {
      try {
        return text(await searchArtifacts(query, limit))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "artifact_versions",
    "Published versions of one artifact, newest first.",
    {
      group_id: groupArg,
      artifact_id: artifactArg,
      limit: z.number().int().min(1).max(50).default(10).describe("Versions to return"),
    },
    async ({ group_id, artifact_id, limit }) => {
      try {
        return text(await artifactVersions(group_id, artifact_id, limit))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "latest_version",
    "Latest published version and update date for one artifact.",
    { group_id: groupArg, artifact_id: artifactArg },
    async ({ group_id, artifact_id }) => {
      try {
        return text(await latestVersion(group_id, artifact_id))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "group_artifacts",
    "Every artifact published under one groupId.",
    {
      group_id: groupArg,
      limit: z.number().int().min(1).max(100).default(20).describe("Artifacts to return"),
    },
    async ({ group_id, limit }) => {
      try {
        return text(await groupArtifacts(group_id, limit))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "search_by_class",
    "Find which artifact publishes a fully qualified Java class.",
    {
      class_name: z.string().min(3).describe("Fully qualified class, e.g. com.google.gson.Gson"),
      limit: z.number().int().min(1).max(20).default(10).describe("Results"),
    },
    async ({ class_name, limit }) => {
      try {
        return text(await searchByClass(class_name, limit))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  server.tool(
    "dependency_snippet",
    "Ready-to-paste pom.xml and build.gradle dependency blocks; uses the latest version when none is given.",
    {
      group_id: groupArg,
      artifact_id: artifactArg,
      version: z.string().optional().describe("Version; omit for the latest"),
    },
    async ({ group_id, artifact_id, version }) => {
      try {
        return text(await dependencySnippet(group_id, artifact_id, version))
      } catch (e) {
        return text(errorMessage(e))
      }
    }
  )

  return server
}
